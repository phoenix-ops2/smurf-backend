// src/validators/orderValidator.ts
import { z } from "zod";

export const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number().min(1),
    })
  ),
});
