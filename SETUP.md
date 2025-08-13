# Construction Van Web - Setup Guide

This guide will help you reproduce and start the Construction Van Web project from scratch.

## Prerequisites

### Required Software
- **Docker Desktop** (with Docker Compose)
- **Git** (to clone the repository)
- **Node.js** (optional, for local development)

### Required API Keys
- **OpenCage Data API Key** - For geocoding services
  - Get it from: https://opencagedata.com/

## Step-by-Step Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd construction_van_web
```

### 2. Environment Configuration
```bash
# Copy the environment template
cp env.template .env

# Edit .env file with your PostgreSQL credentials
# Replace the placeholder values:
POSTGRES_DB=construction_van_db
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_secure_password
```

### 3. Database Schema Setup
**No manual database setup required!** The application uses:
- **Hibernate DDL Auto**: `spring.jpa.hibernate.ddl-auto=update`
- **Automatic Schema Creation**: Tables are created automatically on first run
- **JPA Entities**: All database tables are defined in the Java models

### 4. Required Database Tables (Auto-Created)
The following tables will be automatically created:

| Table Name | Purpose | Auto-Created |
|------------|---------|--------------|
| `registers` | User accounts | ✅ Yes |
| `user_preferences` | Encrypted API keys | ✅ Yes |
| `sediment_types` | Soil classification data | ✅ Yes |
| `snow_load_values` | Snow load data by city | ✅ Yes |
| `wind_load_values` | Wind load data by city | ✅ Yes |

### 5. Start the Application
```bash
# Start all services (PostgreSQL, Spring Boot, Flask, Next.js)
docker-compose up -d

# Check if all services are running
docker-compose ps
```

### 6. Verify Services
```bash
# Check service health
docker-compose logs postgres
docker-compose logs backend
docker-compose logs flask-backend
docker-compose logs frontend
```

### 7. Access the Application
- **Frontend**: http://localhost:3000
- **Spring Boot API**: http://localhost:8080
- **Flask API**: http://localhost:5001
- **PostgreSQL**: localhost:5432

## Service Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │ Spring Boot │    │ Flask API   │
│  (Next.js)  │◄──►│   Backend   │    │ (Seismic)   │
│ Port: 3000  │    │ Port: 8080  │    │ Port: 5001  │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ PostgreSQL  │
                   │ Port: 5432  │
                   └─────────────┘
```

## API Endpoints

### Spring Boot Backend (Port 8080)
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/users/{id}/profile` - User profile
- `POST /api/api-keys/store` - Store API keys
- `GET /api/sediment-types` - Get sediment types
- `GET /api/snow-load-values` - Get snow load data
- `GET /api/wind-load-values` - Get wind load data

### Flask Backend (Port 5001)
- `GET /health` - Health check
- `POST /api/seismic-info` - Seismic calculations

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the ports
netstat -ano | findstr :3000
netstat -ano | findstr :8080
netstat -ano | findstr :5001
netstat -ano | findstr :5432

# Stop conflicting services or change ports in docker-compose.yml
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

#### 3. Spring-boot Backend Issues
```bash
# Check logs
docker-compose logs backend

# Rebuild container
docker-compose build backend
docker-compose up backend -d

# Rebuild and restart container in one command
docker-compose up -d --build backend
```


## Development Workflow

### Local Development
```bash
# Start only database
docker-compose up postgres -d

# Run Spring Boot locally
cd backend
./mvnw spring-boot:run

# Run Flask locally
cd pys
pip install -r requirements.txt
python seismic_api.py

# Run Next.js locally
cd next
npm install
npm run dev
```

### Production Deployment
```bash
# Build and start all services
docker-compose up -d --build

# Monitor logs
docker-compose logs -f
```


## Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Change default passwords** - Update PostgreSQL password in production
3. **Use HTTPS in production** - Configure SSL certificates
4. **API Key Security** - Store API keys securely using the built-in encryption under user consent
