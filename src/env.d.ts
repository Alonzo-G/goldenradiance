// src/env.d.ts — Cloudflare Workers 运行时类型声明（仅覆盖本项目用到的面）
//
// 类型来源说明（回传 team-lead 的裁决依据）：
// @cloudflare/workers-types 已列入 @astrojs/cloudflare@14.3.3 的 devDependencies，
// 不会进入本项目 node_modules；package.json 由架构师锁定，后端无权添加依赖。
// 因此按 workerd 实际 API 在此声明最小结构类型（接口形状与 workers-types 一致），
// 后续若项目加装 @cloudflare/workers-types，删除这些 interface 即可无缝替换。
//
// 另一处与实施说明的差异（活规格）：@astrojs/cloudflare@14.3.3 已移除
// Astro.locals.runtime.env（访问即 throw）。绑定一律经 `import { env } from
// 'cloudflare:workers'` 获取，waitUntil 经 locals.cfContext 获取。

interface D1Meta {
  duration: number;
  changes: number;
  last_row_id: number;
  rows_read: number;
  rows_written: number;
}

interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: D1Meta;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/** 绑定与密钥：来源 = infra/wrangler.jsonc vars + .dev.vars（本地）/ wrangler secret（生产）。 */
interface Env {
  DB: D1Database;
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string | undefined;
  MAIL_FROM: string;
  SALES_MAILBOX: string;
  /** 后台登录密码（SHA-256 hex）；未配置则后台 fail-closed 拒绝登录 */
  ADMIN_PASSWORD: string | undefined;
  /** 后台 session HMAC 签名密钥 */
  ADMIN_SECRET: string | undefined;
}

declare module 'cloudflare:workers' {
  export const env: Env;
}

declare namespace App {
  interface Locals {
    /** @astrojs/cloudflare@14.3.3 注入的执行上下文（locals.runtime 已移除）。 */
    cfContext: ExecutionContext;
  }
}
