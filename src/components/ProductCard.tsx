// src/components/ProductCard.tsx
"use client";

import { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/product/${product.id}`}>
        <Image
          src={product.image}
          alt={product.name}
          width={300}
          height={200}
          className="w-full h-48 object-cover"
          unoptimized={true} // CDN 图片可能不支持 next/image 默认优化
        />
      </Link>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{product.name}</h3>
        <p className="text-gray-600">
          ${(parseFloat(product.price)).toFixed(2)}
        </p>
        <div className="flex items-center mt-2">
          <span className="text-yellow-400">⭐</span>
          <span className="ml-1 text-sm text-gray-500">{product.rating}</span>
        </div>
      </div>
    </div>
  );
}