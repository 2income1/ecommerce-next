// src/components/SearchBar.tsx
"use client";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q") as string;
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-6">
      <div className="flex items-center border rounded-lg overflow-hidden shadow-sm">
        <input
          type="text"
          name="q"
          placeholder="Search products..."
          className="flex-grow px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-600"
        >
          Search
        </button>
      </div>
    </form>
  );
}