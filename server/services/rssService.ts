import { run, all, db, getDB } from '../db.js';
import { registry } from './ServiceRegistry.js';
import { config } from '../config.js';
import { GoogleGenAI } from "@google/genai";
import { logger } from '../middleware/error.js';

// Cache/timestamp tracker to ensure news is generated once a day
let lastFullGenerationTime = 0;
let rssInterval: NodeJS.Timeout | null = null;

export function stopRSSAutomation() {
  if (rssInterval) {
    clearInterval(rssInterval);
    rssInterval = null;
    logger.info('[RSS Service] Automation interval stopped.');
  }
}

export async function refreshRSSFeeds() {
  console.log('Refreshing RSS feeds...');
  
  try {
    // Ensure rss_feeds table exists before we perform any operations on it
    await run(`
      CREATE TABLE IF NOT EXISTS rss_feeds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        type TEXT,
        category TEXT,
        media_url TEXT,
        author_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 1. Fetch internal releases
    const releases = await all<any>(`
      SELECT r.*, u.name as artist_name 
      FROM releases r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.status = 'live' AND r.created_at > datetime('now', '-20 minutes')
    `);
    
    for (const release of releases) {
      const relTitle = typeof release.title === 'string' ? release.title : 'Untitled Release';
      const artistName = typeof release.artist_name === 'string' ? release.artist_name : (typeof release.artistName === 'string' ? release.artistName : 'Unknown Artist');
      const relType = typeof release.type === 'string' ? release.type : 'Single';
      const userId = typeof release.user_id === 'string' ? release.user_id : (typeof release.userId === 'string' ? release.userId : null);

      await run(`
        INSERT INTO rss_feeds (title, content, type, category, author_id)
        VALUES (?, ?, 'release', 'New Release', ?)
      `, [`New Release: ${relTitle} by ${artistName}`, `New ${relType} out now!`, userId]);
    }

    // 2. Recently uploaded videos
    const videos = await all<any>(`
      SELECT * FROM tracks WHERE is_video = 1 AND created_at > datetime('now', '-20 minutes')
    `);
    for (const video of videos) {
      const trackTitle = typeof video.title === 'string' ? video.title : 'Untitled Video';
      const trackArtist = typeof video.artist === 'string' ? video.artist : 'Unknown Artist';
      const fileUrl = typeof video.file_url === 'string' ? video.file_url : (typeof video.fileUrl === 'string' ? video.fileUrl : '');

      await run(`
        INSERT INTO rss_feeds (title, content, type, category, media_url)
        VALUES (?, ?, 'video', 'New Video', ?)
      `, [`New Video: ${trackTitle}`, `Check out the latest video from ${trackArtist}`, fileUrl]);
    }

    // 3. Automated Daily Entertainment News Generation (exactly 15 articles)
    const now = Date.now();
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    
    // Check if we already have sufficient entertainment news within the last 12 hours
    const countQuery = await all<{ count: number }>(`
      SELECT COUNT(*) as count FROM rss_feeds 
      WHERE type = 'news' AND category = 'Entertainment News' AND created_at > datetime('now', '-12 hours')
    `);
    const currentEntNewsCount = countQuery[0]?.count || 0;

    if (currentEntNewsCount < 15 && (now - lastFullGenerationTime > twelveHoursMs)) {
      console.log('Generating 15 daily entertainment news articles...');
      let generatedArticles: any[] = [];

      // Fetch Subscribed User Events to enrich the news with real platform context
      const userEvents = await all<any>(`
        SELECT e.*, u.name as artist_name, u.subscription_tier
        FROM events e
        JOIN users u ON e.artist_id = u.id
        WHERE u.subscription_tier != 'free' AND u.subscription_tier IS NOT NULL
        ORDER BY e.date ASC
        LIMIT 5
      `);

      if (config.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({
            apiKey: config.GEMINI_API_KEY,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          let eventsContext = "";
          if (userEvents && userEvents.length > 0) {
            eventsContext = "Here are actual upcoming shows/gigs hosted by some of our subscribed creators to include as real event news:\n" +
              userEvents.map(evt => `- "${evt.title}" by ${evt.artist_name} at ${evt.venue} in ${evt.city} on ${evt.date}. Price: $${evt.price}.`).join("\n");
          }

          const prompt = `You are a music industry journalist and cultural reporter.
Generate exactly 15 distinct, engaging, highly-realistic entertainment news articles about the United States entertainment landscape.
The group of exactly 15 articles MUST individually cover these categories:
- Celebrity news and gossip (e.g., pop stars, hot rumors).
- Popular music and mainstream billboard chart-toppers.
- Hip Hop (latest tracks, albums, major artist debates).
- Blues & Southern Soul (culture highlights, delta blues, legendary and independent southern soul artists).
- Rock / Indie alternative scene.
- Reggae (roots reggae, dancehall culture in the US).
- Upcoming large shows, stadium concerts, and national US music events.
- Reports and features on events hosted by our own platform's subscribed artists (as provided below).

${eventsContext}

Return the response strictly as a JSON array where each object has the following exact keys:
{
  "title": "A highly compelling and realistic headline",
  "content": "A detailed 2-3 paragraph news article about the event or topic.",
  "type": "news",
  "category": "Entertainment News",
  "media_url": "Provide a high-quality relevant music/celeb/show image URL from unsplash (e.g., https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80, etc.)"
}

Ensure the output is valid, structured JSON. Do NOT include markdown blocks or any text outside the JSON array.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
          });

          let textResult = response.text || '';
          // Strip potential markdown markers
          textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(textResult);
          if (Array.isArray(parsed) && parsed.length >= 15) {
            generatedArticles = parsed.slice(0, 15);
          }
        } catch (openaiErr) {
          console.error('Failed to generate entertainment news via Gemini API, using curated fallbacks', openaiErr);
        }
      }

      // If Gemini fails or isn't configured, use our robust curated list of 15 articles
      if (generatedArticles.length < 15) {
        console.log('Using pre-curated high-fidelity entertainment news fallback...');
        
        // Let's check for any actual user events we can feature in our fallbacks (to make it dynamic!)
        const featuredUsersStr = userEvents.length > 0 
          ? `Plus, don't miss our premium member spotlight: ${userEvents[0].artist_name} is performing live at ${userEvents[0].venue} in ${userEvents[0].city} (tickets are $${userEvents[0].price})!`
          : "Plus, check local gig calendars for surprise club shows and elite acoustic sets taking place in metropolitan hotspots this weekend!";

        generatedArticles = [
          {
            title: "U.S. Pop Superstars Dominate Global Billboard Charts This Week",
            content: "Mainstream pop reigns supreme as top U.S. charting artists shatter streaming records worldwide. Analysts credit the shift to highly personalized lyric engines, massive fan-engagement socials, and high-fidelity distribution formats that deliver master-quality audio directly to listeners.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "Hip Hop Legends Announce Surprise Joint Tour Dates",
            content: "The U.S. hip hop scene is buzzing after three legendary emcees announced a collaborative arena tour starting next month in Atlanta, Georgia. Production design is rumored to incorporate interactive holographic backdrops and live audio mastering during performance streams.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "Southern Soul and Blues Festival Draws Record Crowds in Mississippi",
            content: "The annual Blues & Southern Soul Celebration took Mississippi by storm last night, showcasing spectacular performances of slow-burn brass, deep organ solos, and heartfelt vocal runs. Curators emphasize that independent southern soul music is enjoying a dramatic resurgence across digital stream feeds.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "Celebrity Spotlight: Inside the Glamour of the annual Music Gala",
            content: "Hollywood's elite gathered for the Music Gala, sporting bespoke couture and announcing exciting new creative studios. Red carpet interviews highlighted the critical importance of digital brand safety, automated social post crossposting, and protecting artists' independent copyrights.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "Roots Reggae Revival: Kingston Vibrations Light Up the West Coast",
            content: "Reggae roots are deeply embedded in this month's West Coast music festival lineup. Outstanding acts have imported standard dub style systems, delivering rich, heavyweight basslines and steady offbeat riddims that foster a powerful message of unity and social consciousness.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1484755560693-a4074577af3a?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "Independent Rock Bands Gather in Austin for Breakthrough Showcase",
            content: "Over fifty independent rock and alternative bands took over Austin's historic warehouse district. Highlighting raw garage rock energy and heavy fuzz pedals, the event has attracted top A&R scouts seeking unique modern bands that blend classic analog warmth with sharp digital distribution.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "Upcoming US Concerts: Pop Icon Announces Headlining Stadium Tours",
            content: "One of the country's most prominent pop icons has unveiled 30 new stadium tour dates across the United States. Demand is expected to break historical ticket records, with venues introducing next-generation queueing portals to manage secondary-market scalping.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "Member Spotlights: Subscribed Artists Announce Exclusive Community Shows",
            content: `Our subscribed community creators are taking their talent on the road. ${featuredUsersStr} Subscribed artists use automated scheduling dashboards to alert their inner fan-circles first, securing sellouts in minutes.`,
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "The Legacy of Delta Blues: Retracing the Roots of American Music",
            content: "A new documentary series highlights the enduring power of classic Delta Blues, from acoustic slide guitars to gritty, authentic vocals. Modern producers are finding inspiration in these simplistic structures, overlaying deep analog mastering tools to capture the raw vintage character.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1525994886773-080587e161c2?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "Reggae and Dancehall Artists Redefining Modern Club Beats",
            content: "Top charting dancehall artists are collaborating with electronic music producers to create explosive club anthems that dominate late-night radio. Blending tropical syncopation with high-energy synths, the genre is finding an ever-expanding mainstream fanbase in the US.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "How Hip Hop Is Merging with Virtual Reality Event Spaces",
            content: "U.S. trap stars are hosting fully immersive virtual reality shows where fans join as custom avatars. These multi-dimensional spaces allow active remote participation, real-time merchandise purchasing, and high-fidelity spatial audio performance streams.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "Rock and Roll Hall of Fame Unveils Historic Exhibit and Live Gigs",
            content: "An immersive exhibits chronicle the evolution of U.S. Rock, highlighting the transition from analog tube amps and tape machines to modern digital editing. The museum is hosting outdoor concert events featuring emerging indie-rock bands throughout the month.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "Southern Soul Independent Artists Garner Major Award Nominations",
            content: "The Independent Traditional Music Awards announced nominations, with several beloved Southern Soul and Blues singers leading the count. Indepedent studios and marketing managers are leveraging decentralized distribution to build active global followings without traditional label backing.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "Upcoming Festival: Elite US Concert Series Announced",
            content: "Music advocates have revealed a comprehensive lineup for the upcoming three-day festival in Denver, Colorado. Organizers are setting aside dedicated stages for roots reggae, authentic retro rock, traditional acoustic delta blues, and regional southern soul groups.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1472653423608-ee24d5d43dbf?auto=format&fit=crop&w=800&q=80"
          },
          {
            title: "Behind the Scenes: Inside a Pro Studio Mastering Complex",
            content: "A detailed tour of a state-of-the-art mastering suite reveals the micro-parameters behind global radio hits. Chief mastering engineers demonstrate how adjusting stereo width, clarity margins, and multi-band compression profiles can transform a basic raw recording into a massive masterpiece.",
            type: "news",
            category: "Entertainment News",
            media_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80"
          }
        ];
      }

      // Insert all 15 articles beautifully into the database
      for (const article of generatedArticles) {
        await run(`
          INSERT INTO rss_feeds (title, content, type, category, media_url)
          VALUES (?, ?, ?, ?, ?)
        `, [article.title, article.content, article.type || 'news', article.category || 'Entertainment News', article.media_url || null]);
      }

      lastFullGenerationTime = now;
      console.log('Successfully inserted 15 daily Entertainment News articles.');
    }

    // 4. Add some mocked industry news and marketing advice if the table is empty
    const count = await all('SELECT COUNT(*) as count FROM rss_feeds');
    if ((count[0] as any).count < 5) {
      const initialFeeds = [
        { title: 'Industry Update: Streaming Royalties', content: 'Streaming platforms are adjusting royalty rates for independent artists.', type: 'industry', category: 'Industry News' },
        { title: 'Marketing Tip: TikTok for Musicians', content: 'Learn how to use TikTok to promote your latest single effectively.', type: 'marketing', category: 'Marketing Advice' },
        { title: 'Learning: Mastering Your Tracks', content: 'A guide to professional mastering for home studio producers.', type: 'learning', category: 'Learning' },
        { title: 'Company News: New Features Launch', content: 'We just launched the Pro Assets Library and Event Management!', type: 'news', category: 'Company News' }
      ];

      for (const feed of initialFeeds) {
        await run(`
          INSERT INTO rss_feeds (title, content, type, category)
          VALUES (?, ?, ?, ?)
        `, [feed.title, feed.content, feed.type, feed.category]);
      }
    }

    // Deduplication logic
    await run(`
      DELETE FROM rss_feeds 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM rss_feeds 
        GROUP BY title, content
      )
    `);

    // Call daily system features & system products auto-generator
    await generateSystemAutomatedFeeds();
    
    console.log('RSS feeds refreshed successfully.');
  } catch (err) {
    console.error('Error refreshing RSS feeds:', err);
  }
}

