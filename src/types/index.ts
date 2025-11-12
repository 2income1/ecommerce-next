// src/types/index.ts

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;             // ← numeric → string!
  image: string;
  category_id: number;       // ← 外键 ID，不是名称
  rating: string;            // ← numeric → string!
  is_featured: boolean;      // ← snake_case
  stock_quantity: number;
  created_at: string;        // ISO 8601 时间字符串
  updated_at: string;
}

export interface Category { 
    id: number;
    name: string;
    slug: string; 
}