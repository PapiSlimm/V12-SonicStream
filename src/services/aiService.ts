import { apiFetch } from '../api/apiFetch';

export const aiService = {
  async generateMelodyConcept(genre: string, mood: string, complexity: number) {
    try {
      return await apiFetch<any>('/api/ai/melody-concept', {
        method: 'POST',
        body: JSON.stringify({ genre, mood, complexity })
      });
    } catch (error) {
      console.error('Error generating melody concept:', error);
      throw error;
    }
  },

  async analyzeMastering(trackTitle: string, genre: string, profile: string = 'balanced') {
    try {
      return await apiFetch<any>('/api/ai/analyze-mastering', {
        method: 'POST',
        body: JSON.stringify({ trackTitle, genre, profile })
      });
    } catch (error) {
      console.error('Error analyzing mastering:', error);
      throw error;
    }
  },

  async refineVideo(prompt: string, videoUrl?: string) {
    try {
      return await apiFetch<any>('/api/ai/refine-video', {
        method: 'POST',
        body: JSON.stringify({ prompt, videoUrl })
      });
    } catch (error) {
      console.error('Error refining video:', error);
      throw error;
    }
  }
};
