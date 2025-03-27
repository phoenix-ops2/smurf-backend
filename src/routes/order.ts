// import { Router, Request, Response } from "express";
// import { PrismaClient } from "@prisma/client";
// import { authenticate } from "../middleware/auth";
// import { orderSchema } from "../validators/orderValidator";

// const router = Router();
// const prisma = new PrismaClient();

// interface AuthRequest extends Request {
//   user?: { id: number };
// }

// router.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
//   const parsed = orderSchema.safeParse(req.body);

//   if (!parsed.success) {
//     res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
//     return;
//   }

//   const { items } = parsed.data;
//   const userId = (req as AuthRequest).user!.id;

//   try {
//     const order = await prisma.order.create({
//       data: {
//         userId,
//         items: {
//           create: items.map((item) => ({
//             productId: item.productId,
//             quantity: item.quantity,
//           })),
//         },
//       },
//       include: { items: true },
//     });

//     res.status(201).json({ message: "Order placed!", order });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error placing order" });
//   }
// });

// export default router;

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
    // Step 1: Validate stock availability
    const stockChecks = await Promise.all(
      items.map((item) =>
        prisma.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        })
      )
    );

    const hasInsufficientStock = stockChecks.some((product, index) => {
      return !product || product.stock < items[index].quantity;
    });

    if (hasInsufficientStock) {
      res.status(400).json({ error: "Insufficient stock for one or more items" });
      return;
    }

    // Step 2: Create the order
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

    // Step 3: Decrement stock
    await Promise.all(
      items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      )
    );

    res.status(201).json({ message: "Order placed!", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error placing order" });
  }
});

export default router;
