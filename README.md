# Volunteer Connect Platform

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://postgresql.org/)

**Volunteer Connect** is a comprehensive open-source platform that seamlessly connects charitable organizations with passionate volunteers. Built with modern web technologies, it features intelligent matching algorithms, comprehensive vetting workflows, real-time communication, and robust opportunity management tools.

## 🌟 Features

### For Organizations
- **Organization Management**: Complete charity profile management and verification
- **Opportunity Creation**: Create detailed volunteering opportunities with skill requirements
- **Volunteer Matching**: Matching based on skills, location, and availability
- **Application Management**: Review, approve, and manage volunteer applications
- **Attendance Tracking**: Monitor and record volunteer participation hours
- **Communication Tools**: Direct messaging with volunteers and announcements

### For Volunteers
- **Profile Management**: Comprehensive volunteer profiles with skills and interests
- **Opportunity Discovery**: Advanced search and filtering of volunteer opportunities
- **Application System**: Easy application process with status tracking
- **Opportunity Matching**: Matching based on skills, location, and availability
- **Hour Tracking**: Automatic tracking of volunteer hours and achievements

### For Administrators
- **User Management**: Comprehensive admin dashboard for user oversight
- **Moderation Tools**: Review and moderate organizations and opportunities
- **Analytics Dashboard**: Insights into platform usage and volunteer engagement
- **Reporting System**: Generate reports on platform activities and impact
- **Security Monitoring**: Track and manage platform security

### Technical Features
- **Notification System**: Database-based notifications with email support
- **Security First**: JWT authentication, role-based access control, and secure password hashing
- **API-First**: RESTful APIs with comprehensive documentation
- **Scalable Architecture**: Docker-ready architecture with PostgreSQL database
- **Data Protection**: Privacy-focused design with user consent management

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js 18+ with Express.js framework
- **Database**: PostgreSQL 14+ with Sequelize ORM
- **Authentication**: JWT-based auth with bcrypt password hashing
- **File Storage**: Multer for file uploads and management
- **Email**: Nodemailer for transactional emails
- **Logging**: Winston for comprehensive logging
- **Security**: Helmet, CORS, and input validation

### Frontend
- **Framework**: React 18+ with modern hooks and context
- **State Management**: Redux Toolkit for global state
- **UI Components**: Material-UI (MUI) with custom theming
- **Build Tool**: Vite for fast development and optimized builds
- **Forms**: Formik with Yup validation
- **HTTP Client**: Axios with interceptors and error handling
- **Routing**: React Router for SPA navigation
- **Styling**: CSS-in-JS with emotion and responsive design

### DevOps & Infrastructure
- **Containerization**: Docker and Docker Compose for development
- **Process Management**: PM2 for production deployment
- **Database Migrations**: Sequelize CLI for schema management
- **Environment**: dotenv for configuration management
- **Code Quality**: ESLint for code standards

## 📁 Project Structure

```
volunteer-connect/
├── 📁 backend/                 # Node.js API server
│   ├── 📁 src/
│   │   ├── 📁 config/         # Database and app configuration
│   │   ├── 📁 controllers/    # Request handlers and business logic
│   │   ├── 📁 middleware/     # Custom middleware (auth, validation, etc.)
│   │   ├── 📁 models/         # Sequelize database models
│   │   ├── 📁 routes/         # API route definitions
│   │   ├── 📁 services/       # Business logic and external integrations
│   │   ├── 📁 utils/          # Utility functions and helpers
│   │   └── 📄 server.js       # Application entry point
│   ├── 📁 migrations/         # Database schema migrations
│   ├── 📁 uploads/           # File upload storage
│   ├── 📁 logs/              # Application logs
│   └── 📄 package.json       # Backend dependencies
├── 📁 frontend/               # React.js client application
│   ├── 📁 src/
│   │   ├── 📁 components/    # Reusable React components
│   │   ├── 📁 pages/         # Page-level components
│   │   ├── 📁 store/         # Redux store and slices
│   │   ├── 📁 services/      # API service functions
│   │   ├── 📁 hooks/         # Custom React hooks
│   │   ├── 📁 utils/         # Frontend utilities
│   │   └── 📄 App.jsx        # Root React component
│   ├── 📁 public/            # Static assets and favicon
│   └── 📄 package.json       # Frontend dependencies
├── 📄 docker-compose.yml     # Docker development environment
├── 📄 README.md              # This file
├── 📄 GETTING_STARTED.md     # Quick setup guide
├── 📄 DEVELOPMENT.md         # Development documentation
└── 📄 CONTRIBUTING.md        # Contribution guidelines
```

## 🚀 Quick Start

Get the platform running locally in just a few steps! For detailed setup instructions, see [GETTING_STARTED.md](GETTING_STARTED.md).

