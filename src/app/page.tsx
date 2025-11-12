// src/app/page.tsx
import { auth } from "@/lib/authconfig"; 
import { getApiUrl } from "@/util/api"; 
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import HeroBanner from "@/components/HeroBanner";
import CategoryNav from "@/components/CategoryNav";
import SearchBar from "@/components/SearchBar"; 
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  
  // 使用
  const res = await fetch(getApiUrl("/products"), { cache: "no-store" }); 
   
  if (!res.ok) {
    console.error("Failed to fetch products");
    return <div>Error loading products</div>;
  }

  const { featured, popular }: { featured: Product[]; popular: Product[] } = await res.json();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">EcomHub</h1>
          <nav>
            <ul className="flex space-x-6">
              <li><Link  href="/" className="hover:text-blue-600">Home</Link></li>
              <li><a href="/products" className="hover:text-blue-600">Products</a></li>
              <li><a href="/cart" className="hover:text-blue-600">Cart</a></li>
              {session ? (
                <li><a href="/dashboard" className="hover:text-blue-600">Dashboard</a></li>
              ) : (
                <li><a href="/login" className="hover:text-blue-600">Login</a></li>
              )}
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Banner */}
      <HeroBanner />

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchBar />
      </div>

      {/* Category Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CategoryNav />
      </div>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Popular Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Popular in Electronics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {popular.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}