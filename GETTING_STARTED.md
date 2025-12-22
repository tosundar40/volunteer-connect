# 🚀 Getting Started with Volunteer Connect

Welcome to Volunteer Connect! This guide will help you set up the platform locally for development or testing. Choose your preferred setup method and get started in minutes.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js** 18.0.0 or higher ([Download here](https://nodejs.org/))
- **PostgreSQL** 14.0 or higher ([Download here](https://postgresql.org/download/))
- **Git** for version control ([Download here](https://git-scm.com/))
- **npm** or **yarn** package manager (comes with Node.js)

### Optional (for Docker setup)
- **Docker** 20.10+ ([Download here](https://docker.com/get-started))
- **Docker Compose** 2.0+ (included with Docker Desktop)

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 2GB free space for dependencies and database
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

## ⚡ Quick Start Options

### Option 1: Docker Setup (Recommended for Beginners)

This is the fastest way to get the entire platform running with zero configuration:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/volunteer-connect.git
cd volunteer-connect

# 2. Start all services with Docker
docker-compose up -d

# 3. Wait for services to initialize (about 30-60 seconds)
docker-compose logs -f

# 4. Access the platform
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
# Database: localhost:5432
```

**That's it!** The platform will be running with sample data. Skip to the [First Steps](#-first-steps) section.

### Option 2: Manual Setup (For Developers)

For developers who want full control over the environment:

#### Step 1: Clone and Setup Repository
```bash
# Clone the repository
git clone https://github.com/yourusername/volunteer-connect.git
cd volunteer-connect
```

#### Step 2: Database Setup
```bash
# Start PostgreSQL service (varies by OS)
# Windows (if PostgreSQL is installed as service):
net start postgresql-x64-14

# macOS (with Homebrew):
brew services start postgresql

# Linux (Ubuntu/Debian):
sudo systemctl start postgresql

# Create database
createdb volunteering_platform
# OR using psql:
psql -U postgres -c "CREATE DATABASE volunteering_platform;"
```

#### Step 3: Backend Configuration
```bash
# Navigate to backend directory
cd backend

# Install dependencies (this may take a few minutes)
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your settings (see Configuration section below)
# Windows: notepad .env
# macOS/Linux: nano .env
```

**Required Environment Variables:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=volunteering_platform
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Application Security
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
JWT_EXPIRE=7d

# Email Configuration (optional for development)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

#### Step 4: Database Migration
```bash
# Run database migrations to create tables
npm run migrate

# Optional: Seed with sample data
npm run seed

# Verify migration success
npm run migrate:status
```

#### Step 5: Start Backend Server
```bash
# Start development server with auto-restart
npm run dev

# You should see:
# ✅ Database connected successfully
# 🚀 Server running on http://localhost:5000
# 📡 Socket.IO server initialized
```

#### Step 6: Frontend Setup (New Terminal)
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit frontend environment variables
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000

# Start frontend development server  
npm run dev

# You should see:
# ✅ Frontend running at http://localhost:5173
# 🌐 Network access available at http://[your-ip]:5173
```

### Verification

Your setup is complete when you can:

1. **Access Frontend**: Navigate to http://localhost:5173
2. **API Health Check**: Visit http://localhost:5000/api/health
3. **Database Connection**: Check backend logs for "Database connected"
4. **User Registration**: Try creating a new account

## 🔧 Configuration

### Backend Environment Variables (.env)

```env
# === REQUIRED CONFIGURATION ===

# Database Connection
DB_HOST=localhost                    # Database server host
DB_PORT=5432                        # PostgreSQL port (default: 5432)
DB_NAME=volunteering_platform       # Database name
DB_USER=postgres                    # Database username
DB_PASSWORD=your_secure_password    # Database password

# JWT Authentication
JWT_SECRET=your_super_secure_secret_key_minimum_32_characters
JWT_EXPIRE=7d                       # Token expiration (7d, 30d, etc.)
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key
REFRESH_TOKEN_EXPIRE=30d           # Refresh token expiration

# === OPTIONAL CONFIGURATION ===

# Server Settings
NODE_ENV=development               # Environment (development/production)
PORT=5000                         # API server port
FRONTEND_URL=http://localhost:5173 # Frontend URL for CORS

# Email Service (for notifications)
EMAIL_HOST=smtp.gmail.com         # SMTP server
EMAIL_PORT=587                    # SMTP port
EMAIL_USER=your_email@gmail.com   # Email username
EMAIL_PASS=your_app_password      # App-specific password
EMAIL_FROM=noreply@volunteer-connect.org  # From address

# File Upload Settings
UPLOAD_MAX_SIZE=5242880           # Max file size (5MB in bytes)
UPLOAD_PATH=./uploads             # Upload directory

# Security Configuration
BCRYPT_ROUNDS=12                  # Password hashing rounds
RATE_LIMIT_WINDOW_MS=900000       # Rate limit window (15 minutes)
RATE_LIMIT_MAX=100               # Max requests per window

# Logging
LOG_LEVEL=info                   # Log level (error, warn, info, debug)
LOG_FILE=./logs/app.log          # Log file location
```

### Frontend Environment Variables (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api    # Backend API endpoint

# Application Settings
VITE_APP_NAME=Volunteer Connect           # Application name
VITE_MAX_FILE_SIZE=5242880               # Max upload size (5MB)

# Feature Toggles
VITE_ENABLE_ANALYTICS=false              # Enable analytics tracking
VITE_ENABLE_NOTIFICATIONS=true           # Enable browser notifications
VITE_ENABLE_PWA=false                   # Enable Progressive Web App features

# Development Settings
VITE_API_TIMEOUT=10000                  # API request timeout (10 seconds)
VITE_DEBUG_MODE=true                    # Enable debug logging
```

## 🗄️ Database Setup

### Creating the Database

#### Using Command Line
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE volunteering_platform;

# Create user (optional, for security)
CREATE USER volunteer_admin WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE volunteering_platform TO volunteer_admin;

# Exit psql
\q
```

#### Using GUI Tools
- **pgAdmin**: Create database through the web interface
- **DBeaver**: Connect and create database using the visual interface  
- **TablePlus**: Modern database client with easy database creation

### Database Migrations

Our platform uses Sequelize migrations for database schema management:

```bash
cd backend

# Check migration status
npm run migrate:status

# Run pending migrations
npm run migrate

# Rollback last migration (if needed)
npm run migrate:undo

# Rollback to specific migration
npm run migrate:undo:all --to XXXXXXXXXXXXXX-migration-name.js
```

### Sample Data (Development)

Load sample data for development and testing:

```bash
# Seed database with sample data
npm run seed

# This creates:
# - Sample admin user (admin@volunteer-connect.org)
# - Test organizations and volunteers
# - Sample opportunities and applications
# - Demo data for all features
```

### Database Reset (Development Only)

To completely reset your development database:

```bash
# WARNING: This will delete ALL data
npm run db:reset

# This will:
# 1. Drop all tables
# 2. Run all migrations from scratch
# 3. Optionally seed with sample data
```

## 👤 First Steps

### Creating Your First Admin Account

After setting up the database, create an admin account to access all platform features:

```bash
cd backend
npm run create-admin

# Follow the prompts to enter:
# - Email address
# - Password
# - Full name
```

### Testing Your Setup

1. **Access the Platform**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs (if enabled)

2. **Login with Admin Account**
   - Use the admin credentials you just created
   - Explore the admin dashboard
   - Create test organizations and opportunities

3. **Create Test Accounts**
   - Register as a new volunteer
   - Register a new organization
   - Test the complete user flow

### Initial Configuration

1. **Organization Setup**
   - Create your first organization profile
   - Add organization details and verification documents
   - Set up organization categories and focus areas

2. **Opportunity Creation**
   - Create sample volunteer opportunities
   - Test the application and matching workflow
   - Configure notification preferences

3. **User Management**
   - Understand the different user roles (Admin, Moderator, Organization, Volunteer)
   - Configure moderation workflows
   - Set up user approval processes

## 🐳 Docker Development Environment

### Prerequisites for Docker

- Docker 20.10+ installed on your system
- Docker Compose 2.0+ (included with Docker Desktop)
- At least 4GB RAM allocated to Docker

### Quick Docker Setup

```bash
# Clone repository
git clone https://github.com/yourusername/volunteer-connect.git
cd volunteer-connect

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Access services:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:5000
# - Database: localhost:5432
```

### Docker Environment Variables

Create a `.env` file in the root directory for Docker:

```env
# Database Configuration
POSTGRES_DB=volunteering_platform
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123

# Application Configuration
NODE_ENV=development
JWT_SECRET=your_jwt_secret_for_docker_development_only
EMAIL_USER=test@example.com
EMAIL_PASS=test_password

# Service Ports
FRONTEND_PORT=5173
BACKEND_PORT=5000
DB_PORT=5432
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start with logs
docker-compose up

# Stop all services
docker-compose down

# Rebuild services after code changes
docker-compose build --no-cache

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d

# Execute commands in containers
docker-compose exec backend npm run migrate
docker-compose exec backend npm run create-admin

# View service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Docker Production Deployment

For production deployment, use the production compose file:

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up --scale backend=3 -d
```

```bash
npm run seed
```

## Testing the Application

### 1. Register a New Account

- Go to http://localhost:5173/register
- Fill in your details
- Choose role: Volunteer or Charity
- Check the consent checkbox
- Click Register

### 2. Complete Your Profile

After registration:
- **Volunteers**: Complete your profile with skills, interests, and availability
- **Charities**: Complete your organization profile with registration number and details

### 3. For Charities

- Create volunteering opportunities
- Review applications from volunteers
- Manage attendance and provide feedback

### 4. For Volunteers

- Browse available opportunities
- Apply for opportunities that match your interests
- Track your applications
- View your volunteering history

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `PUT /api/auth/updatepassword` - Update password
- `POST /api/auth/forgotpassword` - Request password reset
- `PUT /api/auth/resetpassword/:token` - Reset password

### Opportunities Endpoints

- `GET /api/opportunities` - List all opportunities
- `GET /api/opportunities/:id` - Get single opportunity
- `POST /api/opportunities` - Create opportunity (Charity only)
- `PUT /api/opportunities/:id` - Update opportunity (Charity only)
- `DELETE /api/opportunities/:id` - Delete opportunity (Charity only)
- `GET /api/opportunities/:id/matches` - Get matched volunteers (Charity only)

### Applications Endpoints

- `GET /api/applications` - List user's applications
- `GET /api/applications/:id` - Get single application
- `POST /api/applications` - Create application (Volunteer only)
- `PUT /api/applications/:id` - Update application status (Charity only)
- `PUT /api/applications/:id/withdraw` - Withdraw application (Volunteer only)

### Volunteer Endpoints

- `GET /api/volunteers` - List volunteers (Charity/Moderator only)
- `GET /api/volunteers/:id` - Get volunteer profile
- `POST /api/volunteers` - Create/update volunteer profile
- `GET /api/volunteers/:id/recommendations` - Get recommended opportunities

### Charity Endpoints

- `GET /api/charities` - List all charities
- `GET /api/charities/:id` - Get charity profile
- `POST /api/charities` - Create/update charity profile
- `PUT /api/charities/:id` - Update charity profile

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=volunteering_platform
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_password

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## Troubleshooting

### Port Already in Use

If you get an error that port 5000 or 5173 is already in use:

```bash
# Find process using the port
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Database Connection Error

- Ensure PostgreSQL is running
- Check database credentials in .env file
- Verify database exists

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues

**Problem**: `ECONNREFUSED` or database connection errors

**Solutions**:
```bash
# Check if PostgreSQL is running
# Windows:
pg_ctl status -D "C:\Program Files\PostgreSQL\14\data"

# macOS:
brew services list | grep postgres

# Linux:
sudo systemctl status postgresql

# Start PostgreSQL service if not running
# Windows:
net start postgresql-x64-14

# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Verify database exists
psql -U postgres -l | grep volunteering_platform
```

**Environment Variables Check**:
```bash
# Verify your .env file has correct database settings
cat backend/.env | grep -E "DB_HOST|DB_PORT|DB_NAME|DB_USER|DB_PASSWORD"
```

#### Port Already in Use

**Problem**: `EADDRINUSE` errors on port 5000 or 5173

**Solutions**:
```bash
# Find process using the port
# Windows:
netstat -ano | findstr :5000
netstat -ano | findstr :5173

# macOS/Linux:
lsof -ti:5000
lsof -ti:5173

# Kill the process (replace PID with actual process ID)
# Windows:
taskkill /PID <PID> /F

# macOS/Linux:
kill -9 <PID>

# Or change ports in environment variables
# Backend: Change PORT in backend/.env
# Frontend: Add --port flag: npm run dev -- --port 3000
```

#### Node.js Version Issues

**Problem**: Module compatibility errors or installation failures

**Solutions**:
```bash
# Check Node.js version
node --version

# Should be 18.0.0 or higher
# Update Node.js if needed

# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# For Windows users with permission issues:
npm config set script-shell "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
```

#### Migration Errors

**Problem**: Database migration failures

**Solutions**:
```bash
cd backend

# Check current migration status
npm run migrate:status

# Force unlock migrations (if stuck)
npx sequelize-cli db:migrate:status
npx sequelize-cli db:migrate:undo:all
npm run migrate

# Reset database completely (DEV ONLY - DESTROYS DATA)
psql -U postgres -c "DROP DATABASE IF EXISTS volunteering_platform;"
psql -U postgres -c "CREATE DATABASE volunteering_platform;"
npm run migrate
```

#### File Upload Issues

**Problem**: File upload errors or permission denied

**Solutions**:
```bash
# Create uploads directory if missing
mkdir -p backend/uploads/charity
mkdir -p backend/uploads/volunteers
mkdir -p backend/uploads/temp

# Fix permissions (Unix/Linux/macOS)
chmod 755 backend/uploads
chmod 755 backend/uploads/charity
chmod 755 backend/uploads/volunteers

# Windows: Ensure the user has write permissions to the uploads folder
```

#### Docker Issues

**Problem**: Docker containers not starting or database connection issues

**Solutions**:
```bash
# Check Docker service status
docker --version
docker-compose --version

# Stop and restart services
docker-compose down
docker-compose up -d

# Check service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Reset Docker environment (DESTROYS DATA)
docker-compose down -v --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Free up Docker resources
docker system prune -af
```

### Performance Issues

#### Slow Backend Response

**Solutions**:
```bash
# Check backend logs for errors
tail -f backend/logs/app.log

# Monitor database connections
# Add to backend/.env:
DB_LOGGING=true

# Restart with more verbose logging
NODE_ENV=development LOG_LEVEL=debug npm run dev
```

#### Frontend Loading Slowly

**Solutions**:
```bash
# Clear browser cache and cookies
# Or try incognito/private mode

# Clear frontend build cache
cd frontend
rm -rf dist node_modules
npm install
npm run dev

# Check for console errors in browser developer tools
```

### Development Tips

#### Hot Reloading Not Working

**Solutions**:
```bash
# Backend (nodemon issues)
cd backend
npx nodemon --version
# If outdated: npm install -g nodemon@latest

# Frontend (Vite issues)
cd frontend  
# Try different port
npm run dev -- --port 3000

# Clear Vite cache
rm -rf .vite
```

#### Database Schema Changes

**When modifying models**:
```bash
cd backend

# Generate new migration
npx sequelize-cli migration:generate --name your-change-description

# Edit the generated migration file in migrations/
# Add your schema changes

# Run the migration
npm run migrate

# If issues, rollback and fix
npm run migrate:undo
# Edit migration file
npm run migrate
```

### Getting Help

If you're still experiencing issues:

1. **Check the logs**:
   ```bash
   # Backend logs
   tail -f backend/logs/app.log
   
   # Frontend console errors (browser developer tools)
   # Docker logs
   docker-compose logs -f
   ```

2. **Verify system requirements**:
   - Node.js 18+ installed
   - PostgreSQL 14+ running
   - Sufficient disk space (2GB+)
   - No antivirus blocking ports

3. **Clean restart**:
   ```bash
   # Stop all services
   docker-compose down
   # Or manually stop Node.js processes
   
   # Clear caches
   npm cache clean --force
   
   # Restart everything
   npm run dev
   ```

4. **Contact support**:
   - 📧 Email: [reachtosundar@gmail.com](mailto:reachtosundar@gmail.com)
   - 🐛 GitHub Issues: Report bugs with detailed information
   - 📚 Documentation: Check [DEVELOPMENT.md](DEVELOPMENT.md) for advanced topics

## 🚦 Development Workflow

### Setting Up Your Development Environment

#### 1. IDE/Editor Setup

**Recommended VS Code Extensions**:
```bash
# Install recommended extensions
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-json
code --install-extension christian-kohler.path-intellisense
```

**Workspace Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": ["backend", "frontend"],
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

#### 2. Git Workflow

```bash
# Clone and setup
git clone https://github.com/yourusername/volunteer-connect.git
cd volunteer-connect

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit frequently
git add .
git commit -m "feat: add user authentication"

# Push feature branch
git push origin feature/your-feature-name

# Create pull request on GitHub
```

#### 3. Code Quality Standards

**Before committing**:
```bash
# Backend code quality checks
cd backend
npm run lint          # ESLint checks
npm run lint:fix      # Auto-fix linting issues  
npm test              # Run test suite
npm run test:coverage # Check test coverage

# Frontend code quality checks  
cd frontend
npm run lint          # ESLint and formatting
npm run type-check    # TypeScript checks (if applicable)
npm test              # Run component tests
```

### Testing Your Changes

#### 1. Manual Testing Checklist

- [ ] User registration and login works
- [ ] Organization profile creation and editing
- [ ] Volunteer profile management
- [ ] Opportunity creation and application process
- [ ] Real-time notifications functioning
- [ ] File uploads working correctly
- [ ] Admin dashboard accessible and functional
- [ ] Responsive design on mobile and desktop

#### 2. Automated Testing

```bash
# Backend API tests
cd backend
npm test                    # Run all tests
npm run test:unit          # Unit tests only  
npm run test:integration   # Integration tests only
npm run test:watch         # Watch mode for development

# Frontend component tests
cd frontend  
npm test                   # Run all frontend tests
npm run test:coverage      # Generate coverage report
```

#### 3. End-to-End Testing

```bash
# Setup test environment
docker-compose -f docker-compose.test.yml up -d

# Run E2E tests (if configured)
npm run test:e2e

# Cleanup test environment
docker-compose -f docker-compose.test.yml down
```

## 🎯 Next Steps

### For New Contributors

1. **Explore the Codebase**:
   - Read [DEVELOPMENT.md](DEVELOPMENT.md) for architecture overview
   - Browse the [API documentation](#api-documentation)
   - Check out existing [issues](https://github.com/yourusername/volunteer-connect/issues)

2. **Start Contributing**:
   - Look for issues labeled `good-first-issue`
   - Read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
   - Join our community discussions

3. **Advanced Setup**:
   - Configure development tools and IDE
   - Set up testing environment
   - Learn about our deployment process

### For Organizations

1. **Production Deployment**:
   - Follow production deployment guide
   - Set up monitoring and logging
   - Configure backup and recovery

2. **Customization**:
   - Brand customization options
   - Feature configuration
   - Integration with existing systems

3. **Support**:
   - Technical support options
   - Community resources
   - Professional services

## 📚 Additional Resources

### Documentation
- 📖 **[Development Guide](DEVELOPMENT.md)**: Detailed technical documentation
- 🤝 **[Contributing Guide](CONTRIBUTING.md)**: How to contribute to the project
- 🔧 **[API Documentation](DEVELOPMENT.md#api-reference)**: Complete API reference
- 🐳 **[Docker Guide](DEVELOPMENT.md#docker-development)**: Advanced Docker setup

### Community
- 💬 **[GitHub Discussions](https://github.com/yourusername/volunteer-connect/discussions)**: Community Q&A
- 🐛 **[Issue Tracker](https://github.com/yourusername/volunteer-connect/issues)**: Bug reports and feature requests
- 📧 **[Contact](mailto:reachtosundar@gmail.com)**: Direct contact for urgent issues

### Related Projects
- 🔗 **[Volunteer Management Systems](https://example.com)**: Similar open-source projects
- 📱 **[Mobile App](https://github.com/yourusername/volunteer-connect-mobile)**: React Native mobile application
- 🔌 **[API Client Libraries](https://github.com/yourusername/volunteer-connect-api)**: SDKs for different languages

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**🎉 Congratulations! You're ready to start developing with Volunteer Connect!**

*Need help? Don't hesitate to reach out to our community or maintainers.*

**[⭐ Star the repository](https://github.com/yourusername/volunteer-connect)** if this guide was helpful!

</div>