### Prerequisites
- **Node.js** 18 or higher
- **PostgreSQL** 14 or higher  
- **npm** or yarn package manager
- **Git** for cloning the repository

### One-Command Setup with Docker

```bash
# Clone and start the entire platform
git clone https://github.com/tosundar40/volunteer-connect.git
cd volunteer-connect
docker-compose up -d
```

Access the platform:
- 🌐 **Frontend**: http://localhost:5173
- 🔌 **Backend API**: http://localhost:5000
- 🗄️ **Database**: localhost:5432

### Manual Setup

#### 1. Clone Repository
```bash
git clone https://github.com/tosundar40/volunteer-connect.git
cd volunteer-connect
```

#### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env file with your database credentials
npm run migrate
npm run dev
```

#### 3. Setup Frontend (in new terminal)
```bash
cd frontend  
npm install
cp .env.example .env
npm run dev
```

### Default Admin Account
After running migrations, create an admin account:
```bash
cd backend
npm run create-admin
```

## 📖 Documentation

- **[Getting Started Guide](GETTING_STARTED.md)** - Complete setup and installation
- **[Development Documentation](DEVELOPMENT.md)** - Architecture, APIs, and development
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute to the project
- **[API Documentation](#api-reference)** - Complete API reference

## 🔧 Configuration
### Backend Environment Variables
Create `backend/.env`:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=volunteering_platform
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRE=30d

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@volunteer-connect.org

# File Upload Configuration
UPLOAD_MAX_SIZE=5242880  # 5MB
UPLOAD_PATH=./uploads

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100  # requests per window
```

### Frontend Environment Variables
Create `frontend/.env`:
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME=Volunteer Connect
VITE_MAX_FILE_SIZE=5242880  # 5MB

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_NOTIFICATIONS=true
```

## 🔌 API Reference

### Overview

- **Base URL:** `{{VITE_API_URL}}` (example: `http://localhost:5000/api`)
- **Auth:** Bearer token in `Authorization: Bearer <token>` for protected routes
- **Format:** JSON request and response bodies. File uploads use `multipart/form-data`.
- **Pagination:** `page` (1-based) and `limit` query params. Responses commonly include `{ items, total, page, limit }`.

### Authentication
- POST `/api/auth/register` — Register new user. Body: `{ firstName, lastName, email, password, role }`.
- POST `/api/auth/login` — Login. Body: `{ email, password }`. Response: `{ token, refreshToken, user }`.
- POST `/api/auth/logout` — Logout (invalidate refresh token).
- GET `/api/auth/me` — Current user profile (auth required).
- POST `/api/auth/refresh` — Refresh access token. Body: `{ refreshToken }`.
- POST `/api/auth/forgot-password` — Request password reset. Body: `{ email }`.
- POST `/api/auth/reset-password` — Reset password with token. Body: `{ token, password }`.

### Users
- GET `/api/users` — List users (admin). Query: `page, limit, role, q`.
- GET `/api/users/:id` — Get user by id (admin or owner).
- PUT `/api/users/:id` — Update user (owner or admin).
- DELETE `/api/users/:id` — Deactivate user (admin).
- POST `/api/users/upload-avatar` — Upload profile picture (auth, multipart/form-data).

### Organizations (Charities)
- GET `/api/organizations` — List organizations. Query: `page, limit, verified, q, city, category`.
- POST `/api/organizations` — Create organization profile (auth).
- GET `/api/organizations/:id` — Get organization details (public).
- PUT `/api/organizations/:id` — Update organization (owner or admin).
- DELETE `/api/organizations/:id` — Delete organization (admin).
- POST `/api/organizations/:id/verify` — Verify organization (moderator/admin).

### Opportunities
- GET `/api/opportunities` — List opportunities (public). Query: `page, limit, q, category, city, dateFrom, dateTo, sort`.
- POST `/api/opportunities` — Create opportunity (charity auth).
- GET `/api/opportunities/:id` — Get opportunity details (public).
- PUT `/api/opportunities/:id` — Update opportunity (owner or admin).
- DELETE `/api/opportunities/:id` — Delete opportunity (owner or admin).
- GET `/api/opportunities/:id/matches` — Suggested volunteer matches (charity auth).

### Applications
- POST `/api/applications` — Apply for opportunity (volunteer auth). Body: `{ opportunityId, coverLetter, availability }`.
- GET `/api/applications` — List applications (user or filtered by admin/charity). Query: `opportunityId, status, page, limit`.
- GET `/api/applications/:id` — Get application details (auth/role checks apply).
- PUT `/api/applications/:id` — Update application (status changes by owner/charity/admin).
- DELETE `/api/applications/:id` — Withdraw application (volunteer owner).
- POST `/api/applications/:id/confirm` — Confirm participation (workflow endpoint).

