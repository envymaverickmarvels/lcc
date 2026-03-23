# LocalMed - Agent Coding Guidelines

This file provides guidelines for AI agents working on the LocalMed monorepo project.

## Project Overview

- **Node.js**: 22+
- **npm**: 11+
- **Monorepo**: Turborepo with workspaces (apps/*, packages/*, services/*)
- **Database**: PostgreSQL 18 with Prisma ORM
- **Cache**: Redis 8

---

## Build, Lint & Test Commands

### Root Commands (Monorepo-wide)
```bash
npm run dev              # Start all apps in dev mode
npm run build           # Build all packages/apps
npm run test            # Run tests in all packages
npm run lint            # Lint all packages
npm run typecheck       # TypeScript type checking
npm run format          # Format code with Prettier
npm run clean            # Clean build artifacts
```

### API Service (Backend)
```bash
cd services/api
npm run dev             # Start API with hot reload (tsx watch)
npm run build           # Compile TypeScript
npm run start           # Start production server
npm run lint            # Lint src directory
npm run test            # Run vitest (all tests)

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
npm run db:migrate      # Run Prisma migrations

# Run single test file
npx vitest run src/routes/auth.test.ts
npx vitest run src/services/auth.test.ts --reporter=verbose

# Run single test
npx vitest run -t "should register user"
```

### Web App (Next.js)
```bash
cd apps/web
npm run dev
npm run build
npm run lint
npm run typecheck
```

### Mobile App (React Native/Expo)
```bash
cd apps/mobile
npm run start           # Start Expo
npm run dev             # Start with dev client
npm run android        # Build Android
npm run ios             # Build iOS
npm run lint
```

### Dashboard App
```bash
cd apps/dashboard
npm run dev
npm run build
npm run lint
```

### Individual Packages
```bash
# UI Components
cd packages/ui
npm run build           # Build with tsup
npm run dev             # Watch mode

# Core
cd packages/core
npm run build

# API Client
cd packages/api-client
npm run build
```

---

## Code Style Guidelines

### TypeScript
- Use **strict mode** - always define return types for functions
- Use **explicit types** for function parameters, not `any`
- Use **interface** for object shapes, **type** for unions/aliases
- Prefer **const** assertions where appropriate
- Use **template literal types** for string patterns

```typescript
// Good
interface User {
  id: string;
  name: string;
  email?: string;
}

type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// Bad
const user: any = {};
function foo(x) { return x; }
```

### File Organization

#### Directory Structure
```
src/
├── routes/           # Express route handlers
├── controllers/      # Business logic
├── services/         # External service integrations
├── repositories/    # Database queries
├── middleware/     # Express middleware
├── utils/           # Helper functions
├── types/           # TypeScript types
└── config/          # Configuration
```

#### File Naming
- **Routes**: `auth.ts`, `users.ts`, `pharmacies.ts`
- **Services**: `authService.ts`, `medicineService.ts`
- **Utils**: `formatCurrency.ts`, `validation.ts`
- **Tests**: `auth.test.ts`, `authService.test.ts`
- **Components**: PascalCase (`Button.tsx`, `MedicineCard.tsx`)

### Imports

#### Order of Imports
1. Built-in/External packages
2. Internal packages (@localmed/*)
3. Relative imports (./, ../)

```typescript
// 1. External
import express, { Request, Response } from 'express';
import { z } from 'zod';

// 2. Internal packages
import { authApi } from '@localmed/api-client';
import { Button, Card } from '@localmed/ui';

// 3. Relative
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `isActive` |
| Functions | camelCase | `getUserById()`, `formatCurrency()` |
| Classes | PascalCase | `AuthService`, `MedicineController` |
| Components | PascalCase | `Button`, `MedicineCard` |
| Interfaces | PascalCase | `User`, `PharmacyStock` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Database Tables | snake_case | `pharmacy_stock`, `order_items` |
| Database Columns | snake_case | `user_id`, `created_at` |

### Error Handling

#### Backend (Express)
```typescript
// Use AppError for known errors
throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

// Global error handler middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }
  // Log unexpected errors
  console.error(err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
}
```

#### Frontend (React)
```typescript
// Use try-catch with user feedback
try {
  await fetchData();
} catch (error) {
  toast.error('Failed to load data. Please try again.');
}
```

### Database (Prisma)

```typescript
// Always include relations when needed
const user = await prisma.user.findUnique({
  where: { id },
  include: { orders: true },
});

// Use transactions for multiple writes
await prisma.$transaction([
  prisma.order.create({ data: orderData }),
  prisma.pharmacyStock.update({ where: { id: stockId }, data: { stockQuantity: { decrement: 1 } } }),
]);

// Raw queries for complex geospatial operations
await prisma.$queryRaw`SELECT * FROM pharmacies WHERE ST_DWithin(...)`;
```

### Validation (Zod)

```typescript
// Define schemas in separate files
export const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/),
});

// Parse and handle errors
const result = createUserSchema.safeParse(req.body);
if (!result.success) {
  throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR');
}
```

### React/Next.js

- Use **functional components** with hooks
- Use **TypeScript generics** for custom hooks
- Follow **file-based routing** conventions
- Use **Server Components** by default, add 'use client' only when needed
- Use **CSS modules** or Tailwind classes, avoid inline styles

```typescript
// Good
'use client';
import { useState } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export function Button({ variant = 'primary', onClick }: ButtonProps) {
  const [loading, setLoading] = useState(false);
  return <button onClick={onClick}>{loading ? 'Loading...' : 'Submit'}</button>;
}
```

---

## Testing Guidelines

### Test Structure
```bash
src/
├── __tests__/
│   ├── unit/
│   │   ├── authService.test.ts
│   │   └── validation.test.ts
│   └── integration/
│       ├── auth.api.test.ts
│       └── orders.api.test.ts
```

### Test Commands
```bash
# All tests
npm run test

# Single file
npx vitest run auth.test.ts

# Watch mode
npx vitest

# With coverage
npx vitest run --coverage
```

### Test Conventions
- Use `describe()` for test suites
- Use `it()` or `test()` for individual tests
- Use descriptive test names: `it('should return user by id')`
- Mock external dependencies (database, Redis)

---

## Environment Variables

### Required .env for Development
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/localmed
REDIS_URL=redis://localhost:6379
JWT_SECRET=localmed-dev-secret
CORS_ORIGIN=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### Production (.env.production)
- All secrets in environment, never commit to repo
- Use different JWT_SECRET per environment
- Configure proper CORS_ORIGIN

---

## Database Migrations

```bash
# Create new migration
npm run db:migrate -- --name add_new_field

# Reset database (development only)
npm run db:migrate -- --reset

# Seed data
npm run db:seed
```
