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
  country TEXT DEFAULT 'FR�	�]HVQ�US	�[��ۛ�YI��\�\��Y�[�V��Y�\��\�VQ�US	�\�X�	��ܙX]Y�]VQ�US
]][YJ	ۛ���JB�N�ԑPUHS�VQ���VT��Y�[�[]X���[���Yӈ[�[]X���]�[��[���Y
NԑPUHS�VQ���VT��Y�[�[]X����Y�ӈ[�[]X���]�[���Y�NԑPUHS�VQ���VT��Y�[�[]X���ܙX]Y�]ӈ[�[]X���]�[��ܙX]Y�]
N�KHˈ�\��H�XZ[��X�B�ԑPUHP�HQ���VT���XZ[��
�YV�SPT�H�VK�\�\��YV���S��XZ[�V���SS�TUQK��]\�VQ�US	�X�]�I��ܙX]Y�]VQ�US
]][YJ	ۛ���JB�N�ԑPUHS�VQ���VT��Y��XZ[���\�\��Yӈ�XZ[��\�\��Y
NԑPUHS�TUQHS�VQ���VT��Y��XZ[����XZ[�ӈ�XZ[���XZ[�N