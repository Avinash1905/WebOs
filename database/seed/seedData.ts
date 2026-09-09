/**
 * WebOS Database - Master Seed Data Generator
 */

import { userRepository } from '../repositories/userRepository';
import { vfsRepository } from '../repositories/vfsRepository';

export async function runDatabaseSeed(): Promise<void> {
  // 1. Seed standard user accounts
  await userRepository.create({
    id: 'usr-admin-1',
    username: 'admin',
    email: 'admin@webos.local',
    password_hash: 'sha256_admin_hash_protected',
    role: 'admin',
    display_name: 'System Administrator',
  });

  await userRepository.create({
    id: 'usr-dev-2',
    username: 'developer',
    email: 'developer@webos.local',
    password_hash: 'sha256_dev_hash_protected',
    role: 'developer',
    display_name: 'WebOS Developer',
  });

  await userRepository.create({
    id: 'usr-guest-3',
    username: 'guest',
    email: 'guest@webos.local',
    password_hash: 'sha256_guest_hash_protected',
    role: 'guest',
    display_name: 'Guest Explorer',
  });

  // 2. Seed VFS filesystem inodes
  await vfsRepository.saveInode({
    ino: 1,
    user_id: 'usr-admin-1',
    name: '/',
    path: '/',
    type: 'directory',
    mode: 0o755,
    uid: 0,
    gid: 0,
    size: 4096,
    mtime: new Date(),
  });

  await vfsRepository.saveInode({
    ino: 2,
    user_id: 'usr-admin-1',
    name: 'home',
    path: '/home',
    type: 'directory',
    mode: 0o755,
    uid: 0,
    gid: 0,
    size: 4096,
    mtime: new Date(),
  });

  await vfsRepository.saveInode({
    ino: 3,
    user_id: 'usr-admin-1',
    name: 'etc',
    path: '/etc',
    type: 'directory',
    mode: 0o755,
    uid: 0,
    gid: 0,
    size: 4096,
    mtime: new Date(),
  });
}
