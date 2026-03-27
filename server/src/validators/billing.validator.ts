import { z } from "zod";

export const subscribeSchema = z.object({
  body: z.object({
    plan: z.enum(["starter", "pro", "enterprise"]),
  }),
});
