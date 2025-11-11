// src/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import bcrypt from "bcryptjs";
import { users } from "@/db/schema"; 
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_BLOCK_DURATION = 3600; // 1 小时（秒）
// 👇 关键：强制使用 Node.js Runtime
export const runtime = "nodejs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Redis client type:", typeof redis.get); // 应该是 function
        console.log("🔍 [NextAuth] authorize() called with credentials:", {
          email: credentials?.email,
        });

        if (!credentials?.email || !credentials.password) {
          console.warn("⚠️ [NextAuth] Missing email or password");
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const rateLimitKey = `login_attempts:${email}`;

        // 🔒 检查是否已被限流
        const attempts = await redis.get<number>(rateLimitKey);
        console.log(`📊 [NextAuth] Current login attempts for ${email}:`, attempts);

        if (attempts && attempts >= MAX_LOGIN_ATTEMPTS) {
          console.warn(`🚫 [NextAuth] Blocked due to too many attempts for ${email}`);
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        // 🔍 查询用户
        console.log(`🔎 [NextAuth] Querying user in DB: ${email}`);
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user || !user.password) {
          console.warn(`👤 [NextAuth] User not found or no password set: ${email}`);
          // 即使用户不存在，也计入尝试次数（防止邮箱探测）
          const newAttempts = (attempts || 0) + 1;
          await redis.set(rateLimitKey, newAttempts);
          await redis.expire(rateLimitKey, LOGIN_BLOCK_DURATION);
          console.log(`📈 [NextAuth] Incremented attempts to ${newAttempts} for ${email}`);
          return null;
        }

        // 🔑 验证密码
        console.log(`🔑 [NextAuth] Verifying password for user ID: ${user.id}`);
        const isValid = await bcrypt.compare(credentials.password, user.password);
        console.log(`✅ [NextAuth] Password valid: ${isValid}`);

        if (!isValid) {
          const newAttempts = (attempts || 0) + 1;
          await redis.set(rateLimitKey, newAttempts);
          await redis.expire(rateLimitKey, LOGIN_BLOCK_DURATION);
          console.log(`📈 [NextAuth] Invalid password. Attempts now: ${newAttempts}`);

          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            console.error(`💣 [NextAuth] Max attempts reached for ${email}. Blocking.`);
            throw new Error("TOO_MANY_ATTEMPTS");
          }
          return null;
        }

        // ✅ 登录成功：清除尝试记录
        await redis.del(rateLimitKey);
        console.log(`🎉 [NextAuth] Login successful for ${email}. Clearing rate limit.`);

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name ?? undefined,
          role: user.role ?? "user",
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      console.log("webtoken callback", { token, userExists: !!user });
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      console.log("session callback", { session, token });
      if (session.user) {
        session.user.id = token.sub as string;
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
    async signIn(message) {
      console.log("✅ [NextAuth Event] User signed in:", message.user?.email);
    },
    async signOut(message) {
      console.log("👋 [NextAuth Event] User signed out:", message.token?.sub);
    },
  },
});