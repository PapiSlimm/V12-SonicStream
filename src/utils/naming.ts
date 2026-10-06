/**
 * Utility to convert snake_case keys to camelCase in objects.
 */
export function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => snakeToCamel(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/(_\w)/g, k => k[1].toUpperCase())]: snakeToCamel(obj[key]),
      }),
      {},
    );
  }
  return obj;
}

/**
 * Utility to convert camelCase keys to snake_case in objects.
 */
export function camelToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => camelToSnake(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)]: camelToSnake(obj[key]),
      }),
      {},
    );
  }
  return obj;
}
