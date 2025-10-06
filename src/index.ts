import { Request, Response, NextFunction } from 'express';

/**
 * CORS Configuration Options
 */
export interface CorsOptions {
  /**
   * Configures the Access-Control-Allow-Origin header
   * @default '*'
   */
  origin?: boolean | string | RegExp | (string | RegExp)[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean | string | RegExp | (string | RegExp)[]) => void) => void);
  
  /**
   * Configures the Access-Control-Allow-Methods header
   * @default 'GET,HEAD,PUT,PATCH,POST,DELETE'
   */
  methods?: string | string[];
  
  /**
   * Configures the Access-Control-Allow-Headers header
   */
  allowedHeaders?: string | string[];
  
  /**
   * Configures the Access-Control-Expose-Headers header
   */
  exposedHeaders?: string | string[];
  
  /**
   * Configures the Access-Control-Allow-Credentials header
   * @default false
   */
  credentials?: boolean;
  
  /**
   * Configures the Access-Control-Max-Age header
   */
  maxAge?: number;
  
  /**
   * Pass the CORS preflight response to the next handler
   * @default false
   */
  preflightContinue?: boolean;
  
  /**
   * Provides a status code to use for successful OPTIONS requests
   * @default 204
   */
  optionsSuccessStatus?: number;
}

/**
 * CORS Options with callback support
 */
export type CorsOptionsDelegate = (
  req: Request,
  callback: (err: Error | null, options?: CorsOptions) => void
) => void;

/**
 * Default CORS configuration
 */
const DEFAULT_OPTIONS: CorsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

/**
 * Check if a value is a string
 */
function isString(value: any): value is string {
  return typeof value === 'string' || value instanceof String;
}

/**
 * Check if an origin is allowed based on the configuration
 */
function isOriginAllowed(requestOrigin: string, allowedOrigin: boolean | string | RegExp | (string | RegExp)[]): boolean {
  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.some(origin => isOriginAllowed(requestOrigin, origin));
  }
  
  if (isString(allowedOrigin)) {
    return requestOrigin === allowedOrigin;
  }
  
  if (allowedOrigin instanceof RegExp) {
    return allowedOrigin.test(requestOrigin);
  }
  
  return !!allowedOrigin;
}

/**
 * Configure the Access-Control-Allow-Origin header
 */
function configureOrigin(options: CorsOptions, req: Request): { key: string; value: string } | null {
  const requestOrigin = req.headers.origin;
  
  if (!options.origin || options.origin === '*') {
    return {
      key: 'Access-Control-Allow-Origin',
      value: '*',
    };
  }
  
  if (options.origin === true) {
    return {
      key: 'Access-Control-Allow-Origin',
      value: requestOrigin || '*',
    };
  }
  
  if (requestOrigin && isOriginAllowed(requestOrigin, options.origin as string | RegExp | (string | RegExp)[])) {
    return {
      key: 'Access-Control-Allow-Origin',
      value: requestOrigin,
    };
  }
  
  return null;
}

/**
 * Configure the Access-Control-Allow-Methods header
 */
function configureMethods(options: CorsOptions): { key: string; value: string } {
  let methods = options.methods;
  
  if (Array.isArray(methods)) {
    methods = methods.join(',');
  }
  
  return {
    key: 'Access-Control-Allow-Methods',
    value: methods as string,
  };
}

/**
 * Configure the Access-Control-Allow-Credentials header
 */
function configureCredentials(options: CorsOptions): { key: string; value: string } | null {
  if (options.credentials === true) {
    return {
      key: 'Access-Control-Allow-Credentials',
      value: 'true',
    };
  }
  return null;
}

/**
 * Configure the Access-Control-Allow-Headers header
 */
function configureAllowedHeaders(options: CorsOptions, req: Request): { key: string; value: string } | null {
  let allowedHeaders = options.allowedHeaders;
  
  if (!allowedHeaders) {
    // Reflect the request headers
    const requestHeaders = req.headers['access-control-request-headers'];
    if (requestHeaders) {
      allowedHeaders = requestHeaders as string;
    }
  } else if (Array.isArray(allowedHeaders)) {
    allowedHeaders = allowedHeaders.join(',');
  }
  
  if (allowedHeaders && allowedHeaders.length) {
    return {
      key: 'Access-Control-Allow-Headers',
      value: allowedHeaders as string,
    };
  }
  
  return null;
}

/**
 * Configure the Access-Control-Expose-Headers header
 */