async function generateSystemAutomatedFeeds() {
  try {
    // 1. Purge previous system-generated automated posts to ensure clean refresh
    await run(`DELETE FROM rss_feeds WHERE author_id = 'system_marketing'`);
    await run(`DELETE FROM posts WHERE user_id = 'system_marketing'`);

    // 2. Define 10 high-fidelity SonicStream Feature discussion posts
    const features = [
      {
        title: "SonicStream Upgrade: Warm, Bright & Club Ready AI Mastering Active",
        content: "Experience dynamic audio engineering. SonicStream’s AI mastering suite leverages multiband compression and adaptive parametric equalizers to automatically optimize tracks to industry club loudness levels.",
        category: "Company News",
        media: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Streaming Infrastructure: Low-Latency HLS & DASH Delivery Protocol",
        content: "Our streaming pipelines partition uploads into localized HTTP Live Streaming (HLS) chunks, guaranteeing secure buffer-free, eye-safe playback on all global mobile cellular connections.",
        category: "Tech Analysis",
        media: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Media Encoding: High-Performance FFmpeg 720p Video Transcoder",
        content: "Every uploaded clip is fully processed by our back-end FFmpeg queue, auto-transcoding video feeds into standard 1280:720 resolution to optimize mobile cellular bandwidth utilization.",
        category: "Tech Analysis",
        media: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "WebSocket Securing: Transport-Layer Payload Validation Measures",
        content: "SonicStream has hardened its stateful chat server connections with robust request rate limits and input sanitization layers, ensuring stable real-time collaboration widgets.",
         category: "Security Bulletin",
        media: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Fulfillment Update: Automated Global Print-on-Demand (POD) Apparel",
        content: "Upload artwork, style cozy heavyweight hoodies, set custom price markups, and let SonicStream’s white-label ordering router fulfill and ship merchandise instantly.",
        category: "Company News",
        media: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Data Reliability: Fast Dialect Mapping in Unified Sqlite/MySql Layer",
        content: "SonicStream database engine intelligently swaps active queries and translates traditional snake_case records into typed camelCase parameters with sub-millisecond overhead.",
        category: "Tech Analysis",
        media: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Direct-to-Fan Commerce: Fine-Grained Subscription Access Gates",
        content: "Creators can easily configure custom VIP badges and exclusive content locks, protecting early stream leaks and premium wav file stem downloads behind paywalls.",
        category: "Company News",
        media: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Credentials Safeguarding: Enterprise Proxy-Gated Back-End Routing",
        content: "All developer SDK endpoints and secure artificial intelligence secrets (like Gemini 3.5 keys) are completely protected from client browser exposure behind Express API relays.",
        category: "Security Bulletin",
        media: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Sound design: Immersive 3D Space Audio Renderer Integrations",
        content: "SonicStream platform now supports real-time three-dimensional rotation cues in spatial headphones, giving listeners club acoustics straight from their standard browser tabs.",
        category: "Tech Analysis",
        media: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Marketing Strategy: Multi-Platform Embedding Widget Releases",
        content: "Configure a customizable product frame, copy the responsive iframe block, and instantly sell merchandise, digital keys, and gig sessions directly within external sites.",
        category: "Company News",
        media: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=800&q=80"
      }
    ];

    // 3. Define 10 high-fidelity Creator Products for Sale representing all industries
    const products = [
      {
        title: "Premium French Terry Heavyweight Streetwear Hoodie",
        content: "Crafted from massive 100% French Terry cotton, featuring elegant embroidered SonicStream logos in a relaxed drop-shoulder oversized streetwear silhouette.",
        price: 79.99,
        category: "Apparel & Merch",
        media: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Atmos Sound masterclass: Complete 12-Part Mixing Webinar Series",
        content: "Learn immersive object placement, binaural panning tricks, and high-dynamics master limiter setup for multi-channel streaming networks from industry veterans.",
        price: 149.00,
        category: "Education & Courses",
        media: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Creator Sandbox Sandclub Premium VIP Forum Membership",
        content: "Secure yearly pass giving access to private developer code sandboxes, raw multi-track audio stem downloads, and monthly live portfolio review panels.",
        price: 299.00,
        category: "Memberships & Access",
        media: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: " Hand-Mapped Vintage Acoustic Studio Walnut Diffuser Frame",
        content: "Handcrafted sound diffusion panels carved from rich grain walnut. Mathematically tuned to scatter high frequencies while trapping muddy flutter echoes.",
        price: 199.00,
        category: "Physical Goods & Gear",
        media: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Lo-Fi Beats Deluxe Tape Sample Reel & MIDI Chord Library",
        content: "1.5 GB of ultra-warm vintage tape-compressed drum stems, Rhodes keyboard progressions, acoustic bass loops, and pre-mapped groove templates.",
        price: 29.99,
        category: "Digital Assets",
        media: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "1-on-1 Artist Development & Direct Branding Strategy Call",
        content: "Personalized 60-minute consultation with Ron Dickson. Build high-conversion marketing funnels, optimize social posts, and polish product aesthetics.",
        price: 150.00,
        category: "Services & Consulting",
        media: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Backstage Pass General Concert Admission VIP Pass Ticket",
        content: "Unlock access to the live soundcheck sessions, a limited tour screenprint poster, complimentary cocktails, and post-concert artist meetup.",
        price: 125.00,
        category: "Event Tickets",
        media: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Ethiopian Roast Midnight Studio Coffee Roast Beans (12oz)",
        content: "Organic shade-grown whole beans featuring complex dark cocoa and sweet cherry tasting notes, roasted to keep programmers energized overnight.",
        price: 18.50,
        category: "Food & Beverage",
        media: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Independent Label Standard Contract & Split Sheet Bundle",
        content: "A set of legally vetted production templates covering non-exclusive beats, master release sync rights, mechanical splits, and royalty distribution.",
        price: 49.00,
        category: "Business Templates",
        media: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Modern Social Growth: 30-Day Video Viral Funnel Blueprint",
        content: "An interactive digital playbook showing the exact script pacing, hook methods, and meta-tag secrets used to reach millions of impressions.",
        price: 19.99,
        category: "Digital Assets",
        media: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=800&q=80"
      }
    ];

    // 4. Insert into rss_feeds under author_id = 'system_marketing'
    for (const f of features) {
      await run(`
        INSERT INTO rss_feeds (title, content, type, category, media_url, author_id)
        VALUES (?, ?, 'news', ?, ?, 'system_marketing')
      `, [f.title, f.content, f.category, f.media]);
    }

    for (const p of products) {
      await run(`
        INSERT INTO rss_feeds (title, content, type, category, media_url, author_id)
        VALUES (?, ?, 'product', ?, ?, 'system_marketing')
      `, [p.title, p.content, p.category, p.media]);
    }

    // 5. Insert into posts under user_id = 'system_marketing'
    for (const f of features) {
      await run(`
        INSERT INTO posts (user_id, content, media_url, type, is_promotion, status)
        VALUES ('system_marketing', ?, ?, 'text', 0, 'live')
      `, [
        `### FEATURE HIGHLIGHT\n\n**${f.title}**\n\n${f.content}\n\n*Optimizing SonicStream for global independent entrepreneurs.*`,
        f.media
      ]);
    }

    for (const p of products) {
      await run(`
        INSERT INTO posts (user_id, content, media_url, type, is_promotion, price, product_link, status)
        VALUES ('system_marketing', ?, ?, 'product', 1, ?, '/marketplace', 'live')
      `, [
        `### MARKETPLACE DROP\n\n**${p.title}**\n*Category: ${p.category}*\n\nPrice: $${p.price}\n\n${p.content}`,
        p.media,
        p.price
      ]);
    }

    logger.info("Successfully generated and synced 10 system feature posts & 10 system product posts into all feeds.");
  } catch (err) {
    logger.error("Error generating system automated feeds", err);
  }
}

// Start the automation with safe global try-catch wrapping
export async function startRSSAutomation() {
  try {
    // Wait for the database service registry ready signal
    await registry.waitFor('database');

    // Startup guard
    const activeDB = getDB();
    if (!db || !activeDB) {
      throw new Error(
        'RSS Automation started before database initialization'
      );
    }

    // Initial refresh
    refreshRSSFeeds().catch(err => {
      logger.error('RSS Automation: background generation failed on startup iteration:', err);
    });
    
    // Register rss service in ServiceRegistry
    registry.register('rss', {
      refresh: refreshRSSFeeds
    });

    // Refresh every 20 minutes (re-check/generates daily)
    rssInterval = setInterval(() => {
      try {
        refreshRSSFeeds().catch(err => {
          logger.error('RSS Automation: background iteration failed:', err);
        });
      } catch (err) {
        logger.error('RSS Automation: setInterval task execution threw immediately:', err);
      }
    }, 20 * 60 * 1000);
  } catch (err) {
    logger.error('RSS Automation: failed to initialize intervals:', err);
  }
}
