# Sistema de Vivero Automatizado

## Overview

This is a full-stack greenhouse automation system built with a modern tech stack. The application provides real-time monitoring and control of greenhouse environmental conditions including temperature, humidity, lighting, and irrigation systems. It features a React frontend with TypeScript, an Express.js backend, PostgreSQL database with Drizzle ORM, and real-time WebSocket communication.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Components**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom greenhouse-themed color palette
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter (lightweight routing library)
- **Real-time Updates**: WebSocket client for live data streaming
- **Charts**: Recharts for environmental data visualization
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **WebSocket Server**: ws library for real-time communication
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: express-session with PostgreSQL store
- **Development**: tsx for TypeScript execution

### Database Schema
The system uses PostgreSQL with the following main tables:
- `sensor_data`: Stores temperature, humidity, light level, and soil moisture readings
- `system_controls`: Tracks irrigation, ventilation, lighting, and heating system states
- `irrigation_schedules`: Manages automated and manual irrigation schedules
- `system_alerts`: Handles system notifications and warnings
- `system_activity`: Logs all system actions and events

## Key Components

### Real-time Data Flow
1. **Sensor Data Collection**: Backend receives sensor readings and stores them in PostgreSQL
2. **WebSocket Broadcasting**: New data is broadcast to all connected clients
3. **Frontend Updates**: React components automatically update via WebSocket messages
4. **Query Invalidation**: TanStack Query cache is updated for consistent state

### Control Systems
- **Irrigation System**: Manual and scheduled watering with duration control
- **Climate Control**: Temperature and humidity management through heating/cooling
- **Lighting System**: Automated light level control
- **Ventilation**: Air circulation management

### User Interface Features
- **Dashboard**: Real-time metrics display with trend indicators
- **Environment Charts**: Historical data visualization with configurable time ranges
- **Control Panel**: Manual override switches for all systems
- **Alert System**: Color-coded notifications with dismissal functionality
- **Activity Log**: Chronological system event tracking
- **Responsive Design**: Mobile-optimized interface

## Data Flow

1. **Data Collection**: Sensor readings are posted to `/api/sensor-data`
2. **Storage**: Data is persisted to PostgreSQL via Drizzle ORM
3. **Real-time Broadcasting**: WebSocket server broadcasts updates to connected clients
4. **Client Updates**: React components receive updates and refresh UI
5. **Control Actions**: User interactions trigger API calls to control endpoints
6. **System Responses**: Backend processes control commands and updates system state

## External Dependencies

### Core Framework Dependencies
- React ecosystem: `react`, `react-dom`, `@types/react`
- Express.js: `express`, `@types/express`
- TypeScript: `typescript`, `tsx`

### Database & ORM
- `drizzle-orm`: Modern TypeScript ORM
- `@neondatabase/serverless`: Neon PostgreSQL driver
- `drizzle-kit`: Database migrations and management

### UI & Styling
- `tailwindcss`: Utility-first CSS framework
- `@radix-ui/*`: Accessible component primitives
- `lucide-react`: Icon library
- `recharts`: Chart visualization library

### State Management & Networking
- `@tanstack/react-query`: Server state management
- `ws`: WebSocket implementation
- `wouter`: Lightweight routing

### Development Tools
- `vite`: Build tool and dev server
- `@replit/vite-plugin-*`: Replit-specific development plugins

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Development Server**: Vite dev server with HMR
- **WebSocket**: Development WebSocket server on same port

### Production Build
- **Frontend Build**: Vite builds optimized static assets
- **Backend Build**: esbuild bundles server code for Node.js
- **Asset Serving**: Express serves static files in production
- **Database**: Neon serverless PostgreSQL for scalability

### Environment Configuration
- `NODE_ENV=development`: Development mode with debugging
- `NODE_ENV=production`: Production optimizations
- `DATABASE_URL`: PostgreSQL connection string
- Port configuration: 5000 (development), 80 (production)

## Changelog

Changelog:
- June 19, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.