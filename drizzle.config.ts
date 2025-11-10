// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", // 👈 必须指定
  dbCredentials: {
    url: process.env.DATABASE_URL!, // 👈 注意：字段名是 `url`，不是 `connectionString`
  },
  verbose: true,
  strict: true,
} satisfies Config;