// src/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis"; // 确保该文件已正确配置 Upstash

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
          // 密码错误，增加尝试次数
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

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name || null,
          role: user.role || "user",
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
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
    // 可选：记录安全事件（如登录失败）
    async signIn(message) {
      console.log("User signed in:", message.user?.email);
    },
  },
});