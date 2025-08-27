# Construction Van Web

A modern web application for construction engineering analysis in Metro Vancouver with integrated workspace management and calculation tools.

## Project Overview

This application provides a comprehensive platform for construction engineering analysis with a focus on seismic hazard assessment, soil classification, and load calculations. Built with modern web technologies, it features a sophisticated workspace management system that allows users to organize projects, pages, and tabs in a hierarchical structure.

### Key Features
- **Dark Mode Support**: Full theme-aware interface with automatic system preference detection and manual toggle
- **Modern UI Components**: Built with shadcn/ui component library for consistent, accessible, and beautiful interfaces
- **Real-time Workspace Management**: Drag-and-drop functionality for organizing projects and tabs
- **Professional Engineering Tools**: Seismic analysis, soil classification, snow and wind load calculations

## Quick Start

1. **Clone the repository**
2. **Set up environment**: Copy `env.template` to `.env` and configure PostgreSQL credentials
3. **Start the application**: `docker-compose up -d`
4. **Access the app**: Open http://localhost:3000

## Detailed Setup

For complete setup instructions, see [SETUP.md](SETUP.md)

## Technology Stack

### Frontend
- **Next.js 15** with React 19 and App Router
- **Tailwind CSS v3.4.17** for utility-first styling
- **shadcn/ui** component library for modern, accessible UI components
- **next-themes** for dark/light mode theme management
- **Radix UI primitives** for accessible component foundations
- **Sonner** for elegant toast notifications
- **Lucide React** for consistent iconography

### Backend
- **Spring Boot**: User management, workspace data, API keys (Port 8080)
- **Flask**: Seismic calculations with GIS integration (Port 5001)
- **PostgreSQL**: Database with modern UUID generation (Port 5432)

## Architecture

- **Frontend**: Next.js with React (Port 3000)
- **Spring Boot Backend**: User management, workspace data, API keys (Port 8080)
- **Flask Backend**: Seismic calculations with GIS integration (Port 5001)
- **Database**: PostgreSQL with modern UUID generation (Port 5432)

## Features

- **User authentication and registration**: Secure login system with JWT sessions
- **Secure API key storage**: Encrypted storage with password protection
- **Seismic hazard analysis**: Real-time seismic hazard lookup with GIS integration
- **Soil classification**: Automatic site class determination with visual feedback
- **Snow and wind load calculations**: Calculators for various roof types and building configurations
- **Workspace management**: Organize projects, pages, tabs with hierarchical structure and data persistence
- **Modern responsive UI**: Clean shadcn/ui styling interface for desktop, tablet, and mobile

## Troubleshooting

See [SETUP.md](SETUP.md) for development workflow and troubleshooting.