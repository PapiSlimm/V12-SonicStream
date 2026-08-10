const JSON_KEYS = [
  'socialLinks', 'preferredGenres', 'targetDemo', 'brandSafety', 'platforms', 
  'demographics', 'revenueBreakdown', 'externalShare', 'layout', 'components', 
  'tags', 'riders', 'marketPricing', 'metadata', 'slots', 'inputData', 
  'outputResult', 'features', 'socialLinks', 'preferredGenres'
];

export function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => snakeToCamel(v));
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => {
        const camelKey = key.replace(/(_\w)/g, m => m[1].toUpperCase());
        let val = obj[key];
        
        // Auto-parse JSON strings for known keys
        if (JSON_KEYS.includes(camelKey) && typeof val === 'string' && val.length > 0) {
          const firstChar = val.trim().charAt(0);
          if (firstChar === '{' || firstChar === '[') {
            try {
              val = JSON.parse(val);
            } catch {
              // Keep as is
            }
          }
        }
        
        return {
          ...result,
          [camelKey]: snakeToCamel(val),
        };
      },
      {},
    );
  }
  return obj;
}

export function camelToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => camelToSnake(v));
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        let val = obj[key];

        // Auto-stringify objects for known JSON keys
        if (JSON_KEYS.includes(key) && val !== null && typeof val === 'object') {
          val = JSON.stringify(val);
        }

        return {
          ...result,
          [snakeKey]: camelToSnake(val),
        };
      },
      {},
    );
  }
  return obj;
}
