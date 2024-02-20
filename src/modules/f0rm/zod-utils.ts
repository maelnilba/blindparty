import {
  ZodArray,
  ZodBranded,
  ZodDefault,
  ZodEffects,
  ZodNullable,
  ZodObject,
  ZodOptional,
  ZodPromise,
  ZodRecord,
  z,
  type ZodError,
  type ZodRawShape,
  type ZodSchema,
} from "zod";
import { implied } from "./utils";

export function findError(errors: ZodError, path: PropertyKey[]) {
  return errors.errors.filter((error) => implied(error.path, path));
}

/**
 * Remove all effects, optionals etc
 */
export function through<TSchema extends ZodSchema>(
  schema: TSchema,
  promise = true
) {
  let outed = schema;
  while (outable(outed, promise))
    try {
      outed = out(outed, promise);
    } catch (error) {
      break;
    }

  return outed;
}

/**
 * Out schema from other effects
 * @param schema
 * @returns
 */
export function out<TSchema extends ZodSchema>(schema: TSchema, effect = true) {
  if (
    schema instanceof ZodOptional ||
    schema instanceof ZodNullable ||
    schema instanceof ZodBranded ||
    schema instanceof ZodPromise
  )
    return schema.unwrap();

  if (schema instanceof ZodDefault) return schema.removeDefault();
  if (effect && schema instanceof ZodEffects) return schema.innerType();

  throw new Error(`schema ${schema.description} can't be outed`);
}

/**
 * Return if schema have effects
 * @param schema
 * @returns boolean
 */
export function outable<TSchema extends ZodSchema>(
  schema: TSchema,
  effect = true
) {
  return (
    (effect && schema instanceof ZodEffects) ||
    schema instanceof ZodOptional ||
    schema instanceof ZodBranded ||
    schema instanceof ZodNullable ||
    schema instanceof ZodDefault ||
    schema instanceof ZodPromise
  );
}

/**
 * Assert schema is a ZodObject
 * @param schema
 * @returns boolean
 */
export function object<TSchema extends ZodSchema>(
  schema: TSchema
): ZodRawShape {
  const schemaObject = through(schema);
  if (schemaObject instanceof ZodObject) return schemaObject.shape;
  throw new Error("The schema type must be a object");
}

/**
 * Assert schema is a ZodArray
 * @param schema
 * @returns boolean
 */
export function array<TSchema extends ZodSchema>(schema: TSchema): ZodSchema {
  const schemaArray = through(schema);
  if (schemaArray instanceof ZodArray) return schemaArray.element;
  throw new Error("The schema type must be a array");
}

/**
 * Assert schema has a promise function
 * @param schema
 */
export function promises<TSchema extends ZodSchema>(schema: TSchema): boolean {
  try {
    schema.parse(z.NEVER, { async: true });
  } catch (error) {
    return (
      error instanceof Error &&
      error.message === "Synchronous parse encountered promise."
    );
  }
  return false;
}

/**
 * Recursive transform zod schema to native object
 * @param schema
 * @returns object
 */
export function shapeOut<TSchema extends ZodRawShape>(
  schema: TSchema
): Record<PropertyKey, any> | null {
  if (schema.constructor === Object) {
    const keys = Object.keys(schema);
    if (keys.length === 0) return null;
    return keys.reduce((obj, key) => {
      const value = through(schema[key] as ZodSchema);

      if (value instanceof ZodObject) {
        return { ...obj, [key]: shapeOut(shape(value)) };
      }

      if (value instanceof ZodArray) {
        return { ...obj, [key]: [shapeOut(shape(value))] };
      }

      return { ...obj, [key]: null };
    }, {});
  }

  return null;
}

/**
 * Get schema shape
 * @param schema
 * @returns shape
 */
export function shape<TSchema extends ZodSchema>(schema: TSchema): any {
  if (schema instanceof ZodArray || schema instanceof ZodRecord)
    return shape(through(schema.element));

  if (schema instanceof ZodObject) return schema.shape;

  return schema;
}
