import { isNumericKeys } from "./utils";

/**
 * Map the data from form to object
 * @param raw
 * @returns object
 */
export function mapObject(raw: Record<string, any>) {
  const result: Record<PropertyKey, any> = {};

  for (const key in raw) {
    const value = raw[key];
    const keys = key.split(/\]\[|\[|\]/).filter((k) => k !== "");

    let obj = result;
    keys.forEach((k, index) => {
      if (!obj[k]) {
        obj[k] = {};
      }
      if (index === keys.length - 1) {
        obj[k] = value;
      }
      obj = obj[k];
    });
  }

  return mapArray(result);
}

/**
 * Map mapObject object-arrays to arrays
 * @param obj
 * @returns object
 */
export function mapArray(obj: any): Record<PropertyKey, any> {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj) || isNumericKeys(obj)) {
    return Object.values(obj).map(mapArray);
  }

  const result: Record<PropertyKey, any> = {};
  for (const key in obj) {
    result[key] = mapArray(obj[key]);
  }

  return result;
}
