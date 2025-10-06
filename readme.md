# @your-org/cors

A Node.js CORS middleware package built with TypeScript for Express and Connect applications.

## Features

- 🔒 **Secure**: Properly handles CORS headers following web standards
- 🎯 **Flexible**: Multiple ways to configure allowed origins
- 📝 **TypeScript**: Full TypeScript support with type definitions
- ⚡ **Fast**: Minimal overhead with efficient header processing
- 🔧 **Configurable**: Extensive configuration options for all CORS scenarios
- 🚀 **Easy to use**: Simple API that works out of the box

## Installation

```bash
npm install @your-org/cors
```

## Quick Start

### Enable CORS for all routes

```typescript
import express from 'express';
import cors from '@am/cors';

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
app.get('/products/:id', cors(), (req, res) => {
  res.json({ message: 'This route has CORS enabled' });
});
```

## Configuration Options

### Basic Usage

```typescript
import cors from '@your-org/cors';

// Simple usage with specific origin
app.use(cors({
  origin: 'http://example.com'
}));
```

### All Available Options

```typescript
interface CorsOptions {
  origin?: boolean | string | RegExp | (string | RegExp)[] | Function;
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}
```

#### `origin`

Configures the **Access-Control-Allow-Origin** CORS header.

**Options:**
- `Boolean`: Set to `true` to reflect the request origin, or `false` to disable CORS
- `String`: Set to a specific origin (e.g., `'http://example.com'`)
- `RegExp`: Set to a regular expression pattern to match origins
- `Array`: Set to an array of valid origins (strings or RegExp)
- `Function`: Set to a function for custom origin validation

**Examples:**

```typescript
// Allow all origins
app.use(cors({ origin: '*' }));

// Allow specific origin
app.use(cors({ origin: 'http://example.com' }));

// Allow multiple origins
app.use(cors({ 
  origin: ['http://example1.com', 'http://example2.com'] 
}));

// Use RegExp to match origins
app.use(cors({ 
  origin: /example\.com$/ // Matches any subdomain of example.com
}));

// Dynamic origin validation
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:3000', 'http://example.com'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

#### `methods`

Configures the **Access-Control-Allow-Methods** CORS header.

```typescript
// String format
app.use(cors({ methods: 'GET,POST,PUT,DELETE' }));

// Array format
app.use(cors({ methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
```

**Default:** `'GET,HEAD,PUT,PATCH,POST,DELETE'`

#### `allowedHeaders`

Configures the **Access-Control-Allow-Headers** CORS header.

```typescript
// String format
app.use(cors({ allowedHeaders: 'Content-Type,Authorization' }));

// Array format
app.use(cors({ 
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'] 
}));
```

If not specified, defaults to reflecting the headers specified in the request's **Access-Control-Request-Headers** header.

#### `exposedHeaders`

Configures the **Access-Control-Expose-Headers** CORS header.

```typescript
app.use(cors({ 
  exposedHeaders: ['X-Total-Count', 'X-Response-Time'] 
}));
```

#### `credentials`

Configures the **Access-Control-Allow-Credentials** CORS header.

```typescript
app.use(cors({ credentials: true }));
```

**Default:** `false`

#### `maxAge`

Configures the **Access-Control-Max-Age** CORS header (in seconds).

```typescript
app.use(cors({ maxAge: 86400 })); // 24 hours
```

#### `preflightContinue`

Pass the CORS preflight response to the next handler.

```typescript
app.use(cors({ preflightContinue: true }));
```

**Default:** `false`

#### `optionsSuccessStatus`

Provides a status code to use for successful OPTIONS requests.

```typescript
app.use(cors({ optionsSuccessStatus: 200 }));
```

**Default:** `204` (Some legacy browsers like IE11 choke on 204)

## Usage Examples

### Example 1: Public API

```typescript
import express from 'express';
import cors from '@your-org/cors';

const app = express();

// Allow all origins
app.use(cors());

app.get('/api/public', (req, res) => {
  res.json({ data: 'This is public data' });
});

app.listen(3000);
```

### Example 2: Restricted to Specific Domains

```typescript
const corsOptions = {
  origin: ['http://localhost:3000', 'https://myapp.com'],
  credentials: true,
};

app.use(cors(corsOptions));
```

### Example 3: Dynamic Origin Based on Environment

```typescript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://myapp.com']
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({ origin: allowedOrigins }));
```

### Example 4: Complex Configuration

```typescript
app.use(cors({
  origin: 'https://myapp.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400,
}));
```

### Example 5: Pre-flight Requests

Certain CORS requests are considered 'complex' and require an initial **OPTIONS** request (pre-flight).

```typescript
// Enable pre-flight for a specific route
app.options('/api/users/:id', cors());
app.delete('/api/users/:id', cors(), (req, res) => {
  res.json({ message: 'User deleted' });
});

// Enable pre-flight for all routes
app.options('*', cors());
```

### Example 6: Dynamic Configuration Per Request

```typescript
const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  
  if (req.path.startsWith('/api/public')) {
    corsOptions = { origin: '*' };
  } else if (req.path.startsWith('/api/admin')) {
    corsOptions = { 
      origin: 'https://admin.myapp.com',
      credentials: true 
    };
  } else {
    corsOptions = { origin: 'https://myapp.com' };
  }
  
  callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate));
```

### Example 7: Database-backed Origin Validation

```typescript
const corsOptions = {
  origin: async (origin, callback) => {
    try {
      // Query database for allowed origins
      const allowedOrigins = await db.query('SELECT origin FROM allowed_origins');
      const origins = allowedOrigins.map(row => row.origin);
      
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    } catch (error) {
      callback(error);
    }
  }
};

app.use(cors(corsOptions));
```

## How CORS Works

### Simple Requests

For simple requests (GET, HEAD, POST with specific content types), the browser sends the request with an `Origin` header, and the server responds with appropriate CORS headers.

```
Request:
GET /api/data HTTP/1.1
Origin: http://example.com

Response:
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://example.com
Access-Control-Allow-Credentials: true
```

### Preflight Requests

For complex requests (using methods like PUT, DELETE, or custom headers), the browser first sends a preflight OPTIONS request:

```
Preflight Request:
OPTIONS /api/data HTTP/1.1
Origin: http://example.com
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: Content-Type

Preflight Response:
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://example.com
Access-Control-Allow-Methods: GET,POST,PUT,DELETE
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

## TypeScript Support

This package includes full TypeScript type definitions:

```typescript
import cors, { CorsOptions, CorsOptionsDelegate } from '@your-org/cors';

const options: CorsOptions = {
  origin: 'http://example.com',
  credentials: true,
};

app.use(cors(options));
```

## Error Handling

```typescript
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  }
}));

// Global error handler
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'CORS policy violation' });
  } else {
    next(err);
  }
});
```

## Security Considerations

1. **Never use `origin: '*'` with `credentials: true`** - This is a security risk
2. **Validate origins carefully** - Only allow trusted domains
3. **Use HTTPS in production** - CORS works over HTTP but HTTPS is recommended
4. **Be specific with allowed headers** - Don't expose more than necessary
5. **Set appropriate maxAge** - Balance between performance and security

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Watch mode for development
npm run dev

# Lint code
npm run lint
```

## Project Structure

```
@your-org/cors/
├── src/
│   ├── index.ts          # Main implementation
│   └── types.ts          # TypeScript type definitions
├── dist/                 # Compiled JavaScript
├── examples/             # Usage examples
├── tests/                # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

Inspired by the [expressjs/cors](https://github.com/expressjs/cors) package.

## Resources

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)