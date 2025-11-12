// src/components/CategoryNav.tsx
import { Category } from "@/types";

const categories: Category[] = [
  { id: 1, name: "Electronics", slug: "electronics" },
  { id: 2, name: "Clothing", slug: "clothing" },
  { id: 3, name: "Books", slug: "books" },
];

export default function CategoryNav() {
  return (
    <nav className="bg-gray-100 p-4 rounded-lg mb-6">
      <ul className="flex space-x-4 overflow-x-auto">
        {categories.map((cat) => (
          <li key={cat.id}>
            <a href={`/category/${cat.slug}`} className="px-4 py-2 text-sm font-medium hover:bg-white rounded">
              {cat.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}