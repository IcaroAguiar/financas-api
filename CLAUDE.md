# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a personal finance management application with two main components:

- **financas-api**: Node.js/Express backend API with PostgreSQL database using Prisma ORM
- **financas-app**: React Native mobile application built with Expo

## Development Commands

### Backend API (financas-api)

```bash
cd financas-api
npm run dev          # Start development server with nodemon
npm install          # Install dependencies
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes to database
npx prisma migrate dev --name <migration_name>  # Create and apply new migration
npx prisma studio    # Open Prisma Studio (database GUI)
```

### Mobile App (financas-app)

```bash
cd financas-app
npm start            # Start Expo development server
npm run android      # Start on Android device/emulator
npm run ios          # Start on iOS device/simulator
npm run web          # Start web version
npm install          # Install dependencies
```

### Database Setup

```bash
cd financas-api
docker-compose up -d  # Start PostgreSQL database container
```

## Architecture Overview

### Backend Structure

- **Server**: Express.js server in `server.js` with route mounting
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth with bcryptjs for password hashing
- **API Routes**: RESTful endpoints for users, transactions, categories, debtors, and debts
- **Controllers**: Business logic separated into controller files
- **Middleware**: Authentication middleware for protected routes

### Database Schema

Core entities managed by Prisma:

- **User**: Main user entity with email/password authentication
- **Transaction**: Financial transactions (RECEITA/DESPESA) with amounts and categories
- **Category**: User-specific transaction categories with optional colors
- **Debtor**: People who owe money
- **Debt**: Debt records with due dates and total amounts
- **Payment**: Individual payments made towards debts

### Mobile App Structure

- **Navigation**: React Navigation v7 with stack and tab navigators
- **State Management**: React Context for authentication
- **Styling**: Custom styled-components with TypeScript
- **API Integration**: Axios for HTTP requests with centralized configuration
- **Fonts**: Roboto font family loaded via Expo Google Fonts

### Key Features

- User registration and JWT authentication
- Income and expense transaction tracking
- Transaction categorization with custom categories
- Debt management system with payment tracking
- Mobile-first design with React Native

## Database Connection

The API connects to PostgreSQL using the `DATABASE_URL` environment variable. The Docker Compose setup provides a local PostgreSQL instance on port 5432.

## Environment Variables

- **Backend**: Requires `DATABASE_URL`, `PORT`, and `JWT_SECRET` in `.env`
- **Mobile**: Uses react-native-dotenv for environment configuration

## TypeScript Configuration

The mobile app uses TypeScript with:

- Path aliases: `@/*` maps to `src/*`
- Strict mode enabled
- Expo TypeScript base configuration

## Code Style Guidelines

- **Language**: All comments in code should be written in Portuguese (Brazil)
- **Comments**: Use Portuguese for inline comments, function descriptions, and documentation
- **Variable/Function Names**: Keep in English following standard conventions
- **Error Messages**: User-facing messages should be in Portuguese

## Development Workflow Rules

### CRITICAL: Session Management and Git Workflow

**Claude MUST follow these rules for every session:**

1. **📝 Document All Changes**: Always update this CLAUDE.md file with:
   - Session summary with accomplishments and technical changes
   - Key files modified with specific changes
   - Git commit references and deployment status
   - User experience improvements and performance optimizations

2. **💾 End-of-Session Git Workflow**: 
   - **ALWAYS commit and push changes** at the end of each session
   - **Monitor token usage** and initiate commit process when approaching limits
   - Create descriptive commit messages following the established patterns
   - Update Recent Development History section with current session details

3. **⚠️ Token Limit Management**:
   - **Stop all work immediately** when token usage approaches 80% of daily limit
   - **Prioritize documentation update** and git commit process
   - **Ask user for confirmation** before proceeding with git operations
   - **Never leave uncommitted changes** at session end

4. **🔄 Commit Process Protocol**:
   ```bash
   # 1. Check git status and add changes
   git status
   git add .
   
   # 2. Create descriptive commit with session summary
   git commit -m "feat: [Session Summary] - [Key accomplishments]
   
   🤖 Generated with [Claude Code](https://claude.ai/code)
   
   Co-Authored-By: Claude <noreply@anthropic.com>"
   
   # 3. Push to remote repository
   git push origin main
   ```

