-- ============================================================================
-- LShorter High-Performance D1 Database Schema & Index Optimization
-- ============================================================================

-- 1. Links Table
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
  created_at TEXT DEFAULT (datetime('now'))
);

-- Crucial Indexes for Links (Eliminates full table scans)
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);

-- 2. Analytics Events Table
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
  ip_hash TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Crucial Indexes for Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_link_id ON analytics_events(link_id);
CREATE INDEX IF NOT EXISTS idx_analytics_slug ON analytics_events(slug);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_events(country);
CREATE INDEX IF NOT EXISTS idx_analytics_device ON analytics_events(device);