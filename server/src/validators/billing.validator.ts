import { z } from "zod";

export const subscribeSchema = z.object({
  body: z.object({
    priceId: z.string().min(1, "Price ID is required"),
  }),
});
