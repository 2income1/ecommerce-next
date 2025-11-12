// utils/api.ts 或直接在组件里
export const getApiUrl = (path: string) => {
    if (typeof window !== 'undefined') {
        // 客户端：相对路径可行，但为了统一建议用绝对
        return `/api${path}`;
    } else {
        // 服务端：必须绝对 URL
        const host = process.env.NEXTAUTH_URL
            ? process.env.NEXTAUTH_URL
            : "http://localhost:3000";
        return `${host}/api${path}`;
    }
};
