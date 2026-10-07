# SONIC MEDIA PIPELINE — Architecture & Operations
**2026-10-07 · Principal-level deep-dive of SonicStream's multimedia stack. 100% OSS. All fixes in this commit are live code, not proposals.**

Objective: automated audio mastering + adaptive HTTP streaming.
Targets: batch processing (upload→live in minutes) · single 0.5-vCPU headless Docker container (Render) · AAC/HLS delivery, MP3 preview, WAV mezzanine.

---

## 0. Defects found in the deep-dive (all fixed in this commit)

| # | Defect | Impact | Fix |
|---|--------|--------|-----|
| 1 | **ffmpeg/ffprobe never installed in the production image** | Every transcode, preview and mastering job died with ENOENT since first deploy | `apk add --no-cache ffmpeg` in Dockerfile.prod |
| 2 | `-profile:v baseline` (a *video* flag) on audio-only HLS | Noise/fragile command | Removed; proper audio ladder |
| 3 | DASH pass generated for a player that never requests DASH | 2× CPU per track on a 0.5-vCPU box | Dropped; `/api/stream/*.mpd` already answers honest 404 |
| 4 | No loudness control | Tracks play at wildly different volumes | EBU R128 two-pass `loudnorm` to **-14 LUFS / -1 dBTP** (streaming standard) |
| 5 | Single-bitrate HLS | Buffering on bad networks, wasted bytes on good ones | 3-rung adaptive ladder (256/128/64 kbps AAC) + master playlist |
| 6 | `status = "live"` double-quoted SQL literals (×29 across 12 files) | On Postgres, `"live"` is a **column** → every one of these UPDATE/SELECTs crashed in prod | All 29 parameterized/single-quoted |
| 7 | 2-D visualizer allocated a `Uint8Array` **every frame** | GC stutter — dropped frames on mobile | Hoisted to one allocation |
| 8 | No 3D visualizer despite three.js shipped in the bundle | Dead weight | `SonicVisualizer3D` added as a player mode |

---

## 1. Component architecture (requirement → OSS choice → why)

| Function | OSS component | Justification (memory / throughput) |
|---|---|---|
| Transcode, loudness, preview | **FFmpeg (CLI, spawned)** | One short-lived process per job: RSS returns to zero between jobs — on a 512 MB container that beats GStreamer's resident pipeline graph. No C bindings to crash Node. Everything needed (aac, libmp3lame, hls muxer, loudnorm, asplit) is in Alpine's ffmpeg. |
| Signal probe at upload | **ffprobe** (`server/middleware/ingestionGuard.ts`) | Metadata-only parse, <10 MB RSS, milliseconds. |
| Job orchestration | **BullMQ + Valkey** (`sonicstream-kv-oregon`) | Persistent queue with progress events; concurrency 1 pins transcode CPU so the API stays responsive on the shared vCPU. |
| Delivery | **Express static + HLS** | Segmented `.ts` over plain HTTPS; any CDN can cache it later. `hls.js` in the player, native HLS on Safari/iOS. |
| Client DSP | **Web Audio API** (`AnalyserNode`, fftSize 256) | FFT runs in the browser's native code — zero server cost per listener. |
| Client rendering | **Canvas 2D** (bars/wave/circle) + **three.js** (3D mode) | 2D for minimal battery draw; 3D mode uses one draw call + custom shader, DPR capped at 1.5 for mid-tier mobile. |

**Rejected:** GStreamer (resident pipeline memory, C bindings in-process), LibVLC (playback-oriented, weak muxing control), WebRTC for delivery (realtime latency is not a music-catalog requirement; HLS gives free CDN-ability and seeking).

## 2. IPC — how media moves

```
upload (multer, HTTP multipart)
  → disk: uploads/<file>                     [container FS]
  → BullMQ job {trackId, filePath}           [Redis protocol → Valkey, private network]
  → worker (same process, SONIC_ROLE=all) spawns ffmpeg
      stdin: none · media via FS paths · control: argv · telemetry: stderr pipe
      (loudnorm's JSON report is parsed from captured stderr — runFFmpegCapture)
  → outputs: uploads/streams/<trackId>/      [FS again]
  → DB row update (hls_url, preview_url, duration, status)   [Postgres wire]
  → listener: GET /api/stream/<id>/index.m3u8 → 302 → static HLS  [HTTPS]
```
FS + argv + stderr-pipe is the correct IPC at this scale: zero serialization overhead, and a crashed ffmpeg can never take the Node process down. Shared memory/sockets only pay off with resident pipelines we deliberately avoided.

## 3. Failure & edge-case handling