5. **📋 Session Documentation Template**:
   ```markdown
   ### Session: YYYY-MM-DD - [Session Title]
   
   **Major Accomplishments:**
   - ✅ **Task N**: [Description]
   
   **Technical Changes Made:**
   - [Detailed technical implementation]
   
   **Key Files Modified:**
   - [File paths with specific changes]
   
   **Git Commits:**
   - [Commit hashes and messages]
   
   **Performance/UX Improvements:**
   - [User-facing improvements]
   ```

### CRITICAL: Always Test Before Editing

**Before making ANY changes to the codebase, Claude MUST:**

1. **Start the API server** and verify it's running without errors:

   ```bash
   cd financas-api
   npm run dev
   ```

   - Check that server starts on port 3000
   - Verify database connection is working
   - Ensure no compilation or runtime errors

2. **Start the mobile app** and verify it loads properly:

   ```bash
   cd financas-app
   npm start
   ```

   - Check that Expo dev server starts successfully
   - Verify no TypeScript compilation errors
   - Test that app loads without crashes

3. **Test existing functionality** that will be affected by proposed changes:

   - Navigate through relevant screens
   - Test API calls and data loading
   - Verify authentication flows work
   - Check that existing features function correctly

4. **Only after confirming the app works properly**, proceed with planned changes

### Error Prevention Protocol

- **Never submit code changes** without first verifying the application runs successfully
- **Always test modified functionality** after making changes
- **Run TypeScript compilation** to catch type errors: `npx tsc --noEmit`
- **Check for runtime errors** in both browser console and terminal output
- **Verify API endpoints** are accessible and returning expected data

**Failure to follow this testing protocol will result in broken submissions that frustrate the user.**

## Common Issues and Troubleshooting

### API Connection Issues (Mobile Device)

If the mobile app cannot connect to the API:

1. **Check Docker Database**: Ensure Docker Desktop is running and PostgreSQL container is up

   ```bash
   docker ps  # Should show financas_db_container running
   cd financas-api && docker-compose up -d  # Start database if needed
   ```

2. **Verify Server Binding**: Server must bind to all interfaces, not just localhost

   - Server should listen on `0.0.0.0:3000` not just `localhost:3000`
   - Check `server.js` for `app.listen(PORT, '0.0.0.0', ...)`

3. **CORS Configuration**: Ensure CORS allows the correct Expo ports

   - Default: port 8081
   - Alternative: port 8082 (if 8081 is busy)
   - Update CORS origins in `server.js` to include both ports

4. **Network Connectivity**: Device and development machine must be on same WiFi network

   - API URL in `.env` should use machine's local IP (e.g., `http://192.168.0.24:3000/api`)
   - Test connectivity: `curl http://<machine-ip>:3000/api/users/login`

## Handling INSTRUCTIONS.MD

When an `INSTRUCTIONS.MD` file is present in the root of the project, it should be treated as a set of tasks to be executed. The following workflow should be followed:

1. Read the `INSTRUCTIONS.MD` file to understand the tasks.
2. Execute the tasks one by one, asking for validation from the user after each task is completed.
3. Once all tasks are completed and validated, clear the content of the `INSTRUCTIONS.MD` file, leaving only the structure.

## Recent Development History

### Session: 2025-08-02 - Complete UI/UX Overhaul & Data Integration

**Major Accomplishments:**
- ✅ **Task 1**: Fixed ProfileScreen button rendering bug with CustomButton layout improvements
- ✅ **Task 2**: Implemented responsive design optimizations for smaller iPhone screens
- ✅ **Task 3**: Integrated live data from DebtorContext into HomeScreen dashboard
- ✅ **Task 4**: Standardized UI across all screens with consistent GlobalHeader navigation
- ✅ **Task 5**: Enhanced contact actions (WhatsApp/Email) in DebtorsScreen

**Technical Changes Made:**

1. **Module Optimization**: 
   - Replaced `@tabler/icons-react-native` with `react-native-feather` for better performance
   - Reduced module count from 7000+ to optimize Expo Go loading times
   - Moved `expo-dev-client` to devDependencies

