import { apiFetch } from '../api/apiFetch';

export class SEOAutomationService {
  /**
   * Generates SEO-optimized content for an artist profile to target long-tail keywords.
   * Strategy: Focus on specific genres, locations, and "best of" queries.
   */
  static async generateArtistSEOContent(artistName: string, genre: string, city: string) {
    try {
      return await apiFetch<any>('/api/ai/seo-automation', {
        method: 'POST',
        body: JSON.stringify({ artistName, genre, city })
      });
    } catch (error) {
      console.error('SEO Automation Error:', error);
      return null;
    }
  }

  /**
   * Strategy to rank above Spotify for long-tail keywords:
   * 1. Niche Authority: Target "Artist Name + [City] + [Genre]" which Spotify often ignores in metadata.
   * 2. Freshness: Use real-time event data and "New Release This Week" pages.
   * 3. Structured Data: Provide deeper JSON-LD (MusicRecording + Event + Offer) than generic platforms.
   * 4. Internal Linking: Create a dense web of "Artist -> City Hub -> Related Artists".
   */
  static getRankingStrategy() {
    return {
      focus: 'Hyper-local and Genre-specific long-tail keywords',
      tactics: [
        'Dynamic landing pages for "Top [Genre] Artists in [City]"',
        'Automated blog posts summarizing "New [Genre] Releases This Week"',
        'Rich snippets for events with direct ticket pricing',
        'High-speed Edge delivery for better Core Web Vitals'
      ]
    };
  }
}