### Volunteers
- GET `/api/volunteers` — List volunteer profiles. Query: `skills, city, q, page, limit`.
- GET `/api/volunteers/:id` — Get volunteer profile (public).
- PUT `/api/volunteers/:id` — Update volunteer profile (owner).
- GET `/api/volunteers/:id/hours` — Get volunteer hours (owner or admin).
- POST `/api/volunteers/skills` — Update volunteer skills/interests (owner).

### Moderation & Admin
- GET `/api/moderation/pending` — Pending approvals (moderator).
- PUT `/api/moderation/approve/:id` — Approve item (moderator).
- PUT `/api/moderation/reject/:id` — Reject item (moderator).
- GET `/api/moderation/reports` — Moderation reports (moderator/admin).
- GET `/api/users` — Admin user list with moderation filters.

### Notifications
- GET `/api/notifications` — List user notifications (auth required)
- POST `/api/notifications/mark-read` — Mark notifications as read (auth required)

### Reports & Analytics
- GET `/api/reports` — List or generate reports (admin). Query params depend on report type.
- POST `/api/reports` — Create a report (auth/role as required).

### File Uploads
- Endpoints accept `multipart/form-data`. Max file size controlled by `UPLOAD_MAX_SIZE` in backend env.

### Errors & Rate Limits
- Standard error response: `{ error: "Message", details?: {...} }`.
- Rate limiting is applied per server config; 429 responses may include `Retry-After` header.

### Examples
- Login (curl):
```bash
curl -X POST {{VITE_API_URL}}/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"secret"}'
```

- List opportunities (curl):
```bash
curl "{{VITE_API_URL}}/opportunities?page=1&limit=10&q=education"
```

Notes: Replace `{{VITE_API_URL}}` and `{{VITE_SOCKET_URL}}` with values from your environment files (`frontend/.env` or server config). For role-specific endpoints, consult the project's role/permissions documentation.

For full request/response examples, see [DEVELOPMENT.md](DEVELOPMENT.md).

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │    │   Express API    │    │  PostgreSQL DB  │
│                 │────│                  │────│                 │
│  • Redux Store  │    │  • Controllers   │    │  • User Tables  │
│  • Components   │    │  • Services      │    │  • Opportunities│
│  • API Clients  │    │  • Middleware    │    │  • Applications │
│                 │    │  • Notifications │    │  • Notifications│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Design Patterns
- **MVC Architecture**: Separation of concerns with controllers, services, and models
- **Repository Pattern**: Database abstraction layer with Sequelize ORM
- **Middleware Pipeline**: Authentication, validation, and error handling
- **Event-Driven**: Real-time notifications via Socket.IO
- **RESTful APIs**: Consistent API design following REST principles

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute
- 🐛 **Report Bugs**: Submit detailed bug reports with reproduction steps
- ✨ **Feature Requests**: Propose new features or improvements  
- 📖 **Documentation**: Improve docs, tutorials, and examples
- 🔧 **Code**: Fix bugs, implement features, or optimize performance
- 🎨 **Design**: Improve UI/UX, accessibility, and user experience
- 🧪 **Testing**: Add tests, improve coverage, or test new features

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Submit a pull request

### Development Guidelines
- Follow the existing code style and conventions
- Add tests for new features and bug fixes
- Update documentation for any API changes
- Use meaningful commit messages
- Keep pull requests focused and atomic

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📊 Roadmap

### Current Version (v1.0)
- ✅ User authentication and role management
- ✅ Organization and volunteer profiles
- ✅ Opportunity creation and management
- ✅ Application and matching system
- ✅ Real-time notifications
- ✅ Basic admin dashboard

### Future Enhancements (Contributions Welcome)
- 📅 Enhanced matching algorithms
- 📅 Mobile app development
- 📅 Calendar system integration
- 📅 Advanced analytics and reporting
- 📅 Real-time messaging system
- 📅 API rate limiting and caching

## 🛠️ Development
- `PUT /api/charities/:id` - Update charity profile
- `DELETE /api/charities/:id` - Delete charity

### Opportunity Endpoints
- `GET /api/opportunities` - List opportunities
- `POST /api/opportunities` - Create opportunity
- `GET /api/opportunities/:id` - Get opportunity details
- `PUT /api/opportunities/:id` - Update opportunity
- `DELETE /api/opportunities/:id` - Delete opportunity
- `GET /api/opportunities/:id/matches` - Get matched volunteers

