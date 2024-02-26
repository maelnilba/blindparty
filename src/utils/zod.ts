import { ZodRawShape, z } from "zod";

const file = <T extends ZodRawShape>(schema: T) =>
  z.instanceof(Blob).superRefine((blob, ctx) => {
    const file = z.object(schema).safeParse({
      name: blob.name,
      size: blob.size / Math.pow(1000, 2),
      type: blob.type,
    });
    if (!file.success)
      file.error.issues.forEach((issue) => {
        ctx.addIssue(issue);
      });
  });

export const zu = {
  file,
};
