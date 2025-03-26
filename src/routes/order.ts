import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { orderSchema } from "../validators/orderValidator";

const router = Router();
const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { id: number };
}

router.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const parsed = orderSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
    return;
  }

  const { items } = parsed.data;
  const userId = (req as AuthRequest).user!.id;

  try {
    const order = await prisma.order.create({
      data: {
        userId,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json({ message: "Order placed!", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error placing order" });
  }
});

export default router;
