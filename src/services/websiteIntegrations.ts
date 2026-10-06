import { Track } from '../types';
import { Release } from './distributionIntegrations';

export class WebsiteIntegrations {
  
  // Bandzoogle API (Music sites)
  static async bandzoogleIntegration(siteId: string, apiKey: string) {
    return {
      syncCatalog: async (releases: Release[]) => {
        // Push releases to Bandzoogle store
        const response = await fetch(`https://api.bandzoogle.com/sites/${siteId}/products`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(releases.map(r => ({
            name: r.title,
            artist: r.artist,
            price: (r as any).price || 9.99,
            digital_delivery: true,
            artwork_url: r.artwork_url
          })))
        });
        return response.json();
      },
      
      createStorePage: async (category: string) => {
        const response = await fetch(`https://api.bandzoogle.com/sites/${siteId}/pages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: category, type: 'store' })
        });
        return response.json();
      }
    };
  }

  // WordPress/WooCommerce API
  static async wordpressIntegration(siteUrl: string, apiKey: string) {
    return {
      createProducts: async (tracks: Track[]) => {
        const response = await fetch(`${siteUrl}/wp-json/wc/v3/products`, {
          method: 'POST',
          headers: { 
            'Authorization': `Basic ${window.btoa(apiKey)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tracks.map(track => ({
            name: `${track.displayArtistName} - ${track.title}`,
            type: 'simple',
            regular_price: track.price.toString(),
            downloadable: true,
            downloads: [{
              name: track.title,
              file: track.fileUrl // Secure download link
            }]
          })))
        });
        return response.json();
      }
    };
  }

  // Webflow API (Custom sites)
  static async webflowIntegration(accessToken: string) {
    return {
      createCMSItems: async (siteId: string, collectionId: string, music: any[]) => {
        const response = await fetch(`https://api.webflow.com/v2/sites/${siteId}/collections/${collectionId}/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: music.map(item => ({
              fieldData: {
                title: item.title,
                artist: item.displayArtistName,
                artwork: item.coverUrl,
                streamUrl: item.streamUrl,
                price: item.price
              }
            }))
          })
        });
        return response.json();
      }
    };
  }
}
