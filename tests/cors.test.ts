import { Request, Response, NextFunction } from 'express';
import cors from '../src/index';
import { describe, test } from 'node:test';
import assert from 'node:assert';

// Mock Express Request, Response, and NextFunction
function createMockRequest(options: {
  method?: string;
  headers?: Record<string, string>;
  path?: string;
}): Request {
  return {
    method: options.method || 'GET',
    headers: options.headers || {},
    path: options.path || '/',
  } as Request;
}

function createMockResponse(): Response & {
  headers: Record<string, string>;
  status: number;
  ended: boolean;
} {
  const headers: Record<string, string> = {};
  const response = {
    headers,
    status: 200,
    ended: false,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
    },
    getHeader(name: string) {
      return headers[name.toLowerCase()];
    },
    set statusCode(code: number) {
      this.status = code;
    },
    get statusCode() {
      return this.status;
    },
    end() {
      this.ended = true;
    },
  };
  return response as any;
}

function createMockNext(): NextFunction & { called: boolean; calledWith?: any } {
  const fn = ((err?: any) => {
    fn.called = true;
    fn.calledWith = err;
  }) as NextFunction & { called: boolean; calledWith?: any };
  fn.called = false;
  return fn;
}

// Test Suite
describe('CORS Middleware', () => {
  describe('Basic Functionality', () => {
    test('should set Access-Control-Allow-Origin to * by default', () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors();
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-origin'], '*');
      assert.strictEqual(next.called, true);
    });

    test('should reflect request origin when origin is true', () => {
      const req = createMockRequest({
        headers: { origin: 'http://example.com' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ origin: true });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-origin'], 'http://example.com');
      assert.strictEqual(next.called, true);
    });

    test('should allow specific origin', () => {
      const req = createMockRequest({
        headers: { origin: 'http://example.com' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ origin: 'http://example.com' });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-origin'], 'http://example.com');
      assert.strictEqual(next.called, true);
    });

    test('should not set origin header for disallowed origin', () => {
      const req = createMockRequest({
        headers: { origin: 'http://evil.com' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ origin: 'http://example.com' });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-origin'], undefined);
      assert.strictEqual(next.called, true);
    });
  });

  describe('Origin Validation', () => {
    test('should allow origin from array', () => {
      const req = createMockRequest({
        headers: { origin: 'http://example2.com' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({
        origin: ['http://example1.com', 'http://example2.com'],
      });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-origin'], 'http://example2.com');
    });

    test('should allow origin matching RegExp', () => {
      const req = createMockRequest({
        headers: { origin: 'http://subdomain.example.com' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ origin: /example\.com$/ });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-origin'], 'http://subdomain.example.com');
    });

    test('should validate origin with function', () => {
      const req = createMockRequest({
        headers: { origin: 'http://example.com' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({
        origin: (origin, callback) => {
          const allowed = ['http://example.com'];
          callback(null, allowed.includes(origin!));
        },
      });

      middleware(req, res, next);
      assert.strictEqual(res.headers['access-control-allow-origin'], 'http://example.com');
    });
  });

  describe('Preflight Requests', () => {
    test('should handle OPTIONS preflight request', () => {
      const req = createMockRequest({
        method: 'OPTIONS',
        headers: { origin: 'http://example.com' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ origin: 'http://example.com' });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-origin'], 'http://example.com');
      assert.strictEqual(res.headers['access-control-allow-methods'], 'GET,HEAD,PUT,PATCH,POST,DELETE');
      assert.strictEqual(res.status, 204);
      assert.strictEqual(res.ended, true);
      assert.strictEqual(next.called, false);
    });

    test('should reflect request headers in preflight', () => {
      const req = createMockRequest({
        method: 'OPTIONS',
        headers: {
          origin: 'http://example.com',
          'access-control-request-headers': 'Content-Type,Authorization',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors();
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-headers'], 'Content-Type,Authorization');
    });

    test('should continue to next handler when preflightContinue is true', () => {
      const req = createMockRequest({
        method: 'OPTIONS',
        headers: { origin: 'http://example.com' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ preflightContinue: true });
      middleware(req, res, next);

      assert.strictEqual(next.called, true);
      assert.strictEqual(res.ended, false);
    });
  });

  describe('Methods Configuration', () => {
    test('should set allowed methods from string', () => {
      const req = createMockRequest({
        method: 'OPTIONS',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ methods: 'GET,POST' });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-methods'], 'GET,POST');
    });

    test('should set allowed methods from array', () => {
      const req = createMockRequest({
        method: 'OPTIONS',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ methods: ['GET', 'POST', 'PUT'] });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-methods'], 'GET,POST,PUT');
    });
  });

  describe('Headers Configuration', () => {
    test('should set allowed headers from array', () => {
      const req = createMockRequest({
        method: 'OPTIONS',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({
        allowedHeaders: ['Content-Type', 'Authorization'],
      });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-headers'], 'Content-Type,Authorization');
    });

    test('should set exposed headers', () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({
        exposedHeaders: ['X-Total-Count', 'X-Response-Time'],
      });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-expose-headers'], 'X-Total-Count,X-Response-Time');
    });
  });

  describe('Credentials Configuration', () => {
    test('should set credentials header when true', () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ credentials: true });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
    });

    test('should not set credentials header when false', () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ credentials: false });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-credentials'], undefined);
    });
  });

  describe('MaxAge Configuration', () => {
    test('should set maxAge header', () => {
      const req = createMockRequest({
        method: 'OPTIONS',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ maxAge: 86400 });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-max-age'], '86400');
    });
  });

  describe('Options Success Status', () => {
    test('should use custom options success status', () => {
      const req = createMockRequest({
        method: 'OPTIONS',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ optionsSuccessStatus: 200 });
      middleware(req, res, next);

      assert.strictEqual(res.status, 200);
    });
  });

  describe('Dynamic Options', () => {
    test('should support dynamic options based on request', () => {
      const req = createMockRequest({
        path: '/api/public',
        headers: { origin: 'http://example.com' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const corsOptionsDelegate = (req: Request, callback: (err: Error | null, options?: any) => void) => {
        let corsOptions;
        if (req.path.startsWith('/api/public')) {
          corsOptions = { origin: '*' };
        } else {
          corsOptions = { origin: 'http://specific.com' };
        }
        callback(null, corsOptions);
      };

      const middleware = cors(corsOptionsDelegate);
      middleware(req, res, next);
      assert.strictEqual(res.headers['access-control-allow-origin'], '*');
    });
  });

  describe('Vary Header', () => {
    test('should set Vary header when origin is not *', () => {
      const req = createMockRequest({
        headers: { origin: 'http://example.com' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ origin: 'http://example.com' });
      middleware(req, res, next);

      assert.strictEqual(res.headers['vary'], 'Origin');
    });

    test('should not set Vary header when origin is *', () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ origin: '*' });
      middleware(req, res, next);

      assert.strictEqual(res.headers['vary'], undefined);
    });
  });

  describe('Error Handling', () => {
    test('should call next with error when origin validation fails', () => {
      const req = createMockRequest({
        headers: { origin: 'http://evil.com' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({
        origin: (_origin, callback) => {
          callback(new Error('Not allowed'), false);
        },
      });

      middleware(req, res, next);
      assert.ok(next.calledWith instanceof Error);
      assert.strictEqual(next.calledWith.message, 'Not allowed');
    });
  });

  describe('Edge Cases', () => {
    test('should handle request without origin header', () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors({ origin: true });
      middleware(req, res, next);

      assert.strictEqual(res.headers['access-control-allow-origin'], '*');
      assert.strictEqual(next.called, true);
    });

    test('should handle OPTIONS request without origin', () => {
      const req = createMockRequest({
        method: 'OPTIONS',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cors();
      middleware(req, res, next);

      assert.strictEqual(res.status, 204);
      assert.strictEqual(res.ended, true);
    });
  });
});

// Run tests with: node --test tests/cors.test.ts
console.log('Test suite ready. Run with: node --test tests/cors.test.ts');