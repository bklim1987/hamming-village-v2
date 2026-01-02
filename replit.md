# Hamming Village Interactive Demo

## Overview

Hamming Village is an interactive educational web application that teaches users about Hamming codes through a village metaphor. The application uses a step-by-step walkthrough to explain error detection and correction concepts, featuring "guardian angels" (parity bits) and "residents" (data bits) in a village setting. The demo visualizes binary representations and bit manipulation through an engaging, gamified interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5 for fast development and optimized production builds
- **Styling**: Tailwind CSS for utility-first styling with PostCSS and Autoprefixer
- **Icons**: Lucide React for consistent iconography

### Application Structure
- **Single Page Application**: The app is a single-component React application (`App.tsx`) managing all state and UI
- **State Management**: Uses React's built-in `useState` and `useEffect` hooks for local state management
- **Multi-step Flow**: The application guides users through numbered steps (step 1, 2, 3, 4) explaining Hamming code concepts progressively

### Data Model
- **Houses Array**: Represents positions in the Hamming code with properties:
  - `id`: Position number
  - `type`: Either 'angel' (parity bit) or 'resident' (data bit)
  - `binary`: 3-bit binary representation
  - `desc`: Human-readable description
- **Resident Houses**: Contains magic card lists for the binary number guessing game functionality

### Code Quality
- **TypeScript**: Strict type checking enabled for type safety
- **ESLint**: Configured with React Hooks and React Refresh plugins
- **Linting Rules**: Enforces no unused locals/parameters and proper React patterns

### Path Aliases
- `@assets`: Resolves to `attached_assets` directory for asset imports

## External Dependencies

### Frontend Libraries
- **@supabase/supabase-js**: Supabase client library (included but usage not visible in provided code - likely for future backend integration)
- **lucide-react**: Icon library for UI icons
- **react/react-dom**: Core React libraries

### Development Tools
- **Vite**: Development server runs on port 5000, configured for external access (host: 0.0.0.0)
- **TypeScript**: Separate configs for app code and Node.js tooling
- **Tailwind CSS**: Scans `index.html` and `src/**/*.{js,ts,jsx,tsx}` for class usage

### Potential Future Integrations
- Supabase is included as a dependency, suggesting planned backend functionality for data persistence or user authentication