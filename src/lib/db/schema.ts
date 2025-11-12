// src/db/schema.ts
import { pgTable, serial, text, timestamp, numeric, integer, boolean} from "drizzle-orm/pg-core";
// 用户表
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(), // 使用 text 替代 varchar
  password: text("password"),              // bcrypt hash，通常 < 100 字符
  name: text("name"),
  role: text("role").default("user").notNull(),      // 'user' | 'admin'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 分类表
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 商品表
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image").notNull(),
  category_id: integer("category_id")
    .references(() => categories.id)
    .notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }).default("4.0"),
  is_featured: boolean("is_featured").default(false),
  stock_quantity: integer("stock_quantity").default(100),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// 如果有需要定义的关系，可以在这里添加
// 示例：
// export const productRelations = relations(products, ({ many }) => ({
//   reviews: many(reviews), // 假设有一个 reviews 表与 products 存在一对多关系
// }));