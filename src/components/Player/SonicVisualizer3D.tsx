/**
 * SonicVisualizer3D (2026-10-07) — production WebGL + Web Audio visualizer.
 *
 * Three.js icosahedron driven by real-time FFT data:
 *   sub-bass (20–120 Hz)  → global scale pump + vertex displacement amplitude
 *   mids    (120–2k Hz)   → surface noise distortion speed
 *   highs   (2k–16k Hz)   → fresnel rim emission intensity
 *
 * Mobile-safe 60 fps rules observed here:
 *   • ZERO allocations inside the animation loop (FFT buffer, band scratch
 *     and uniforms are preallocated once)
 *   • devicePixelRatio capped at 1.5, antialias off below that cap
 *   • renderer, geometry, material and context torn down on unmount
 *   • rAF paused when the tab is hidden (visibilitychange)
 *
 * Audio graph: reuses the window.__sonicStreamAudioRegistry entry created by
 * the 2-D visualizer so the <audio id="global-audio-element"> is never
 * connected to two MediaElementSourceNodes (a hard Web Audio error).
 */
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SonicVisualizer3DProps {
  isPlaying: boolean;
  color?: string;
  className?: string;
}

interface RegistryEntry {
  audioCtx: AudioContext;
  analyser: AnalyserNode;
  source: MediaElementAudioSourceNode;
  dataArray: Uint8Array;
}

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  varying vec3 vNormal;
  varying vec3 vView;

  // cheap trig noise — no texture fetch, mobile-friendly
  float n3(vec3 p) {
    return sin(p.x * 3.1 + uTime) * sin(p.y * 2.7 + uTime * 1.3) * sin(p.z * 3.7 + uTime * 0.7);
  }

  void main() {
    float displacement = uBass * 0.35 * n3(position * (1.0 + uMid * 2.0));
    vec3 displaced = position + normal * displacement;
    vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
    vNormal = normalMatrix * normal;
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform float uHigh;
  uniform float uBass;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.0);
    vec3 base = uColor * (0.25 + uBass * 0.5);
    vec3 rim = uColor * fresnel * (0.6 + uHigh * 2.4);
    gl_FragColor = vec4(base + rim, 1.0);
  }
`;

/** Average of FFT bins [lo, hi) normalized to 0..1 — no allocation. */
function bandLevel(data: Uint8Array, lo: number, hi: number): number {
  let sum = 0;
  const end = Math.min(hi, data.length);
  for (let i = lo; i < end; i++) sum += data[i];
  return end > lo ? sum / ((end - lo) * 255) : 0;
}

export const SonicVisualizer3D: React.FC<SonicVisualizer3DProps> = ({
  isPlaying,
  color = '#c81e3a',
  className,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* ── audio: attach to (or create) the shared analyser ───────────────── */
    let analyser: AnalyserNode | null = null;
    let fft: Uint8Array | null = null;

    const connectAudio = () => {
      const mediaElement = document.getElementById('global-audio-element') as HTMLMediaElement | null;
      if (!mediaElement) return false;
      const win = window as any;
      if (!win.__sonicStreamAudioRegistry) win.__sonicStreamAudioRegistry = new Map();
      const registry: Map<HTMLMediaElement, RegistryEntry> = win.__sonicStreamAudioRegistry;
      try {
        let entry = registry.get(mediaElement);
        if (!entry) {
          const Ctx = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx: AudioContext = new Ctx();
          const an = audioCtx.createAnalyser();
          an.fftSize = 256; // 128 bins — enough for 3 bands, cheap on mobile
          an.smoothingTimeConstant = 0.8;
          const source = audioCtx.createMediaElementSource(mediaElement);
          source.connect(an);
          an.connect(audioCtx.destination);
          entry = { audioCtx, analyser: an, source, dataArray: new Uint8Array(an.frequencyBinCount) };
          registry.set(mediaElement, entry);
        }
        analyser = entry.analyser;
        fft = entry.dataArray; // shared preallocated buffer
        return true;
      } catch (err) {
        console.warn('[SonicVisualizer3D] audio connect failed:', err);
        return false;
      }
    };
    connectAudio();
    // the audio element can mount after us — retry a few times, then idle
    let retries = 0;
    const retryTimer = setInterval(() => {
      if (analyser || ++retries > 10) { clearInterval(retryTimer); return; }
      connectAudio();
    }, 500);

    /* ── three.js scene ─────────────────────────────────────────────────── */
    const width = mount.clientWidth || 300;
    const height = mount.clientHeight || 300;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const renderer = new THREE.WebGLRenderer({ antialias: dpr < 1.5, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 50);
    camera.position.z = 3.2;

    const uniforms = {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    };

    const geometry = new THREE.IcosahedronGeometry(1, 24);
    const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // faint wireframe shell for depth
    const shellGeo = new THREE.IcosahedronGeometry(1.35, 2);
    const shellMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), wireframe: true, transparent: true, opacity: 0.08 });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    scene.add(shell);

    const resize = () => {
      const w = mount.clientWidth || width;
      const h = mount.clientHeight || height;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    /* ── animation loop: zero allocations ───────────────────────────────── */
    // FFT bin width at 44.1 kHz / fftSize 256 ≈ 172 Hz per bin.
    // sub-bass bins 0–1, mids 1–12 (~170 Hz–2 kHz), highs 12–93 (2–16 kHz).
    let raf = 0;
    let smoothedBass = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;

      if (analyser && fft && playingRef.current) {
        analyser.getByteFrequencyData(fft);
        const bass = bandLevel(fft, 0, 2);
        const mid = bandLevel(fft, 2, 12);
        const high = bandLevel(fft, 12, 93);
        smoothedBass += (bass - smoothedBass) * 0.25; // attack-weighted smoothing
        uniforms.uBass.value = smoothedBass;
        uniforms.uMid.value = mid;
        uniforms.uHigh.value = high;
        const s = 1 + smoothedBass * 0.25;
        mesh.scale.setScalar(s);
      } else {
        // idle breathing so the canvas never looks frozen
        uniforms.uBass.value = 0.08 + Math.sin(t * 1.2) * 0.04;
        uniforms.uMid.value = 0.1;
        uniforms.uHigh.value = 0.05;
        mesh.scale.setScalar(1);
      }

      mesh.rotation.y = t * 0.15;
      mesh.rotation.x = t * 0.07;
      shell.rotation.y = -t * 0.05;
      renderer.render(scene, camera);
    };
    tick();

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    /* ── teardown ───────────────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(retryTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      shellGeo.dispose();
      shellMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
      // NOTE: the shared AudioContext in the registry is deliberately left
      // alive — the 2-D visualizer and future mounts reuse it.
    };
  }, [color]);

  return <div ref={mountRef} className={className} style={{ width: '100%', height: '100%', minHeight: 200 }} />;
};

export default SonicVisualizer3D;
