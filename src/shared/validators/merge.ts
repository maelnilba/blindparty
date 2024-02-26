import { createQueryValidator } from "helpers/query-validator";
import { z } from "zod";

export const validator = createQueryValidator(
  z.object({
    sources: z.array(z.string().url()).length(4),
  })
);
