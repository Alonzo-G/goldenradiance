-- ============================================================================
-- jewelry-b2b-global D1 Schema (SQLite)
-- 唯一依据: docs/ARCHITECTURE.md §9 + docs/api-spec.yaml v1.0 + docs/SPEC.md §6
-- 数据库名: jewelry-b2b-global-db
-- 应用方式:
--   本地:  npx wrangler d1 execute jewelry-b2b-global-db --local --file=infra/schema.sql
--   远端:  npx wrangler d1 execute jewelry-b2b-global-db --remote --file=infra/schema.sql
-- 约定:
--   1. 时间戳一律 TEXT ISO 8601 UTC（与 API 契约的 date-time 格式一致），由应用写入。
--   2. 邮箱在应用层先做 trim + lowercase 归一化后再落库，UNIQUE 索引才可靠。
--   3. 枚举用 CHECK 约束钉死，与 api-spec.yaml 的 enum 逐字对齐。
--   4. 不建复合索引以外的多余索引，遵循 ARCHITECTURE §9「等查询慢再加」。
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- rfq_inquiries 询盘主表
-- 询盘是本项目唯一业务资产，写入失败必须返回 500 PERSIST_FAILED（ARCHITECTURE §12.9 E6）
-- ----------------------------------------------------------------------------
CREATE TABLE rfq_inquiries (
  id                 TEXT PRIMARY KEY,              -- ULID，服务端生成（见 IMPLEMENTATION-NOTES-ARCH §4）
  reference          TEXT NOT NULL UNIQUE,          -- 买家可见询盘编号 RFQ-YYYY-NNNN，唯一索引兼做查询路径
  locale             TEXT NOT NULL DEFAULT 'en',    -- 提交时前台语言，V1 恒为 en（ADR-004）
  status             TEXT NOT NULL DEFAULT 'new'
                       CHECK (status IN ('new', 'contacted', 'quoted', 'won', 'lost')),
  company            TEXT NOT NULL,                 -- 买家公司（api-spec Contact.company, max 120）
  contact_name       TEXT NOT NULL,                 -- 联系人姓名（max 80）
  email              TEXT NOT NULL,                 -- 归一化后的小写邮箱（max 254）
  country            TEXT NOT NULL,                 -- ISO 3166-1 alpha-2，如 FR
  whatsapp           TEXT,                          -- 可选，E.164
  website            TEXT,                          -- 可选
  destination_market TEXT NOT NULL
                       CHECK (destination_market IN ('eu_uk', 'us', 'middle_east', 'other')),
  incoterm           TEXT NOT NULL
                       CHECK (incoterm IN ('EXW', 'FOB', 'CIF', 'DDP', 'UNSURE')),
  quantity_scale     TEXT NOT NULL
                       CHECK (quantity_scale IN ('sample', 'small', 'bulk')),
  message            TEXT,                          -- 买家留言（max 2000，可空）
  source_page        TEXT,                          -- 提交来源页路径，归因用（max 512，可空）
  utm_json           TEXT,                          -- UTM 参数 JSON 串，如 {"utm_source":"google"}
  turnstile_score    REAL,                          -- Turnstile siteverify 返回分值（0-1），仅记录不参与判定
  mail_status        TEXT NOT NULL DEFAULT 'pending'
                       CHECK (mail_status IN ('pending', 'sent', 'failed', 'skipped_dev')),
                       -- skipped_dev 仅出现在本地 dev 无 RESEND_API_KEY 的降级路径（SPEC §5）
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ----------------------------------------------------------------------------
-- rfq_items 询盘行项
-- 与主表同批写入（D1 batch 单事务），禁止出现无主表的孤儿行项
-- ----------------------------------------------------------------------------
CREATE TABLE rfq_items (
  id         TEXT PRIMARY KEY,                     -- ULID
  inquiry_id TEXT NOT NULL
               REFERENCES rfq_inquiries (id) ON DELETE CASCADE,
  sku        TEXT NOT NULL,                        -- 对齐 api-spec RfqItem.sku，^[A-Z0-9-]{3,32}$
  qty        INTEGER NOT NULL CHECK (qty >= 1),    -- 上限 1000000 由 Zod 层约束，DB 层只守住正值
  note       TEXT,                                 -- 行项备注（max 500，可空）
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ----------------------------------------------------------------------------
-- newsletter_subscribers 订阅者
-- 幂等语义：重复订阅返回 409 SUBSCRIBED_ALREADY 且不报错（ARCHITECTURE §8.3）
-- ----------------------------------------------------------------------------
CREATE TABLE newsletter_subscribers (
  id         TEXT PRIMARY KEY,                     -- ULID
  email      TEXT NOT NULL,                        -- 归一化后的小写邮箱，唯一性由下方索引保证
  locale     TEXT NOT NULL DEFAULT 'en',
  source     TEXT,                                 -- 订阅入口标识，如 footer / blog / popin
  status     TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'unsubscribed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================================================
-- 索引清单（ARCHITECTURE §9 锁定，逐条注明用途；不在此清单之外的索引一律不加）
-- ============================================================================

-- 后台按时间倒序浏览最新询盘（默认列表页 ORDER BY created_at DESC）
CREATE INDEX idx_rfq_created ON rfq_inquiries (created_at DESC);

-- 后台按状态筛选询盘（如只看 new 待跟进），复合排序减少回表
CREATE INDEX idx_rfq_status ON rfq_inquiries (status, created_at DESC);

-- 按买家邮箱回查历史询盘（买家重复询盘时识别老客户）
CREATE INDEX idx_rfq_email ON rfq_inquiries (email);

-- 由主表取行项（rfq_items.inquiry_id 外键查询路径），ON DELETE CASCADE 依赖此索引
CREATE INDEX idx_rfq_items_parent ON rfq_items (inquiry_id);

-- 订阅幂等判定的查询路径：INSERT 前按 email 查存在性，UNIQUE 同时拦截并发重复插入
CREATE UNIQUE INDEX idx_sub_email ON newsletter_subscribers (email);
