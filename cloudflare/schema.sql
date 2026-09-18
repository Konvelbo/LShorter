-- ============================================================================
-- LShorter High-Performance D1 Database Schema & Index Optimization
-- ============================================================================

-- 1. Users Table (Identity & FullName — Cloudflare D1)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'FREEMIUM',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- 2. Links Table
CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  domain_name TEXT NOT NULL DEFAULT 'lsho.cc',
  slug TEXT NOT NULL UNIQUE,
  short_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  clicks_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  routing_rules TEXT,
  geo_targeting TEXT,
  device_targeting TEXT,
  og_image TEXT,
  og_title TEXT,
  og_description TEXT,
  meta_title TEXT,
  twitter_card TEXT DEFAULT 'summary_large_image',
  password TEXT,
  is_cloaked INTEGER DEFAULT 0,
  hide_referrer INTEGER DEFAULT 0,
  expires_at TEXT,
  max_clicks INTEGER,
  fallback_url TEXT,
  ab_variations TEXT,
  main_weight INTEGER DEFAULT 100,
  redirect_type TEXT DEFAULT '302',
  pass_params INTEGER DEFAULT 1,
  tags TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Crucial Indexes for Links (Eliminates full table scans)
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);

-- 3. Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  link_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  country TEXT DEFAULT 'FR',
  city TEXT DEFAULT 'Inconnue',
  referrer TEXT DEFAULT 'Direct',
  device TEXT DEFAULT 'desktop',
  browser TEXT DEFAULT 'Chrome',
  os TEXT DEFAULT 'Windows',
  customer_email TEXT,
  customer_name TEXT,
  customer_avatar TEXT,
  conversion_amount REAL DEFAULT 0,
  ip_hash TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Crucial Indexes for Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_link_id ON analytics_events(link_id);
CREATE INDEX IF NOT EXISTS idx_analytics_slug ON analytics_events(slug);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_events(country);
CREATE INDEX IF NOT EXISTS idx_analytics_device ON analytics_events(device);

-- 4. Organizations Table (Control Plane Metadata in D1)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'FREE',
  billing_cycle TEXT NOT NULL DEFAULT 'MONTHLY',
  tax_id TEXT,
  billing_address TEXT,
  company_name TEXT,
  billing_email TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orgs_slug ON organizations(slug);

-- 5. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'mock',
  provider_subscription_id TEXT NOT NULL,
  current_period_start INTEGER,
  current_period_end INTEGER,
  cancel_at_period_end INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);

-- 6. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  plan_id TEXT NOT NULL,
  amount_paid REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'PAID',
  period_start INTEGER,
  period_end INTEGER,
  overage_amount REAL DEFAULT 0,
  batches_overage INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);

