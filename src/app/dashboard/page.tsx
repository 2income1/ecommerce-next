// src/app/dashboard/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="p-6">
      <h1>Welcome, {session.user?.name || session.user?.email}!</h1>
      <p>Your role: <strong>{session.user?.role}</strong></p>
      <p>User ID: {session.user?.id}</p>
    </div>
  );
}