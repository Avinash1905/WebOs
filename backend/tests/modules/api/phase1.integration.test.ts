/**
 * WebOS Backend - Phase 1 HTTP End-to-End Integration Tests
 * Comprehensive API contract and routing tests across Modules 2-6.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../../../src/server/app.js';
import { createPhase1Services, type Phase1Services } from '../../../src/modules/phase1.container.js';
import { createLogger } from '../../../src/common/logging/logger.js';
import { loadConfig } from '../../../src/server/config.js';

describe('Phase 1 HTTP API Integration', () => {
  let app: FastifyInstance;
  let phase1: Phase1Services;

  beforeAll(async () => {
    const config = loadConfig();
    const logger = createLogger({ level: 'fatal', prettyPrint: false, redactPaths: [] });

    phase1 = createPhase1Services({ logger });
    await phase1.initializeAll();

    app = await createApp({
      config,
      phase1Services: phase1
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await phase1.shutdownAll();
  });

  let sessionToken: string;
  let userId: string;

  it('POST /api/v1/auth/register should register a user and return session token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        username: 'integration_tester',
        email: 'integration@webos.dev',
        password: 'ValidSuperPassword2026!',
        displayName: 'Integration Tester'
      }
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.user.username).toBe('integration_tester');
    expect(body.data.sessionToken).toBeDefined();

    sessionToken = body.data.sessionToken;
    userId = body.data.user.id;
  });

  it('POST /api/v1/auth/login should authenticate credentials and issue token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        identifier: 'integration_tester',
        password: 'ValidSuperPassword2026!'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.user.username).toBe('integration_tester');
    expect(body.data.sessionToken).toBeDefined();
  });

  it('GET /api/v1/users/me should return authenticated user profile', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: {
        authorization: `Bearer ${sessionToken}`
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(userId);
    expect(body.data.username).toBe('integration_tester');
    expect(body.data.profile.displayName).toBe('Integration Tester');
  });

  it('GET /api/v1/users/me should reject requests missing authorization header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me'
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('PATCH /api/v1/users/me/profile should update user profile', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me/profile',
      headers: {
        authorization: `Bearer ${sessionToken}`
      },
      payload: {
        displayName: 'Updated Display Name',
        theme: 'cyberpunk',
        bio: 'Coding WebOS backend foundation'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.displayName).toBe('Updated Display Name');
    expect(body.data.theme).toBe('cyberpunk');
  });

  it('GET and PUT /api/v1/users/me/desktop should manage desktop state', async () => {
    const putResponse = await app.inject({
      method: 'PUT',
      url: '/api/v1/users/me/desktop',
      headers: {
        authorization: `Bearer ${sessionToken}`
      },
      payload: {
        wallpaper: 'cyberpunk-skyline.jpg',
        theme: 'cyberpunk',
        desktopLayout: { iconGrid: 'auto' }
      }
    });

    expect(putResponse.statusCode).toBe(200);

    const getResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me/desktop',
      headers: {
        authorization: `Bearer ${sessionToken}`
      }
    });

    expect(getResponse.statusCode).toBe(200);
    const body = getResponse.json();
    expect(body.data.wallpaper).toBe('cyberpunk-skyline.jpg');
  });

  it('GET /api/v1/roles should list available roles', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/roles',
      headers: {
        authorization: `Bearer ${sessionToken}`
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(4);
  });

  it('GET /api/v1/permissions/me should return current user permissions and roles', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/permissions/me',
      headers: {
        authorization: `Bearer ${sessionToken}`
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.roles).toContain('USER');
    expect(body.data.permissions).toContain('files:read');
  });

  it('GET /api/v1/sessions/me should list active sessions for current user', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/sessions/me',
      headers: {
        authorization: `Bearer ${sessionToken}`
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].isCurrent).toBe(true);
  });

  it('POST /api/v1/auth/logout should revoke active session', async () => {
    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: {
        authorization: `Bearer ${sessionToken}`
      }
    });

    expect(logoutResponse.statusCode).toBe(200);

    // After logout, token must be rejected
    const verifyResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: {
        authorization: `Bearer ${sessionToken}`
      }
    });

    expect(verifyResponse.statusCode).toBe(401);
  });
});
