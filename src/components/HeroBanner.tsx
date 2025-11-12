// src/components/HeroBanner.tsx
import Image from "next/image";

export default function HeroBanner() {
  return (
    <div className="relative h-96 md:h-[400px] bg-ient-to-r from-blue-500 to-purple-600 text-white overflow-hidden">
      <Image
        src="/hero-banner.jpg"
        alt="Promotion Banner"
        fill
        style={{ objectFit: "cover" }}
        className="opacity-70"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Summer Sale Up to 50% Off</h1>
          <p className="text-lg mb-6">Limited time offer. Shop now before it`&aposs gone!</p>
          <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}