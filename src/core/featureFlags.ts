export const FEATURES = {
  AI_STUDIO: import.meta.env.VITE_FEATURE_AI_STUDIO !== 'false',
  VIDEO: import.meta.env.VITE_FEATURE_VIDEO !== 'false',
  AFFILIATE: import.meta.env.VITE_FEATURE_AFFILIATE !== 'false',
  PLUGINS: import.meta.env.VITE_FEATURE_PLUGINS !== 'false',
  COLLAB: true,
  ROOMS: true,
};