- **Dropped/failed jobs** — ffmpeg non-zero exit now carries the last 500 chars of stderr into the error; track flips to `status='error'` (parameterized); BullMQ retains the failed job for retry; temp dir + mezzanine always cleaned in `finally`.
- **A/V & timestamp integrity** — every rung is encoded from one shared mezzanine in a single ffmpeg run (`asplit`), so PTS across variants are identical by construction; HLS `#EXT-X-PLAYLIST-TYPE:VOD` + 6 s segments keep seek points aligned.
- **Loudness drift** — two-pass `loudnorm` with `linear=true` (pure gain when possible — no limiter pumping); analysis-failure falls back to single-pass rather than failing the job.
- **Bitrate adaptation** — client-driven HLS ABR: the master playlist advertises 256/128/64 kbps; hls.js/Safari switch rungs on measured bandwidth. No server logic needed.
- **Process hangs** — hard 5-minute SIGKILL timeout per ffmpeg invocation.
- **Storage** — GCS path is dead (billing); files land on container disk, which is **ephemeral on Render** — streams survive until the next deploy. Permanent fix: Cloudflare R2 free tier (10 GB, zero egress fees) as a drop-in for `uploadToGCS`. Flagged, not yet wired (needs an R2 account + keys).

## 4. Operational core — the exact commands the worker runs

```bash
# 1. ANALYZE (loudness measurement, EBU R128)
ffmpeg -hide_banner -i in.wav -af loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json -f null -

# 2. MEZZANINE (apply measured values -> normalized WAV)
ffmpeg -hide_banner -i in.wav \
  -af "loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=<I>:measured_TP=<TP>:measured_LRA=<LRA>:measured_thresh=<T>:offset=<O>:linear=true" \
  -ar 44100 -ac 2 -c:a pcm_s16le mezz.wav

# 3. ADAPTIVE HLS LADDER (one process, three rungs, master playlist)
ffmpeg -hide_banner -i mezz.wav \
  -filter_complex "[0:a]asplit=3[hi][mid][lo]" \
  -map "[hi]"  -c:a:0 aac -b:a:0 256k \
  -map "[mid]" -c:a:1 aac -b:a:1 128k \
  -map "[lo]"  -c:a:2 aac -b:a:2 64k \
  -f hls -var_stream_map "a:0,name:hi a:1,name:mid a:2,name:lo" \
  -master_pl_name playlist.m3u8 -hls_time 6 -hls_list_size 0 \
  -hls_playlist_type vod -hls_segment_filename "seg_%v_%03d.ts" stream_%v.m3u8

# 4. PREVIEW (30 s, faded)
ffmpeg -hide_banner -i mezz.wav -ss 0 -t 30 \
  -af "afade=t=in:st=0:d=1,afade=t=out:st=28:d=2" -c:a libmp3lame -b:a 128k preview.mp3
```

Flag notes: `loudnorm I/TP/LRA` = integrated loudness / true-peak ceiling / loudness range; `linear=true` = apply as pure gain when headroom allows (no dynamic squashing); `asplit=3` = fan one decoded stream to three encoders (decode once, not thrice); `-var_stream_map` = groups outputs into HLS variants; `-hls_time 6` = 6 s segments (seek granularity vs request count); `-hls_playlist_type vod` = fixed playlist with end marker; `-master_pl_name` = writes the adaptive master playlist the player loads.

**Batch a whole directory** (one line):
```bash
for f in ./masters/*.wav; do n=$(basename "$f" .wav); mkdir -p "out/$n"; ffmpeg -hide_banner -i "$f" -filter_complex "[0:a]asplit=3[h][m][l]" -map "[h]" -c:a:0 aac -b:a:0 256k -map "[m]" -c:a:1 aac -b:a:1 128k -map "[l]" -c:a:2 aac -b:a:2 64k -f hls -var_stream_map "a:0,name:hi a:1,name:mid a:2,name:lo" -master_pl_name playlist.m3u8 -hls_time 6 -hls_list_size 0 -hls_playlist_type vod -hls_segment_filename "out/$n/seg_%v_%03d.ts" "out/$n/stream_%v.m3u8"; done
```

## 5. Browser pipeline (Prompt 3 deliverable)

`src/components/Player/SonicVisualizer3D.tsx` — three.js + Web Audio, typed, zero extra libraries:
- FFT (fftSize 256) → band extraction: sub-bass bins 0–2, mids 2–12 (~170 Hz–2 kHz), highs 12–93 (2–16 kHz)
- bands drive **shader uniforms**: `uBass` → vertex displacement + scale pump, `uMid` → noise frequency, `uHigh` → fresnel rim emission
- 60 fps discipline: preallocated shared FFT buffer, no per-frame allocations, DPR ≤ 1.5, rAF paused on hidden tab, full GPU-resource dispose on unmount
- shares the `__sonicStreamAudioRegistry` AudioContext with the 2-D visualizer (one `MediaElementSourceNode` per `<audio>` — Web Audio hard limit)
- shipped as the 4th mode (cube icon) in the player's visualizer switcher
