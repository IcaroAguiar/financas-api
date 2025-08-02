# CLAUDE.md - Financas API Backend

This file provides guidance to Claude Code when working with the backend API component of the personal finance management application.

## Project Overview

**Financas API** is the Node.js/Express backend that provides RESTful API endpoints for the React Native mobile application. It uses PostgreSQL with Prisma ORM for data persistence and JWT for authentication.

## Quick Start

### Prerequisites
- Node.js (v16+)
- Docker Desktop (for PostgreSQL database)
- npm or yarn package manager

### Development Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL database
docker-compose up -d

# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Start development server
npm run dev
```

## Directory Structure

```
financas-api/
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   └── migrations/        # Database migration files
├── src/
│   ├── controllers/       # Business logic controllers
│   ├── middleware/        # Express middleware (auth, validation)
│   ├── routes/           # API route definitions
│   └── utils/            # Utility functions
├── server.js             # Main Express server entry point
├── docker-compose.yml    # PostgreSQL container setup
└── package.json          # Dependencies and scripts
```

## Key Technologies

- **Express.js**: Web framework
- **Prisma**: ORM and database toolkit
- **PostgreSQL**: Primary database
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **CORS**: Cross-origin resource sharing
- **Docker**: Database containerization

## Database Schema

### Core Entities

- **User**: Authentication and user management
- **Transaction**: Income/expense records with categories
- **Category**: User-defined transaction categories
- **Debtor**: People who owe money
- **Debt**: Debt records with due dates
- **Payment**: Individual debt payments

### Relationships

- User → Transactions (1:N)
- User → Categories (1:N)
- User → Debtors (1:N)
- Debtor → Debts (1:N)
- Debt → Payments (1:N)
- Transaction → Category (N:1)

## API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile (protected)

### Transactions
- `GET /api/transactions` - List user transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Categories
- `GET /api/categories` - List user categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Debtors & Debts
- `GET /api/debtors` - List debtors
- `POST /api/debtors` - Create debtor
- `GET /api/debts` - List debts
- `POST /api/debts` - Create debt
- `POST /api/payments` - Record payment

## Development Commands

```bash
npm run dev              # Start development server with nodemon
npm start               # Start production server
npm install            # Install dependencies
npx prisma generate    # Generate Prisma client after schema changes
npx prisma db push     # Push schema changes to database
npx prisma migrate dev --name <name>  # Create and apply migration
npx prisma studio      # Open database GUI
```

## Environment Variables

Create `.env` file with:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/financas"
JWT_SECRET="your-jwt-secret-key"
PORT=3000
NODE_ENV=development
```

## Authentication Flow

1. User registers/logs in with email/password
2. Server validates credentials and returns JWT token
3. Client includes token in Authorization header: `Bearer <token>`
4. Protected routes verify token using authentication middleware

## Database Operations

### Migrations
```bash
# Create new migration
npx prisma migrate dev --name add_new_feature

# Reset database (development only)
npx prisma migrate reset

# Deploy migrations (production)
npx prisma migrate deploy
```

### Schema Updates
```bash
# After modifying schema.prisma
npx prisma generate    # Update Prisma client
npx prisma db push     # Push changes to database
```

## Error Handling

- Global error handling middleware catches unhandled errors
- Validation errors return 400 with descriptive messages
- Authentication errors return 401
- Authorization errors return 403
- Resource not found returns 404
- Server errors return 500

## Security Features

- Password hashing with bcryptjs
- JWT token expiration
- CORS configuration for mobile app
- Input validation and sanitization
- Protected routes with authentication middleware

## Testing

```bash
# Run tests (if implemented)
npm test

# Run with coverage
npm run test:coverage
```

## Deployment Considerations

- Set `NODE_ENV=production`
- Use environment variables for sensitive data
- Configure proper CORS origins
- Set up SSL/TLS certificates
- Use process manager (PM2) for production
- Configure database connection pooling

## Related Project

This API serves the **financas-app** React Native mobile application located in `../financas-app/`. The mobile app consumes these API endpoints for all data operations.

---

## Claude Code Pro Plan - Token Conservation Tips

To maximize your Claude Code Pro plan usage and conserve daily tokens:

### 🎯 Efficient File Operations

- **Use Glob tool first** to locate files before reading: `**/*.js`, `src/**/*.ts`
- **Read specific files** instead of browsing directories aimlessly
- **Use Grep tool** to search for specific code patterns instead of reading entire files
- **Batch tool calls** when possible - call multiple tools in one message

### 🔍 Smart Code Navigation

- **Search before editing**: Use `Grep` to find exact functions/variables
- **Target specific areas**: Read only relevant sections with `offset` and `limit`
- **Use patterns**: Search for `"function methodName"` or `"class ClassName"`

### 💡 Context-Aware Development

- **Read existing code patterns** before implementing new features
- **Check imports and dependencies** to understand project structure
- **Review similar components** to maintain consistency
- **Understand project conventions** from existing code

### 🚀 Productive Workflows

- **Plan with TodoWrite** to avoid backtracking and forgotten tasks
- **Test incrementally** rather than making large changes
- **Use TypeScript checks**: `npx tsc --noEmit` to catch errors early
- **Leverage existing utilities** instead of recreating functionality

### 🛠️ Backend-Specific Efficiency

- **Check Prisma schema first** before making database changes
- **Use `npx prisma studio`** to inspect data instead of writing queries
- **Test API endpoints** with curl/Postman before debugging
- **Check Docker containers**: `docker ps` before troubleshooting database

### 📱 API Development Best Practices

- **Validate endpoints** with tools before writing extensive logic
- **Use middleware patterns** already established in the project
- **Check authentication flow** before adding protected routes
- **Review error handling** patterns in existing controllers

### ⚡ Quick Debugging

- **Check server logs** for immediate error feedback
- **Use Prisma Studio** for database state inspection
- **Test with simple curl commands** before complex implementations
- **Verify CORS settings** when mobile app can't connect

Remember: Being methodical and using the right tools saves tokens and delivers better results faster.