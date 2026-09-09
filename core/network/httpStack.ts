/**
 * WebOS Core - Virtual HTTP/HTTPS Client & Request Engine
 */

import { dnsResolver } from './dnsResolver';

export interface HTTPRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
  headers?: Record<string, string>;
  body?: string | Uint8Array | Record<string, any>;
  timeoutMs?: number;
}

export interface HTTPResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  responseTimeMs: number;
}

export class HTTPClient {
  private static instance: HTTPClient;

  private constructor() {}

  public static getInstance(): HTTPClient {
    if (!HTTPClient.instance) {
      HTTPClient.instance = new HTTPClient();
    }
    return HTTPClient.instance;
  }

  public async request<T = any>(url: string, options: HTTPRequestOptions = {}): Promise<HTTPResponse<T>> {
    const startTime = Date.now();
    const method = options.method || 'GET';
    const parsedUrl = new URL(url.startsWith('http') ? url : `http://${url}`);

    // Resolve domain through virtual DNS
    await dnsResolver.resolve(parsedUrl.hostname);

    const headers: Record<string, string> = {
      'User-Agent': 'WebOS-Kernel/2.1 (X11; WebOS x86_64)',
      'Accept': 'application/json, text/plain, */*',
      ...(options.headers || {}),
    };

    // Simulated internal WebOS loopback service routing
    if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === 'webos.local' || parsedUrl.hostname === '127.0.0.1') {
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json', 'server': 'WebOS-MicroHttpd', ...headers },
        data: {
          success: true,
          path: parsedUrl.pathname,
          query: Object.fromEntries(parsedUrl.searchParams.entries()),
          timestamp: Date.now(),
        } as unknown as T,
        responseTimeMs: Date.now() - startTime + 5,
      };
    }

    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/plain', 'server': 'Edge-Cloud-Sim' },
      data: `WebOS Virtual HTTP [${method} ${parsedUrl.pathname}] 200 OK` as unknown as T,
      responseTimeMs: Date.now() - startTime + 25,
    };
  }

  public get<T = any>(url: string, headers?: Record<string, string>): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  public post<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<HTTPResponse<T>> {
    return this.request<T>(url, { method: 'POST', body, headers });
  }
}

export const httpClient = HTTPClient.getInstance();
