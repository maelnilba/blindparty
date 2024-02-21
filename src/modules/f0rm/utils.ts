/**
 * Return if a object have only numeric keys
 * @param obj
 * @returns boolean
 */
export function isNumericKeys(obj: Record<string, any>) {
  return Object.keys(obj).every((key) => !isNaN(parseInt(key)));
}

export function arrayEquals(array1: PropertyKey[], array2: PropertyKey[]) {
  return (
    array1.length === array2.length &&
    array1.every((value, index) => value === array2[index])
  );
}

/**
 * Compare if target is implied in path
 * @param target
 * @param path
 * @returns
 */
export function implied(target: PropertyKey[], path: PropertyKey[]): boolean {
  if (target.length < path.length) return false;
  const trimmed = target.slice(0, path.length);

  return trimmed.every((value, index) => value === path[index]);
}

export function outObject(path: string[], object: Record<PropertyKey, any>) {
  return path.reduce((result, key) => result?.[key], object);
}

/**
 * Return path [] format to array format
 * @param path
 * @returns path[]
 */
export function pathArray(path: string): string[] {
  return path
    .match(/\[(.*?)\]/g)!
    .filter((match) => !/\d+/.test(match))
    .map((match) => match.slice(1, -1));
}
