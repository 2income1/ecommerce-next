// src/app/page.tsx
import { auth } from "@/lib/authconfig";
import { getApiUrl } from "@/util/api";
import { Product } from "@/types";
import HeroBanner from "@/components/HeroBanner";
import CategoryNav from "@/components/CategoryNav";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import ProductListSection from "@/components/ProductListSection"; // ← 新增导入
import type { Session } from "next-auth";

export default async function HomePage() {
  const session = await auth();

  // 🔥 仅用于首屏 SSR，不缓存
  const res = await fetch(getApiUrl("/products"), {
    cache: "no-store",
    next: { tags: ["products"] }, // 可选：用于 revalidateTag
  });

  if (!res.ok) {
    console.error("❌ Failed to fetch products for SSR");
    // 即使失败，也渲染页面，让 SWR 在客户端重试
    return <HomePageShell session={session} />;
  }

  const { featured, popular } = await res.json();

  return <HomePageShell session={session} featured={featured} popular={popular} />;
}

// 单独拆出渲染壳，避免重复逻辑
function HomePageShell({
    session,
    featured = [],
    popular = [],
}: {
    session: Session | null;
    featured?: Product[];
    popular?: Product[];
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600">EcomHub</h1>
                    <nav>
                        <ul className="flex space-x-6">
                            {/* Navigation Links */}
                        </ul>
                    </nav>
                </div>
            </header>

            <HeroBanner />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SearchBar />
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <CategoryNav />
            </div>

            {/* 商品列表交给客户端组件 */}
            <ProductListSection
                initialFeatured={featured}
                initialPopular={popular}
            />
        </div>
    );
}