2. **Component Architecture**:
   - Created `GlobalHeader` component with AscendLogo and centered titles
   - Built reusable `QuickActionCard` and `DashboardCard` components
   - Enhanced `CustomButton` with proper variant system and responsive sizing
   - Implemented comprehensive `Icon` component using Feather icons

3. **Responsive Design**:
   - Reduced horizontal padding from `theme.spacing.sides` (16px) to `theme.spacing.md` (12px)
   - Optimized font sizes: balanceAmount (32px→28px), summaryValue (16px→14px)
   - Added `flexShrink: 1` to text elements for better text wrapping
   - Enhanced button dimensions for modern, taller appearance

4. **Context Integration**:
   - Added `TransactionProvider`, `CategoryProvider`, and `DebtorProvider` to App.tsx
   - Replaced mocked debt data with live `useDebtors` context in HomeScreen
   - Implemented real-time calculation of pending debts and debtor counts
   - Enhanced pull-to-refresh functionality for both transactions and debtor data

5. **Navigation Standardization**:
   - Updated `AppNavigator.tsx` to use GlobalHeader for all tab screens
   - Removed hardcoded screen titles from TransactionsScreen, RemindersScreen, and DebtorsScreen
   - Ensured consistent header experience across all screens

**Key Files Modified:**
- `src/components/GlobalHeader/` - New centralized header component
- `src/components/Icon/index.tsx` - Feather icons integration
- `src/components/CustomButton/` - Enhanced button variants and sizing
- `src/screens/HomeScreen/index.tsx` - Live data integration
- `src/screens/ProfileScreen/` - Button rendering fixes and responsive design
- `src/navigation/AppNavigator.tsx` - Standardized header management
- `package.json` - Module optimization and dependency updates

**Git Commits:**
- **Mobile App**: `d7844f7` - "feat: Complete UI/UX overhaul with responsive design and live data integration"
- **API**: `a84a340` - "feat: Enhanced transaction management and database schema improvements"

**Performance Improvements:**
- Reduced bundle size through icon library optimization
- Improved responsive layout for various screen sizes
- Enhanced loading states and error handling
- Optimized component re-renders with proper context usage

**User Experience Enhancements:**
- Modern, consistent navigation with branded headers
- Better button interactions with proper visual feedback
- Responsive design that adapts to different iPhone screen sizes
- Real-time data updates with live dashboard integration
- Streamlined contact actions for debt management

This session successfully transformed the application from a basic functional state to a polished, production-ready mobile finance management app with modern UI patterns and comprehensive responsive design.

### Session: 2025-08-05 - Complete Payment Plan System & CI/CD Pipeline

**Major Accomplishments:**
- ✅ **Payment Plan Backend**: Comprehensive Brazilian-style payment plan (parcelamento) system
- ✅ **API Integration**: Connected mobile app to real backend payment functionality
- ✅ **Data Flow**: Replaced all mock data with real API integration
- ✅ **CI/CD Pipeline**: Complete GitHub Actions deployment automation
- ✅ **Production Ready**: Both backend and mobile app ready for production deployment

**Technical Implementation:**

1. **Backend Payment Plan System**:
   - Extended Transaction model with installment plan fields (isInstallmentPlan, installmentCount, installmentFrequency)
   - Added TransactionInstallment model for individual installment tracking
   - Created comprehensive API endpoints for payment management
   - Applied database migration for transaction installments support
   - Implemented automatic installment generation with MONTHLY/WEEKLY frequencies

2. **Mobile App API Integration**:
   - Updated transactionService with payment plan API functions
   - Enhanced Transaction types with installment fields and interfaces
   - Connected TransactionContext to real backend payment functions
   - Updated all screens to use real data instead of mock implementations
   - Implemented proper error handling with toast notifications

3. **CI/CD Infrastructure**:
   - Created GitHub Actions workflows for both backend and mobile app
   - Backend: PostgreSQL testing, health checks, Render deployment
   - Mobile: TypeScript checking, EAS build automation
   - Environment configuration for production deployments
   - Comprehensive testing and notification systems

**Key Features Completed:**
- **Payment Plan Creation**: Full Brazilian parcelamento with 2-48 installments
- **Individual Installment Tracking**: Mark individual installments as paid
- **Partial Payment System**: Apply payments to earliest pending installments
- **Full Payment Functionality**: Mark entire transactions/debts as paid
- **Progress Indicators**: Real-time payment completion tracking
- **Automated Deployment**: CI/CD pipeline with testing and deployment

