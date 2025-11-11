// src/db/schema.ts
import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

//用户表
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(), // ✅ 用 text 替代 varchar
  password: text("password"),              // bcrypt hash，通常 < 100 字符
  name: text("name"),
  role: text("role").default("user"),      // 'user' | 'admin'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 👇 商品表（你需要添加的！）
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // 单位：分（避免浮点）
  sku: jsonb("sku"), // 存储 SKU 信息，如颜色、尺寸等
  createdAt: timestamp("created_at").defaultNow(),
});