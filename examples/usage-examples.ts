import express, { Request, Response } from 'express';
import cors from '../src/index';

const app = express();

// =============================================================================
// Example 1: Enable CORS for all routes with default settings
// =============================================================================
app.use(cors());

app.get('/public', (req: Request, res: Response) => {
  res.json({ message: 'This is CORS-enabled for all origins!' });
});

// =============================================================================
// Example 2: Enable CORS for a single route
// =============================================================================
app.get('/products/:id', cors(), (req: Request, res: Response) => {
  res.json({ message: 'This is CORS-enabled for a single route' });
});

// =============================================================================
// Example 3: Configure CORS with specific origin
// =============================================================================
const corsOptions = {
  origin: 'http://example.com',
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.get('/restricted', cors(corsOptions), (req: Request, res: Response) => {
  res.json({ message: 'This is CORS-enabled for only example.com' });
});

// =============================================================================
// Example 4: Dynamic origin validation
// =============================================================================
const dynamicCorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Simulate database call to check allowed origins
    const allowedOrigins = ['http://localhost:3000', 'http://example.com'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.get('/dynamic', cors(dynamicCorsOptions), (req: Request, res: Response) => {
  res.json({ message: 'This uses dynamic origin validation' });
});

// =============================================================================
// Example 5: Multiple origins using array
// =============================================================================
const multipleOriginsOptions = {
  origin: ['http://localhost:3000', 'http://example.com', 'http://example2.com'],
  credentials: true,
};

app.get('/multiple', cors(multipleOriginsOptions), (req: Request, res: Response) => {
  res.json({ message: 'This allows multiple specific origins' });
});

// =============================================================================
// Example 6: Using RegExp for origin matching
// =============================================================================
const regexOriginOptions = {
  origin: /example\.com$/,
};

app.get('/regex', cors(regexOriginOptions), (req: Request, res: Response) => {
  res.json({ message: 'This allows all subdomains of example.com' });
});

// =============================================================================
// Example 7: Enable pre-flight for specific routes
// =============================================================================
app.options('/complex', cors()); // Enable pre-flight
app.delete('/complex', cors(), (req: Request, res: Response) => {
  res.json({ message: 'DELETE request with CORS' });
});

// =============================================================================
// Example 8: Enable pre-flight across all routes
// =============================================================================
app.options('*', cors()); // Enable pre-flight for all routes

// =============================================================================
// Example 9: Custom headers and credentials
// =============================================================================
const customHeadersOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
  exposedHeaders: ['X-Total-Count', 'X-Response-Time'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

app.get('/custom', cors(customHeadersOptions), (req: Request, res: Response) => {
  res.setHeader('X-Total-Count', '100');
  res.setHeader('X-Response-Time', '123ms');
  res.json({ message: 'Custom CORS configuration' });
});

// =============================================================================
// Example 10: Dynamic CORS options based on request
// =============================================================================
const dynamicOptionsDelegate = (req: Request, callback: (err: Error | null, options?: any) => void) => {
  let corsOptions;
  
  // Check if the request is from an authenticated route
  if (req.path.startsWith('/api/auth')) {
    corsOptions = {
      origin: 'http://trusted-domain.com',
      credentials: true,
    };
  } else if (req.path.startsWith('/api/public')) {
    corsOptions = {
      origin: '*',
    };
  } else {
    corsOptions = {
      origin: ['http://localhost:3000', 'http://example.com'],
    };
  }
  
  callback(null, corsOptions);
};

app.use('/api', cors(dynamicOptionsDelegate));

app.get('/api/auth/user', (req: Request, res: Response) => {
  res.json({ user: 'John Doe' });
});

app.get('/api/public/data', (req: Request, res: Response) => {
  res.json({ data: 'Public information' });
});

// =============================================================================
// Example 11: Continue to next handler after preflight
// =============================================================================
const preflightContinueOptions = {
  preflightContinue: true,
  optionsSuccessStatus: 204,
};

app.options('/continue', cors(preflightContinueOptions), (req: Request, res: Response) => {
  // Custom OPTIONS handler
  res.setHeader('X-Custom-Header', 'value');
  res.sendStatus(204);
});

// =============================================================================
// Example 12: Async origin validation (e.g., database lookup)
// =============================================================================
const asyncOriginOptions = {
  origin: async (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    try {
      // Simulate async database call
      const allowedOrigins = await Promise.resolve(['http://localhost:3000']);
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    } catch (error) {
      callback(error as Error, false);
    }
  },
};

app.get('/async', cors(asyncOriginOptions), (req: Request, res: Response) => {
  res.json({ message: 'Async origin validation' });
});

// =============================================================================
// Start the server
// =============================================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the endpoints:`);
  console.log(`- http://localhost:${PORT}/public`);
  console.log(`- http://localhost:${PORT}/products/123`);
  console.log(`- http://localhost:${PORT}/restricted`);
  console.log(`- http://localhost:${PORT}/dynamic`);
  console.log(`- http://localhost:${PORT}/multiple`);
});