**API Endpoints Added:**
- `POST /api/transactions` - Enhanced with payment plan support
- `PUT /api/transactions/:transactionId/installments/:installmentId/pay` - Mark installment paid
- `PUT /api/transactions/:transactionId/pay` - Mark transaction fully paid
- `POST /api/transactions/:transactionId/partial-payment` - Register partial payment
- `GET /api/health` - Health check for deployment monitoring

**Git Commits:**
- **Backend**: `51a1a9b` - Payment plan system implementation
- **Backend**: `9aac1ae` - GitHub Actions CI/CD and health endpoint
- **Backend**: `6be2455` - Dedicated deployment workflow
- **Mobile**: `4976a5b` - Backend API integration
- **Mobile**: `1e75aed` - CI/CD pipeline support
- **Mobile**: `ce43013` - Mobile build workflow

**Production Deployment Status:**
- **Backend API**: ✅ Live at https://ascend-api-qezc.onrender.com/api
- **Database**: ✅ PostgreSQL with all migrations applied
- **Mobile App**: ✅ EAS build configuration ready
- **CI/CD**: ✅ Automated deployment pipelines configured

This session completed the transformation of the finance app into a production-ready system with comprehensive payment plan functionality, real backend integration, and automated deployment infrastructure. The application now supports the complete Brazilian payment workflow with professional-grade reliability and user experience.

### Session: 2025-08-02 - Partial Debt Payments Feature Implementation

**Major Accomplishments:**
- ✅ **Task 1**: Updated database schema with new Payment model supporting partial payments
- ✅ **Task 2**: Created comprehensive API endpoints for payment management
- ✅ **Task 3**: Implemented calculated fields for debt status and remaining amounts
- ✅ **Task 4**: Built DebtDetailsScreen with payment history and empty states
- ✅ **Task 5**: Developed RegisterPaymentModal with full API integration

**Technical Implementation:**

1. **Database Schema Enhancement**:
   - Added `Payment` model with id, amount, paymentDate, notes, and debt relationship
   - Established one-to-many relationship between Debt and Payment
   - Applied Prisma migration: `npx prisma migrate dev --name add-payment-model`

2. **Backend API Development**:
   - Created `paymentController.js` with validation and business logic
   - Added payment routes: `POST /api/debts/:debtId/payments`, `GET /api/debts/:debtId/payments`
   - Enhanced debt controller with calculated fields helper function
   - Implemented automatic calculation of paidAmount, remainingAmount, and status

3. **Frontend Component Architecture**:
   - Built `DebtDetailsScreen` with comprehensive debt information display
   - Created `RegisterPaymentModal` with form validation and currency formatting
   - Integrated DateTimePicker for optional payment date selection
   - Added proper TypeScript interfaces for Payment data structures

4. **API Integration**:
   - Updated `debtorService.ts` with payment-related API functions
   - Connected RegisterPaymentModal to live backend endpoints
   - Implemented proper error handling and loading states
   - Added real-time data refresh after payment creation

**Key Features Implemented:**
- **Partial Payment Tracking**: Users can register multiple payments per debt
- **Payment History**: Complete timeline of all payments with amounts and dates
- **Automatic Calculations**: Real-time updates of paid amounts and debt status
- **Form Validation**: Currency input with Brazilian Real formatting
- **Empty States**: User-friendly messages when no payments exist
- **Notes Support**: Optional notes field for payment context

**Key Files Modified:**
- `financas-api/prisma/schema.prisma` - Payment model addition
- `financas-api/src/controllers/paymentController.js` - Payment business logic
- `financas-api/src/routes/debtRoutes.js` - Payment endpoint integration
- `financas-api/src/controllers/debtController.js` - Calculated fields implementation
- `financas-app/src/screens/DebtDetailsScreen/` - Debt details with payment history
- `financas-app/src/components/RegisterPaymentModal/` - Payment registration modal
- `financas-app/src/api/debtorService.ts` - Payment API service functions

**User Experience Enhancements:**
- Intuitive payment registration with required amount and optional date/notes
- Real-time debt status updates showing PENDENTE/PAGA automatically
- Currency formatting with proper Brazilian Real (R$) display
- Comprehensive payment history with timestamps and notes
- Overpayment warnings with user confirmation dialogs
- Pull-to-refresh functionality for live data updates

