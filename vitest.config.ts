// vitest.config.ts — 后端单测配置（显式 import { describe, it, expect }，不用 globals）
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
