# LocalMed - Hyperlocal Medicine Availability Platform

A comprehensive platform connecting users with nearby pharmacies for medicine search, reservation, and pickup.

## Project Structure

```
localmed/
├── apps/
│   ├── web/           # Next.js web application
│   ├── mobile/        # React Native (Expo) mobile app
│   └── dashboard/     # Pharmacy dashboard
├── packages/
│   ├── ui/             # Shared UI components
│   ├── core/           # Core types and utilities
│   ├── api-client/     # API client library
│   └── auth/           # Authentication module
├── services/
│   └── api/            # Express.js backend API
└── docker-compose.yml  # Local development environment
```

## Tech Stack (March 2026)

| Component | Technology | Version |
|-----------|------------|---------|
| Mobile | React Native (Expo) | SDK 52 |
| Web | Next.js | 15 |
| Backend | Node.js + Express | 22 |
| Database | PostgreSQL | 18 |
| Cache | Redis | 8 |
| Package Manager | npm | 11 |
| Build Tool | Turborepo | 2.5 |

## Getting Started

### Prerequisites

- Node.js 22+
- npm 11+
- Docker & Docker Compose
- PostgreSQL 18 (optional, can use Docker)

### Installation

```bash
# Install dependencies
npm install

# Start development services (PostgreSQL, Redis)
docker-compose up -d

# Generate Prisma client
cd services/api && npm run db:generate

# Push schema to database
cd services/api && npm run db:push
```

### Development

```bash
# Run all apps
npm run dev

# Run specific app
npm run dev --filter=@localmed/web
npm run dev --filter=@localmed/api
npm run dev --filter=@localmed/mobile
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register with phone
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/refresh-token` - Refresh token

### Medicines
- `GET /api/v1/medicines/search` - Search medicines
- `GET /api/v1/medicines/suggestions` - Get suggestions

### Pharmacies
- `GET /api/v1/pharmacies` - List nearby pharmacies
- `GET /api/v1/pharmacies/:id` - Get pharmacy details
- `GET /api/v1/pharmacies/:id/medicines` - Get medicines at pharmacy
- `GET /api/v1/pharmacies/:id/stock` - Get stock for medicine

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/orders/:id` - Get order details
- `PUT /api/v1/orders/:id/cancel` - Cancel order

## Development Phases

See `../plan/10-development-phases.md` for detailed development timeline.

- **Phase 1 (Weeks 1-6)**: Foundation - Auth, Search, Pharmacy Discovery, Orders
- **Phase 2 (Weeks 7-12)**: Core Features - Dashboard, Prescription Scanner, Notifications
- **Phase 3 (Weeks 13-26)**: Launch & Iterate - Beta, Soft Launch, Full Launch

## License

MIT