function configureExposedHeaders(options: CorsOptions): { key: string; value: string } | null {
  let exposedHeaders = options.exposedHeaders;
  
  if (!exposedHeaders) {
    return null;
  }
  
  if (Array.isArray(exposedHeaders)) {
    exposedHeaders = exposedHeaders.join(',');
  }
  
  if (exposedHeaders && exposedHeaders.length) {
    return {
      key: 'Access-Control-Expose-Headers',
      value: exposedHeaders as string,
    };
  }
  
  return null;
}

/**
 * Configure the Access-Control-Max-Age header
 */
function configureMaxAge(options: CorsOptions): { key: string; value: string } | null {
  const maxAge = options.maxAge;
  
  if (typeof maxAge === 'number') {
    return {
      key: 'Access-Control-Max-Age',
      value: maxAge.toString(),
    };
  }
  
  return null;
}

/**
 * Apply headers to the response
 */
function applyHeaders(headers: ({ key: string; value: string } | null)[], res: Response): void {
  headers.forEach(header => {
    if (header) {
      res.setHeader(header.key, header.value);
    }
  });
}

/**
 * Add Vary header
 */
function vary(res: Response, field: string): void {
  let existingVary = res.getHeader('Vary') as string;
  
  if (!existingVary) {
    res.setHeader('Vary', field);
    return;
  }
  
  const varyArray = existingVary.split(',').map(v => v.trim());
  
  if (!varyArray.includes(field)) {
    varyArray.push(field);
    res.setHeader('Vary', varyArray.join(', '));
  }
}

/**
 * CORS middleware handler
 */
function cors(options: CorsOptions, req: Request, res: Response, next: NextFunction): void {
  const method = req.method?.toUpperCase();
  const headers: ({ key: string; value: string } | null)[] = [];
  
  // Always add Vary header for Origin
  if (options.origin !== '*') {
    vary(res, 'Origin');
  }
  
  if (method === 'OPTIONS') {
    // Preflight request
    headers.push(configureOrigin(options, req));
    headers.push(configureCredentials(options));
    headers.push(configureMethods(options));
    headers.push(configureAllowedHeaders(options, req));
    headers.push(configureMaxAge(options));
    headers.push(configureExposedHeaders(options));
    
    applyHeaders(headers, res);
    
    if (options.preflightContinue) {
      next();
    } else {
      // Safari and some browsers need Content-Length: 0 for 204
      res.statusCode = options.optionsSuccessStatus || 204;
      res.setHeader('Content-Length', '0');
      res.end();
    }
  } else {
    // Simple/Actual request
    headers.push(configureOrigin(options, req));
    headers.push(configureCredentials(options));
    headers.push(configureExposedHeaders(options));
    
    applyHeaders(headers, res);
    next();
  }
}

/**
 * Create CORS middleware
 */
export default function createCorsMiddleware(
  optionsOrDelegate?: CorsOptions | CorsOptionsDelegate
): (req: Request, res: Response, next: NextFunction) => void {
  // If no options provided, use defaults
  if (!optionsOrDelegate) {
    const options = { ...DEFAULT_OPTIONS };
    return (req: Request, res: Response, next: NextFunction) => {
      cors(options, req, res, next);
    };
  }
  
  // If options is a function (delegate), handle dynamic options
  if (typeof optionsOrDelegate === 'function') {
    const optionsDelegate = optionsOrDelegate as CorsOptionsDelegate;
    return (req: Request, res: Response, next: NextFunction) => {
      optionsDelegate(req, (err: Error | null, dynamicOptions?: CorsOptions) => {
        if (err) {
          next(err);
        } else {
          const options = { ...DEFAULT_OPTIONS, ...dynamicOptions };
          
          // Handle dynamic origin callback
          if (typeof options.origin === 'function') {
            const originCallback = options.origin;
            originCallback(req.headers.origin, (err2: Error | null, allow?: boolean | string | RegExp | (string | RegExp)[]) => {
              if (err2 || !allow) {
                next(err2);
              } else {
                const corsOptions = { ...options, origin: allow };
                cors(corsOptions, req, res, next);
              }
            });
          } else {
            cors(options, req, res, next);
          }
        }
      });
    };
  }
  
  // Static options
  const options = { ...DEFAULT_OPTIONS, ...optionsOrDelegate };
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Handle dynamic origin callback
    if (typeof options.origin === 'function') {
      const originCallback = options.origin;
      originCallback(req.headers.origin, (err: Error | null, allow?: boolean | string | RegExp | (string | RegExp)[]) => {
        if (err || !allow) {
          next(err);
        } else {
          const corsOptions = { ...options, origin: allow };
          cors(corsOptions, req, res, next);
        }
      });
    } else {
      cors(options, req, res, next);
    }
  };
}

// Named export for convenience
export { createCorsMiddleware as cors };