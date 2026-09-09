/**
 * WebOS Database - PostgreSQL Schema DDL Definitions
 * Complete relational database schema definitions for WebOS persistence.
 */

export const SCHEMA_USERS_DDL = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(128) UNIQUE NOT NULL,
  password_hash VARCHAR(256) NOT NULL,
  role VARCHAR(32) DEFAULT 'user' NOT NULL,
  display_name VARCHAR(128),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;

export const SCHEMA_SESSIONS_DDL = `
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(256) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
`;

export const SCHEMA_USER_SETTINGS_DDL = `
CREATE TABLE IF NOT EXISTS user_settings (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme_id VARCHAR(64) DEFAULT 'dark',
  density VARCHAR(32) DEFAULT 'comfortable',
  wallpaper_id VARCHAR(64) DEFAULT 'default',
  shortcuts_json JSONB DEFAULT '{}'::jsonb,
  taskbar_config JSONB DEFAULT '{}'::jsonb,
  desktop_layout JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
`;

export const SCHEMA_VFS_INODES_DDL = `
CREATE TABLE IF NOT EXISTS vfs_inodes (
  ino BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  path VARCHAR(1024) NOT NULL,
  name VARCHAR(256) NOT NULL,
  type VARCHAR(32) NOT NULL,
  size BIGINT DEFAULT 0 NOT NULL,
  mode INT DEFAULT 420 NOT NULL,
  uid INT DEFAULT 1000 NOT NULL,
  gid INT DEFAULT 1000 NOT NULL,
  content_chunk BYTEA,
  atime TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  mtime TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ctime TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vfs_inodes_user_path ON vfs_inodes(user_id, path);
`;

export const SCHEMA_AUDIT_LOGS_DDL = `
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(64) NOT NULL,
  resource VARCHAR(256),
  ip_address VARCHAR(45),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
`;
