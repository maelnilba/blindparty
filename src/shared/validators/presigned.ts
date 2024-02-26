import { createQueryValidator } from "helpers/query-validator";
import { z } from "zod";

const s3prefix = ["playlist", "user"] as const;
export const validator = createQueryValidator(
  z.object({
    prefix: z.enum(s3prefix),
  })
);
