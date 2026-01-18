// スネークケースをキャメルケースに変換
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// キャメルケースをスネークケースに変換
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// オブジェクトのキーをスネークケースからキャメルケースに変換
export function keysToCamel<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToCamel<any>(v)) as T;
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = snakeToCamel(key);
      (result as any)[camelKey] = keysToCamel(obj[key]);
      return result;
    }, {} as T);
  }
  return obj;
}

// オブジェクトのキーをキャメルケースからスネークケースに変換
export function keysToSnake<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToSnake<any>(v)) as T;
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = camelToSnake(key);
      (result as any)[snakeKey] = keysToSnake(obj[key]);
      return result;
    }, {} as T);
  }
  return obj;
}
