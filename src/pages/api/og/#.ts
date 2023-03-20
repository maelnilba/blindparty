import { z, ZodObject } from "zod";

export const createQueryValidator = <T extends ZodObject<any>>(schema: T) => {
  return {
    validate: (searchParams: URLSearchParams) =>
      validateQuery(searchParams, schema),
    safeValidate: (searchParams: URLSearchParams) =>
      safeValidateQuery(searchParams, schema),
    validateAsync: async (searchParams: URLSearchParams) =>
      validateQueryAsync(searchParams, schema),
    safeValidateAsync: async (searchParams: URLSearchParams) =>
      safeValidateQueryAsync(searchParams, schema),
  };
};

const safeValidateQueryAsync = async <T extends ZodObject<any>>(
  searchParams: URLSearchParams,
  validator: T
) => {
  const queries = getQueries(searchParams);
  const res = await validator.safeParseAsync(queries);
  return res as Awaited<ReturnType<T["safeParseAsync"]>>;
};

const validateQueryAsync = async <T extends ZodObject<any>>(
  searchParams: URLSearchParams,
  validator: T
) => {
  const queries = getQueries(searchParams);
  const res = validator.parseAsync(queries);
  return res as Awaited<ReturnType<T["parseAsync"]>>;
};
const safeValidateQuery = <T extends ZodObject<any>>(
  searchParams: URLSearchParams,
  validator: T
) => {
  const queries = getQueries(searchParams);
  const res = validator.parse(queries);
  return res as ReturnType<T["safeParse"]>;
};
const validateQuery = <T extends ZodObject<any>>(
  searchParams: URLSearchParams,
  validator: T
) => {
  const queries = getQueries(searchParams);
  const res = validator.parse(queries);
  return res as ReturnType<T["parse"]>;
};

const getQueries = (searchParams: URLSearchParams) => {
  const queries: { [k: string]: any } = {};
  searchParams.forEach((v, key) => {
    const value = toPrimitive(v);
    if (queries[key]) {
      if (Array.isArray(queries[key])) {
        (queries[key] as any[]).push(value);
      } else {
        queries[key] = [queries[key], value];
      }
    } else {
      queries[key] = value;
    }
  });
  return queries;
};

const toPrimitive = <T = unknown>(value: string): T => {
  let v: any;
  try {
    v = JSON.parse(value);
  } catch (error) {
    v = value;
  } finally {
    return v;
  }
};
