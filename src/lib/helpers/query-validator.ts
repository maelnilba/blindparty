import {
  z,
  ZodArray,
  ZodBoolean,
  ZodDate,
  ZodEnum,
  ZodNumber,
  ZodString,
  type ZodObject,
} from "zod";
import { getBaseUrl } from "./base-url";

type QueryZodSchema = ZodObject<{
  [x: string]:
    | ZodString
    | ZodNumber
    | ZodBoolean
    | ZodDate
    | ZodEnum<any>
    | ZodArray<ZodString>
    | ZodArray<ZodNumber>
    | ZodArray<ZodBoolean>
    | ZodArray<ZodDate>;
}>;

export const createBodyValidator = <T extends ZodObject<any>>(schema: T) => {
  return {
    validate: (body: any) => validateBody(body, schema),
    validateAsync: async (body: any) => validateBodyAsync(body, schema),
    safeValidate: (body: any) => safeValidateBody(body, schema),
    safeValidateAsync: async (body: any) => safeValidateBodyAsync(body, schema),
    createBody: (body: z.infer<T>) => createBody(body),
  };
};

const createBody = <T extends ZodObject<any>>(body: z.infer<T>) => {
  return JSON.stringify(body);
};

const validateBody = <T extends ZodObject<any>>(body: string, validator: T) => {
  const parsed = JSON.parse(body);
  if (typeof parsed !== "object")
    throw new Error("Body is not a JSON valid stringify object");
  return validator.parse(parsed) as ReturnType<T["parse"]>;
};

const safeValidateBody = <T extends ZodObject<any>>(
  body: string,
  validator: T
) => {
  const parsed = JSON.parse(body);
  if (typeof parsed !== "object")
    throw new Error("Body is not a JSON valid stringify object");
  return validator.safeParse(parsed) as ReturnType<T["safeParse"]>;
};

const validateBodyAsync = async <T extends ZodObject<any>>(
  body: string,
  validator: T
) => {
  const parsed = JSON.parse(body);
  if (typeof parsed !== "object")
    throw new Error("Body is not a JSON valid stringify object");
  return validator.parseAsync(parsed) as Awaited<ReturnType<T["parseAsync"]>>;
};

const safeValidateBodyAsync = async <T extends ZodObject<any>>(
  body: string,
  validator: T
) => {
  const parsed = JSON.parse(body);
  if (typeof parsed !== "object")
    throw new Error("Body is not a JSON valid stringify object");
  return validator.safeParseAsync(parsed) as Awaited<
    ReturnType<T["safeParseAsync"]>
  >;
};

export const createQueryValidator = <T extends QueryZodSchema>(schema: T) => {
  return {
    validate: (searchParams: URLSearchParams) =>
      validateQuery(searchParams, schema),
    safeValidate: (searchParams: URLSearchParams) =>
      safeValidateQuery(searchParams, schema),
    validateAsync: async (searchParams: URLSearchParams) =>
      validateQueryAsync(searchParams, schema),
    safeValidateAsync: async (searchParams: URLSearchParams) =>
      safeValidateQueryAsync(searchParams, schema),
    createSearchURL: (params: z.infer<T>) => createSearchURL(params),
  };
};

type Value =
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | boolean[]
  | number[]
  | Date[];

const createSearchURL = <T extends QueryZodSchema>(params: z.infer<T>) => {
  const url = new URL(getBaseUrl());
  function append(param: string, value: Value) {
    if (value instanceof Date) {
      url.searchParams.append(param, value.toISOString());
      return;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      url.searchParams.append(param, String(value));
      return;
    }
    if (typeof value === "string") url.searchParams.append(param, value);
  }
  for (const param in params) {
    const value = params[param] as Value;
    if (Array.isArray(value)) value.forEach((val) => append(param, val));
    else append(param, value);
  }
  return url.search;
};

const safeValidateQueryAsync = async <T extends QueryZodSchema>(
  searchParams: URLSearchParams,
  validator: T
) => {
  const queries = getQueries(searchParams);
  const res = await validator.safeParseAsync(queries);
  return res as Awaited<ReturnType<T["safeParseAsync"]>>;
};

const validateQueryAsync = async <T extends QueryZodSchema>(
  searchParams: URLSearchParams,
  validator: T
) => {
  const queries = getQueries(searchParams);
  const res = validator.parseAsync(queries);
  return res as Awaited<ReturnType<T["parseAsync"]>>;
};
const safeValidateQuery = <T extends QueryZodSchema>(
  searchParams: URLSearchParams,
  validator: T
) => {
  const queries = getQueries(searchParams);
  const res = validator.parse(queries);
  return res as ReturnType<T["safeParse"]>;
};
const validateQuery = <T extends QueryZodSchema>(
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
    v = Date.parse(value) ? new Date(Date.parse(value)) : NaN || value;
  } finally {
    return v;
  }
};

type ReturnQueryValidator<TSchema extends ZodObject<any> = any> = ReturnType<
  typeof createQueryValidator<TSchema>
>;

// Tried infer but it doesn't work, return [x: string]: any
export type InferValidator<TValidator extends ReturnQueryValidator<any>> =
  ReturnType<TValidator["validate"]>;
