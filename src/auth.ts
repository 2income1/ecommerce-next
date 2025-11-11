// src/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_BLOCK_DURATION = 3600; // 1 小时（秒）

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const rateLimitKey = `login_attempts:${email}`;

        // 🔒 检查是否已被限流
        const attempts = await redis.get<number>(rateLimitKey);
        if (attempts && attempts >= MAX_LOGIN_ATTEMPTS) {
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        // 🔍 查询用户
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user || !user.password) {
          // 即使用户不存在，也计入尝试次数（防止邮箱探测）
          await redis.incr(rateLimitKey);
          await redis.expire(rateLimitKey, LOGIN_BLOCK_DURATION);
          return null;
        }

        // 🔑 验证密码
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          const newAttempts = (attempts || 0) + 1;
          await redis.set(rateLimitKey, newAttempts);
          await redis.expire(rateLimitKey, LOGIN_BLOCK_DURATION);

          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            throw new Error("TOO_MANY_ATTEMPTS");
          }
          return null;
        }

        // ✅ 登录成功：清除尝试记录
        await redis.del(rateLimitKey);

        // ✅ 关键修复：将 null 转为 undefined，符合 NextAuth User 类型
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name ?? undefined, // 👈 修复点 1
          role: user.role ?? "user",    // 👈 修复点 2（配合类型扩展）
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role; // ✅ 需要 next-auth.d.ts 扩展 JWT 类型
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string; // ✅ 需要 next-auth.d.ts 扩展 Session 类型
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  events: {
    async signIn(message) {
      console.log("User signed in:", message.user?.email);
    },
  },
});