// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db/dbconfig";
import { products, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis";

export async function GET() {
  const cacheKey = "home:products";

  try {
    // 尝试从缓存读取
    const cached = await redis.get(cacheKey);

    if (cached) {
      // 确保 cached 是字符串
      // if (typeof cached !== 'string') {
      //   console.warn("Invalid cache format (not a string), purging key:", cacheKey);
      //   console.warn(typeof cached);
      //   await redis.del(cacheKey);
      // } else 
      // if (cached === "[object Object]" || !cached.startsWith("{")) {
      //   console.warn("Invalid cache format, purging key:", cacheKey);
      //   await redis.del(cacheKey);
      // } else {
        try { 
          return NextResponse.json(cached);
        } catch (parseError) {
          console.error("Failed to parse cache, purging:", parseError);
          await redis.del(cacheKey);
        }
      // }
    }

    // 数据库查询部分
    const featured = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        image: products.image,
        rating: products.rating,
        is_featured: products.is_featured,
        stock_quantity: products.stock_quantity,
        created_at: products.created_at,
        updated_at: products.updated_at,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(products)
      .innerJoin(categories, eq(products.category_id, categories.id))
      .where(eq(products.is_featured, true))
      .limit(6);

    const popular = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        image: products.image,
        rating: products.rating,
        is_featured: products.is_featured,
        stock_quantity: products.stock_quantity,
        created_at: products.created_at,
        updated_at: products.updated_at,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(products)
      .innerJoin(categories, eq(products.category_id, categories.id))
      .limit(8);

    const data = { featured, popular };

    // 写入缓存（记得 stringify！）
    await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching home products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}