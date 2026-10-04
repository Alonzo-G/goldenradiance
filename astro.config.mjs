// astro.config.mjs — 只做装配（CO-3），业务逻辑一律进 src/lib/
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  // §11.9：static 模式；API 路由单文件 export const prerender = false（禁止 hybrid）
  output: 'static',
  // 2026-10-05 修复部署失败（10014 KV namespace 撞名）：
  // 项目后台 session 用「无状态 HMAC 签名 cookie」，不依赖 Astro 的 KV session；
  // 显式 session: false 让 @astrojs/cloudflare 适配器跳过注入 SESSION KV binding。
  session: false,
  adapter: cloudflare({
    // 2026-10-02 裁决：不传 configPath——插件自动发现根目录 wrangler.jsonc（唯一真源）；
    // 冷构建的 main 存在性校验由 scripts/ensure-worker-placeholder.cjs 预置占位满足
    platformProxy: { enabled: true },
    // 2026-10-05 修复：默认 imageService 为 "cloudflare-binding" 会注入 IMAGES binding，
    // 部署时触发自动 provision 撞名。项目为静态图片（无 astro:assets 运行时转换），
    // 改用 "passthrough"（原样输出，不做运行时图片转换），禁用 IMAGES binding。
    imageService: 'passthrough',
  }),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    mdx(),
    sitemap({
      // 后台 / API 页面不入 sitemap（敏感页面，robots.txt 已 Disallow）
      // 用 URL 路径判断而非域名硬编码，换域名时无需改此处
      filter: (page) => {
        const path = new URL(page).pathname;
        return !path.startsWith('/admin/') && !path.startsWith('/api/');
      },
    }),
    icon(),
  ],
  site: 'https://rayan-accessories.com',
});
