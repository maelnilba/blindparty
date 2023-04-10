import { type serverSchema } from "env/schema.mjs";
import { z } from "zod";

type ENV = z.infer<typeof serverSchema>;
type ExtractSocial<T extends { [key: string]: any }> = {
  [P in keyof T as Lowercase<ExtractProvider<P>>]: P;
};

type ExtractProvider<T> = T extends `${infer R}_CLIENT_ID` ? R : never;

export type Socials = keyof ExtractSocial<ENV>;
