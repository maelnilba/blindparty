export function getQuery<T extends string | string[] | undefined>(
  query: T
): string | undefined {
  return query && typeof query === "string"
    ? query
    : query && Array.isArray(query)
    ? typeof query[0] === "string"
      ? query[0]
      : undefined
    : undefined;
}
