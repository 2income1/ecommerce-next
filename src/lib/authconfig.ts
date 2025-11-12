/**
 * @file authconfig.ts
 * @author HuiZong Xiao
 * @date 2025-11-12
 * @description NextAuth.js 认证配置中心，实现基于邮箱/密码的凭证登录，
 *              包含密码验证、Redis 登录限流、JWT 会话管理。
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db/dbconfig";
import bcrypt from "bcryptjs";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis";

// === 常量配置 ===
const MAX_LOGIN_ATTEMPTS = 5; // 登录失败最大尝试次数
const LOGIN_BLOCK_DURATION = 3600; // 限流持续时间（秒），1 小时

/**
 * NextAuth 核心配置实例。
 *
 * 负责：
 * - 定义认证提供者（Credentials）
 * - 实现用户凭证验证逻辑（authorize）
 * - 配置 JWT 与 Session 回调
 * - 设置自定义登录页路径
 * - 集成 Redis 登录频率限制（防暴力破解）
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /**
       * 自定义凭证授权逻辑。
       * 在用户提交登录表单后被调用，用于验证身份。
       *
       * @param credentials - 用户输入的凭证（来自登录表单）
       * @returns 返回用户对象（成功）或 null（失败），抛出 Error 表示阻断性错误
       */
      async authorize(credentials) {
        // 类型守卫：确保凭证存在且为字符串类型
        if (
          !credentials ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const rateLimitKey = `login_attempts:${email}`;

        // 检查是否因频繁失败被临时封禁
        const attempts = await redis.get<number>(rateLimitKey);
        if (attempts && attempts >= MAX_LOGIN_ATTEMPTS) {
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        // 查询数据库中的用户
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        // 用户不存在或无密码字段：视为无效登录
        if (!user || !user.password) {
          const newAttempts = (attempts || 0) + 1;
          await redis.set(rateLimitKey, newAttempts);
          await redis.expire(rateLimitKey, LOGIN_BLOCK_DURATION);
          return null;
        }

        // 验证密码哈希
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          const newAttempts = (attempts || 0) + 1;
          await redis.set(rateLimitKey, newAttempts);
          await redis.expire(rateLimitKey, LOGIN_BLOCK_DURATION);

          // 达到最大尝试次数，触发封禁
          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            throw new Error("TOO_MANY_ATTEMPTS");
          }
          return null;
        }

        // 登录成功：清除该邮箱的失败计数
        await redis.del(rateLimitKey);

        // 返回标准化用户信息供 NextAuth 内部使用
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
    /**
     * JWT 回调：在每次生成或更新 JWT 时调用。
     * 用于将用户角色等信息注入 token。
     */
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sub = user.id; // sub 是 JWT 标准字段，代表主体（用户 ID）
      }
      return token;
    },
    /**
     * Session 回调：在每次获取 session 时调用。
     * 将 JWT 中的信息同步到前端可访问的 session 对象。
     */
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    // 自定义登录页面路径（覆盖 NextAuth 默认登录页）
    signIn: "/login",
  },
  session: {
    // 使用 JWT 策略（无服务器端 session 存储，适合 Serverless 架构）
    strategy: "jwt",
  },
  events: {
    /**
     * 登录成功事件钩子（可用于审计日志、指标上报等，当前仅保留结构）
     */
    async signIn(message) {
      // 可选：记录登录事件到监控系统
    },
    /**
     * 登出事件钩子
     */
    async signOut() {
      // 可选：清理用户相关缓存或日志
    },
  },
});