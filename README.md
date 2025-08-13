# Construction Van Web

A modern website for planning construction in Metro Vancouver with integrated analysis capabilities.

## Quick Start

1. **Clone the repository**
2. **Set up environment**: Copy `env.template` to `.env` and configure PostgreSQL credentials
3. **Start the application**: `docker-compose up -d`
4. **Access the app**: Open http://localhost:3000

## Detailed Setup

For complete setup instructions, see [SETUP.md](SETUP.md)

## Architecture

- **Frontend**: Next.js (Port 3000)
- **Spring Boot Backend**: User management, API keys (Port 8080)
- **Flask Backend**: Seismic calculations (Port 5001)
- **Database**: PostgreSQL (Port 5432)

## Features

- User authentication and registration
- Secure API key storage
- Seismic hazard analysis
- Soil classification
- Snow and wind load calculations
- Modern responsive UI
- More on the way

## Troubleshooting

See [SETUP.md](SETUP.md) for development workflow and troubleshooting.