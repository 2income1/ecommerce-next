// types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string;
    email?: string;
    role?: string; // 👈 扩展 User 类型
  }

  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      role?: string; // 👈 扩展 Session.user
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string; // 👈 扩展 JWT payload
  }
}