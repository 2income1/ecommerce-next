// src/app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 注意这里是 Promise
) {
  const { id } = await params; // 👈 必须 await！

  const cacheKey = `product:${id}`;
  let product = await redis.get(cacheKey);

  if (!product) {
    const result = await db.select().from(products).where(eq(products.id, parseInt(id)));
    product = result[0];
    if (product) {
      await redis.set(cacheKey, product, { ex: 3600 });
    }
  }

  return NextResponse.json(product || { error: "Product not found" });
}