### Volunteer Endpoints
- `GET /api/volunteers` - List volunteers
- `GET /api/volunteers/:id` - Get volunteer profile
- `PUT /api/volunteers/:id` - Update volunteer profile
- `GET /api/volunteers/:id/recommendations` - Get recommended opportunities

### Application Endpoints
- `POST /api/applications` - Apply for opportunity
- `GET /api/applications` - List applications
- `PUT /api/applications/:id` - Update application status
- `POST /api/applications/:id/confirm` - Confirm volunteer

### Moderation Endpoints
- `GET /api/moderation/pending` - Get pending approvals
- `PUT /api/moderation/approve/:id` - Approve item
- `PUT /api/moderation/reject/:id` - Reject item
- `GET /api/moderation/reports` - Get reports

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Password Security**: Bcrypt hashing with configurable salt rounds
- **Role-based Access Control**: Granular permissions for different user types
- **Rate Limiting**: API protection against abuse and DDoS attacks
- **Input Validation**: Comprehensive validation and sanitization
- **CORS Configuration**: Properly configured cross-origin resource sharing
- **Security Headers**: Helmet.js for essential security headers
- **SQL Injection Prevention**: Parameterized queries with Sequelize ORM
- **XSS Protection**: Input sanitization and Content Security Policy
- **CSRF Protection**: Cross-site request forgery protection

## 📈 Performance & Monitoring

### Performance Features
- **Database Optimization**: Indexed queries and connection pooling
- **Caching Strategies**: Redis caching for frequent data access
- **Compression**: Gzip compression for API responses
- **Code Splitting**: Lazy loading for frontend components
- **Image Optimization**: Automatic compression and resizing

### Monitoring & Logging
- **Application Logs**: Winston logging with file rotation
- **Error Tracking**: Comprehensive error handling and reporting
- **Performance Metrics**: Request timing and database query monitoring
- **Health Checks**: API health endpoints for system monitoring

## 🚀 Deployment

### Production Setup
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd backend
npm start
```

### Docker Production
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose up --scale backend=3 --scale frontend=2
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute
- 🐛 Report bugs with detailed reproduction steps
- ✨ Suggest new features or improvements
- 📖 Improve documentation and examples
- 🔧 Submit code improvements and bug fixes
- 🎨 Enhance UI/UX and accessibility
- 🧪 Add tests and improve code coverage

### Development Process
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Code** your changes following our style guide
4. **Test** your changes thoroughly
5. **Commit** with clear messages: `git commit -m 'Add amazing feature'`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Submit** a pull request with detailed description

For detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📊 Roadmap

### Current Release (v1.0)
- ✅ Complete authentication system
- ✅ Organization and volunteer management
- ✅ Opportunity creation and applications
- ✅ Basic matching system
- ✅ Admin dashboard and moderation
- ✅ Email notifications
- ✅ File upload management

## 📱 Browser Support

- **Desktop**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile**: iOS Safari 13+, Android Chrome 80+
- **Features**: Modern ES6+, WebSockets, Service Workers

## 🆘 Support & Community

### Getting Help
- 📚 **Documentation**: [Getting Started](GETTING_STARTED.md) | [Development Guide](DEVELOPMENT.md)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/tosundar40/volunteer-connect/issues)
- 📧 **Contact**: [reachtosundar@gmail.com](mailto:reachtosundar@gmail.com)

### Community Guidelines
- Be respectful and inclusive to all community members
- Provide constructive feedback and help others learn
- Follow our code of conduct in all interactions
- Share knowledge and contribute to discussions

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

### MIT License Summary
- ✅ Commercial use allowed
- ✅ Modification and distribution permitted
- ✅ Private use welcome
- ❗ No liability or warranty provided

## 🙏 Acknowledgments

- **Open Source Community**: For the amazing tools and libraries
- **Contributors**: Everyone who has contributed code, docs, or ideas
- **Beta Testers**: Early adopters who helped shape the platform
- **Volunteers**: The real heroes who inspire this platform

## 📞 Contact

**Project Maintainer**: [reachtosundar@gmail.com](mailto:reachtosundar@gmail.com)

**GitHub Repository**: [https://github.com/tosundar40/volunteer-connect](https://github.com/tosundar40/volunteer-connect)

---

<div align="center">

**🌟 Made with ❤️ for the global volunteer community**

*Connecting passionate people with meaningful opportunities*

[![GitHub stars](https://img.shields.io/github/stars/tosundar40/volunteer-connect?style=social)](https://github.com/tosundar40/volunteer-connect)
[![GitHub forks](https://img.shields.io/github/forks/tosundar40/volunteer-connect?style=social)](https://github.com/tosundar40/volunteer-connect/fork)

[⭐ **Star this repository**](https://github.com/tosundar40/volunteer-connect) if you find it helpful!

</div>
