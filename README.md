# CORS Middleware

A flexible and feature-rich CORS (Cross-Origin Resource Sharing) middleware for Node.js with full TypeScript support. This middleware enables you to configure CORS with various options for Express and Connect-based applications.

## Features

- 🚀 Simple and easy to use
- 🔒 Secure by default
- 🎯 Flexible origin validation (string, array, RegExp, function)
- ⚡ Dynamic CORS configuration per request
- 📝 Full TypeScript support with type definitions
- 🧪 Comprehensive test coverage
- 🔧 Highly configurable
- 🌐 Support for preflight requests
- 📦 Zero dependencies (peer dependency on Express)

## Installation

```bash
npm install @amitpatel-wstf/cors
```

## Quick Start

### Enable CORS for all routes

```typescript
import express from 'express';
import cors from '@amitpatel-wstf/cors';

const app = express();

// Enable CORS for all routes with default settings
app.use(cors());

app.get('/api/data', (req, res) => {
  res.json({ message: 'CORS enabled!' });
});

app.listen(3000);
```

### Enable CORS for a single route

```typescript
app.get('/api/products/:id', cors(), (req, res) => {
  res.json({ product: 'Product details' });
});
```

## Configuration Options

### CorsOptions Interface

```typescript
interface CorsOptions {
  // Configures the Access-Control-Allow-Origin header
  origin?: boolean | string | RegExp | (string | RegExp)[] | OriginCallback;
  
  // Configures the Access-Control-Allow-Methods header
  methods?: string | string[];
  
  // Configures the Access-Control-Allow-Headers header
  allowedHeaders?: string | string[];
  
  // Configures the Access-Control-Expose-Headers header
  exposedHeaders?: string | string[];
  
  // Configures the Access-Control-Allow-Credentials header
  credentials?: boolean;
  
  // Configures the Access-Control-Max-Age header
  maxAge?: number;
  
  // Pass the CORS preflight response to the next handler
  preflightContinue?: boolean;
  
  // Status code for successful OPTIONS requests
  optionsSuccessStatus?: number;
}
```

### Default Configuration

```typescript
{
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
}
```

## Usage Examples

### 1. Allow Specific Origin

```typescript
const corsOptions = {
  origin: 'http://example.com',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 2. Allow Multiple Origins

```typescript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://example.com',
    'http://example2.com'
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

### 3. Dynamic Origin Validation

```typescript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:3000', 'http://example.com'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
```

### 4. Using RegExp for Origin Matching

```typescript
const corsOptions = {
  origin: /example\.com$/  // Allows all subdomains of example.com
};

app.use(cors(corsOptions));
```

### 5. Custom Headers and Credentials

```typescript
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
  exposedHeaders: ['X-Total-Count', 'X-Response-Time'],
  credentials: true,
  maxAge: 86400  // 24 hours
};

app.use(cors(corsOptions));
```

### 6. Enable Pre-flight for Specific Routes

```typescript
// Enable pre-flight
app.options('/api/complex', cors());

// Handle the actual request
app.delete('/api/complex', cors(), (req, res) => {
  res.json({ message: 'DELETE request with CORS' });
});
```

### 7. Enable Pre-flight Across All Routes

```typescript
app.options('*', cors());
```

### 8. Dynamic CORS Options Based on Request

```typescript
const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  
  if (req.path.startsWith('/api/auth')) {
    corsOptions = {
      origin: 'http://trusted-domain.com',
      credentials: true
    };
  } else if (req.path.startsWith('/api/public')) {
    corsOptions = {
      origin: '*'
    };
  } else {
    corsOptions = {
      origin: ['http://localhost:3000', 'http://example.com']
    };
  }
  
  callback(null, corsOptions);
};

app.use('/api', cors(corsOptionsDelegate));
```

### 9. Continue to Next Handler After Preflight

