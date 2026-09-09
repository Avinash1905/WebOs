/**
 * WebOS Backend - Master API Router
 * Unified REST API endpoint dispatcher supporting JSON payloads and HTTP responses.
 */

import { authService } from '../auth/authService';
import { syncService } from '../sync/syncService';
import { jwtService } from '../auth/jwt';

export interface APIRequest {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: any;
}

export interface APIResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
}

export class APIRouter {
  public async handle(req: APIRequest): Promise<APIResponse> {
    const { path, method, headers, body } = req;

    // 1. /api/auth/login
    if (path === '/api/auth/login' && method === 'POST') {
      const { username, password } = body || {};
      if (!username || !password) {
        return { status: 400, body: { error: 'Username and password are required' } };
      }
      const session = await authService.login(username, password);
      if (!session) {
        return { status: 401, body: { error: 'Invalid username or credentials' } };
      }
      return { status: 200, body: session };
    }

    // 2. /api/auth/register
    if (path === '/api/auth/register' && method === 'POST') {
      const { username, email, password } = body || {};
      if (!username || !email || !password) {
        return { status: 400, body: { error: 'All fields are required' } };
      }
      try {
        const session = await authService.register(username, email, password);
        return { status: 201, body: session };
      } catch (err: any) {
        return { status: 400, body: { error: err.message } };
      }
    }

    // Auth verification middleware for protected routes
    const authHeader = headers['authorization'] || headers['Authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const userPayload = jwtService.verify(token);

    // 3. /api/user/profile
    if (path === '/api/user/profile' && method === 'GET') {
      if (!userPayload) {
        return { status: 401, body: { error: 'Unauthorized: Invalid token' } };
      }
      return {
        status: 200,
        body: {
          id: userPayload.sub,
          username: userPayload.username,
          role: userPayload.role,
        },
      };
    }

    // 4. /api/sync/push
    if (path === '/api/sync/push' && method === 'POST') {
      if (!userPayload) {
        return { status: 401, body: { error: 'Unauthorized' } };
      }
      const result = await syncService.processSync(body);
      return { status: 200, body: result };
    }

    // 5. /api/system/status
    if (path === '/api/system/status' && method === 'GET') {
      return {
        status: 200,
        body: {
          status: 'online',
          version: '2.0.0',
          uptime: process.uptime ? process.uptime() : 120,
          services: {
            auth: 'healthy',
            sync: 'healthy',
            database: 'connected',
            vfs: 'ready',
          },
        },
      };
    }

    return { status: 404, body: { error: `Endpoint not found: ${method} ${path}` } };
  }
}

export const apiRouter = new APIRouter();
