import { ZodRawShape, z } from "zod";

const file = <T extends ZodRawShape>(schema: T) =>
  z
    .instanceof(Blob)
    .transform((blob) => (blob.size > 0 ? blob : undefined))
    .superRefine((blob, ctx) => {
      if (blob) {
        const file = z.object(schema).safeParse({
          name: blob.name,
          size: blob.size / Math.pow(1000, 2),
          type: blob.type,
        });
        if (!file.success)
          file.error.issues.forEach((issue) => {
            ctx.addIssue(issue);
          });
      }
    });

const boolean = () =>
  z.coerce
    .string()
    .refine(
      (arg) => ["", "0", "1", "true", "false"].includes(arg.toLowerCase()),
      { message: "Value is not acceptable" }
    )
    .transform((arg) =>
      isNaN(Number(arg)) ? arg.toLowerCase() === "true" : Boolean(Number(arg))
    );

export const zu = {
  file,
  boolean,
};
