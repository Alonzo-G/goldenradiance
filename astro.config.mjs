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
  adapter: cloudflare({
    // 2026-10-02 裁决：不传 configPath——插件自动发现根目录 wrangler.jsonc（唯一真源）；
    // 冷构建的 main 存在性校验由 scripts/ensure-worker-placeholder.cjs 预置占位满足
    platformProxy: { enabled: true },
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
