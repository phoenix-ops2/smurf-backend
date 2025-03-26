import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 8;
    const skip = parseInt(req.query.skip as string) || 0;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.product.count(),
    ]);

    res.json({ products, total });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
