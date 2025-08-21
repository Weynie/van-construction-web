# Construction Van Web

A modern web application for construction engineering analysis in Metro Vancouver with integrated workspace management and calculation tools.

## Quick Start

1. **Clone the repository**
2. **Set up environment**: Copy `env.template` to `.env` and configure PostgreSQL credentials
3. **Start the application**: `docker-compose up -d`
4. **Access the app**: Open http://localhost:3000

## Detailed Setup

For complete setup instructions, see [SETUP.md](SETUP.md)

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
- **Modern responsive UI**: Clean interface for desktop, tablet, and mobile

## Troubleshooting

See [SETUP.md](SETUP.md) for development workflow and troubleshooting.