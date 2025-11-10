import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const cacheKey = `product:${id}`;

  // 1. 尝试从 Redis 读取
  let product = await redis.get(cacheKey);
  if (!product) {
    // 2. 从 DB 查询
    const result = await db.select().from(products).where(eq(products.id, id));
    product = result[0];
    if (product) {
      // 3. 写入缓存，过期 1 小时
      await redis.set(cacheKey, product, { ex: 3600 });
    }
  }

  return NextResponse.json(product || { error: "Not found" });
}