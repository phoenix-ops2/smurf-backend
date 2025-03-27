import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  const urls = [
    "https://dummyjson.com/products?limit=8&skip=0",
    "https://dummyjson.com/products?limit=8&skip=8",
  ];

  type DummyProduct = {
    title: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
  };

  type DummyResponse = {
    products: DummyProduct[];
  };

  try {
    // Fetch product data from both pages
    const responses = await Promise.all(urls.map((url) => axios.get<DummyResponse>(url)));
    const data = responses.map((res) => res.data);

    // Flatten and map the product data
    const products = data.flatMap((page) =>
      page.products.map((p) => ({
        title: p.title,
        description: p.description,
        price: p.price,
        stock: p.stock,
        image: p.images?.[0] || "",
      }))
    );

    // Optional: Clear existing products
    await prisma.product.deleteMany();

    // Insert into DB
    await prisma.product.createMany({ data: products });

    console.log("✅ Seeded products successfully!");
  } catch (err) {
    console.error("❌ Error seeding data:", err);
  } finally {
    await prisma.$disconnect();
  }
}

// seed();