**Database Migration Applied:**
```sql
-- CreateTable Payment
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "debtId" TEXT NOT NULL,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
```

This session completed a comprehensive debt payment tracking system, enabling users to manage partial payments with full history tracking and automatic debt status calculations.

### Session: 2025-08-05 - Complete Keyboard & UI System Overhaul + Android Icon Fix

**Major Accomplishments:**
- ✅ **Keyboard Bug Fix**: Resolved keyboard interaction issues in AddDebtorModal
- ✅ **Universal KeyboardAwareScrollView**: Applied consistent keyboard handling across all modals
- ✅ **Alert System Modernization**: Replaced all Alert.alert with ConfirmationModal and toast notifications
- ✅ **Android Icon Quality Fix**: Resolved low-quality app icon issues for Android devices
- ✅ **Production API Integration**: Successfully configured app to use production API for testing

**Technical Changes Made:**

1. **Keyboard System Overhaul**:
   - Replaced `KeyboardAvoidingView` + `ScrollView` with `KeyboardAwareScrollView` across all modals
   - Applied consistent configuration: `enableOnAndroid={true}`, `extraHeight={120}`, `extraScrollHeight={120}`
   - Updated modals: AddDebtorModal, RegisterPaymentModal, AddReminderModal, AddSubscriptionModal, AddEditAccountModal
   - Enhanced `keyboardShouldPersistTaps="handled"` for better interaction

2. **Alert System Modernization**:
   - **AddDebtorModal**: Replaced all validation and feedback alerts with `toast.error()` and `toast.success()`
   - **RegisterPaymentModal**: Converted overpayment confirmations to `showConfirmation()` with proper dialog
   - **AddReminderModal**: Updated all form validation to use toast notifications
   - Added proper imports: `useConfirmation` and `useToast` hooks

3. **Android Icon Resolution**:
   - Fixed main icon path: `icon-72x72.png` (72x72px) → `icon.png` (1024x1024px)
   - Updated Android adaptive icon configuration with high-resolution foreground
   - Generated native Android assets with proper DPI variants (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
   - Configured WebP optimization for smaller app size

4. **Production Environment Setup**:
   - Updated mobile app `.env` to use production API: `https://ascend-api-qezc.onrender.com/api`
   - Verified production API connectivity and functionality
   - Enabled seamless testing with live backend data

**Key Files Modified:**
- `financas-app/src/components/AddDebtorModal/index.tsx` - KeyboardAwareScrollView + Alert removal
- `financas-app/src/components/RegisterPaymentModal/index.tsx` - Keyboard handling + ConfirmationModal integration
- `financas-app/src/components/AddReminderModal/index.tsx` - Complete keyboard and alert modernization
- `financas-app/src/components/AddSubscriptionModal/index.tsx` - KeyboardAwareScrollView implementation
- `financas-app/src/components/AddEditAccountModal/index.tsx` - Keyboard handling upgrade
- `financas-app/app.json` - Android icon configuration fixes
- `financas-app/.env` - Production API configuration
- `CLAUDE.md` - Added session management and git workflow rules

**Performance/UX Improvements:**
- **Smooth Keyboard Interactions**: Eliminated modal layout bugs when keyboard opens/closes
- **Modern User Feedback**: Non-intrusive toast notifications instead of blocking Alert dialogs
- **Professional Confirmation Dialogs**: Contextual confirmation modals for critical actions
- **Crystal Clear App Icons**: Sharp, high-resolution icons on all Android devices and screen densities
- **Consistent Experience**: Unified keyboard behavior across all form modals
- **Production-Ready Testing**: Seamless testing with live backend integration

**Technical Debt Resolved:**
- Eliminated inconsistent keyboard handling patterns across modals
- Removed all legacy Alert.alert usage for modern UX patterns
- Fixed Android icon quality issues that affected app store presentation
- Standardized modal interaction patterns throughout the application

This session transformed the mobile app's user interaction layer, delivering professional-grade keyboard handling, modern feedback systems, and production-quality visual assets. The application now provides a consistent, polished user experience across all interaction patterns.
