"use client";

import React, { useEffect, useState } from 'react';
import useSWR from "swr";
import { Product } from "@/types";
import ProductCard from "./ProductCard";
import { getApiUrl } from "@/util/api";

interface ProductListSectionProps {
    initialFeatured?: Product[];
    initialPopular?: Product[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProductListSection({
    initialFeatured = [],
    initialPopular = []
}: ProductListSectionProps) {
    const [featured, setFeatured] = useState<Product[]>(initialFeatured);
    const [popular, setPopular] = useState<Product[]>(initialPopular);
    const [loading, setLoading] = useState<boolean>(true);

    // 使用 SWR 进行数据刷新
    useSWR(getApiUrl("/products"), fetcher, {
        onSuccess(data) {
            setFeatured(data.featured || []);
            setPopular(data.popular || []);
            setLoading(false);
        },
        onError(error) {
            console.error("Failed to fetch products", error);
            setLoading(false);
        }
    });

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {/* Featured Products */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-2xl font-bold">Featured Products</h2>
                {featured.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {featured.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <p>No featured products available.</p>
                )}
            </section>

            {/* Popular Products */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-2xl font-bold">Popular in Electronics</h2>
                {popular.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {popular.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <p>No popular products available.</p>
                )}
            </section>
        </>
    );
}