```typescript
const corsOptions = {
  preflightContinue: true,
  optionsSuccessStatus: 204
};

app.options('/api/continue', cors(corsOptions), (req, res) => {
  // Custom OPTIONS handler
  res.setHeader('X-Custom-Header', 'value');
  res.sendStatus(204);
});
```

### 10. Async Origin Validation

```typescript
const corsOptions = {
  origin: async (origin, callback) => {
    try {
      // Simulate async database call
      const allowedOrigins = await fetchAllowedOriginsFromDB();
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    } catch (error) {
      callback(error, false);
    }
  }
};

app.use(cors(corsOptions));
```

## Configuration Details

### origin

Configures the `Access-Control-Allow-Origin` CORS header.

- `boolean`: Set to `true` to reflect the request origin, or `false` to disable CORS
- `string`: Set to a specific origin (e.g., `'http://example.com'`)
- `RegExp`: Set to a regular expression to match origins (e.g., `/example\.com$/`)
- `Array`: Set to an array of valid origins (strings or RegExp)
- `Function`: Custom function for dynamic origin validation

**Default:** `'*'`

### methods

Configures the `Access-Control-Allow-Methods` CORS header.

- `string`: Comma-separated list of methods (e.g., `'GET,POST'`)
- `Array`: Array of method strings (e.g., `['GET', 'POST', 'PUT']`)

**Default:** `'GET,HEAD,PUT,PATCH,POST,DELETE'`

### allowedHeaders

Configures the `Access-Control-Allow-Headers` CORS header.

- `string`: Comma-separated list of headers
- `Array`: Array of header strings
- If not specified, defaults to reflecting the headers specified in the request's `Access-Control-Request-Headers` header

### exposedHeaders

Configures the `Access-Control-Expose-Headers` CORS header.

- `string`: Comma-separated list of headers
- `Array`: Array of header strings

### credentials

Configures the `Access-Control-Allow-Credentials` CORS header.

- `boolean`: Set to `true` to pass the header, otherwise it is omitted

**Default:** `false`

### maxAge

Configures the `Access-Control-Max-Age` CORS header.

- `number`: Maximum number of seconds the results can be cached

### preflightContinue

Pass the CORS preflight response to the next handler.

- `boolean`: Set to `true` to pass to next handler, `false` to end the response

**Default:** `false`

### optionsSuccessStatus

Provides a status code to use for successful `OPTIONS` requests.

- `number`: HTTP status code (some legacy browsers choke on `204`)

**Default:** `204`

## How It Works

### Simple Requests

For simple requests (GET, HEAD, POST with simple headers), the middleware:
1. Validates the origin
2. Sets appropriate CORS headers
3. Calls the next middleware

### Preflight Requests

For preflight requests (OPTIONS method), the middleware:
1. Validates the origin
2. Sets all CORS headers including allowed methods and headers
3. Either ends the response with the configured status code or passes to the next handler

## Security Considerations

1. **Avoid using `origin: '*'` with `credentials: true`**: This is not allowed by the CORS specification
2. **Validate origins carefully**: Use specific origins or a whitelist instead of wildcards in production
3. **Limit exposed headers**: Only expose headers that are necessary for your application
4. **Set appropriate maxAge**: Balance between performance and security

## TypeScript Support

This package includes full TypeScript type definitions:

```typescript
import cors, { CorsOptions, CorsOptionsDelegate } from '@amitpatel-wstf/cors';

const options: CorsOptions = {
  origin: 'http://example.com',
  credentials: true
};

app.use(cors(options));
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests with Node.js test runner:

```bash
node --test tests/cors.test.ts
```

## Building

Build the TypeScript source:

```bash
npm run build
```

Watch mode for development:

```bash
npm run dev
```

## Browser Support

This middleware works with all modern browsers that support CORS:
- Chrome
- Firefox
- Safari
- Edge
- Opera

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Amit Patel

## Repository

https://github.com/amitpatel-wstf/cors

## Related

- [Express](https://expressjs.com/)
- [CORS Specification](https://www.w3.org/TR/cors/)
- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
