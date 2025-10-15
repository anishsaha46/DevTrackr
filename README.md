# 🚀 DevTrackr

<div align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3-brightgreen" alt="Spring Boot 3"/>
  <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js 15"/>
  <img src="https://img.shields.io/badge/MongoDB-Latest-green" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/VS%20Code-Extension-blue" alt="VS Code Extension"/>
  <img src="https://img.shields.io/badge/TypeScript-Latest-blue" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/OAuth-Google%20%7C%20GitHub-orange" alt="OAuth"/>
  <img src="https://img.shields.io/badge/Prometheus-Monitoring-red" alt="Prometheus"/>
</div>

<div align="center">
  <h3>Track your coding activity across projects with powerful analytics and insights</h3>
</div>

## 📋 Overview

DevTrackr is a comprehensive developer productivity tracking platform that helps you monitor your coding activity across multiple projects. The application consists of three main components:

- **Backend API**: Built with Spring Boot 3 and MongoDB for robust data storage
- **Web Dashboard**: Modern Next.js 15 frontend with TypeScript and Tailwind CSS
- **VS Code Extension**: Seamlessly tracks your coding activity right from your editor

With DevTrackr, you can:
- 📊 Visualize your coding patterns and productivity trends
- 🔍 Track time spent across different projects and languages
- 🔄 Sync your activity across multiple devices with secure OAuth login
- 📱 Access your stats from anywhere with a responsive web interface
- 📈 Monitor application performance with Prometheus and Grafana

## 🛠️ Technology Stack

### Backend
- **Framework**: Spring Boot 3
- **Database**: MongoDB
- **Authentication**: JWT, OAuth2 (Google, GitHub)
- **API Documentation**: SpringDoc OpenAPI
- **Monitoring**: Prometheus, Actuator
- **Caching**: Redis, Caffeine
- **Rate Limiting**: Bucket4j

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Authentication**: OAuth with device authorization

### VS Code Extension
- **Language**: TypeScript
- **Authentication**: Device OAuth flow
- **Activity Tracking**: File changes, language usage, time spent

### DevOps
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: Render (Backend), Vercel (Frontend)
- **Monitoring**: Prometheus, Grafana

## 🚀 Quick Start (Local Development)

### Prerequisites
- Java 21
- Node.js 18+
- MongoDB
- Docker and Docker Compose (optional)

### Using Docker Compose (Recommended)
The easiest way to get started is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/yourusername/DevTrackr.git
cd DevTrackr

# Start all services (backend, frontend, MongoDB, Prometheus, Grafana)
docker-compose up -d
```

Access the services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

### Manual Setup

#### Backend
```bash
cd backend
./mvnw spring-boot:run
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### VS Code Extension
```bash
cd vscode-extension
npm install
# Press F5 in VS Code to run the extension in development mode
```

## 📊 Monitoring

DevTrackr comes with built-in monitoring using Prometheus and Grafana:

- **Metrics Collection**: Spring Boot Actuator exposes metrics at `/actuator/prometheus`
- **Visualization**: Pre-configured Grafana dashboards for system and application metrics
- **Alerting**: Basic alert rules for high latency and error rates

For detailed instructions, see the [Monitoring Guide](./monitoring-guide.md).

## 🔧 Configuration

### Backend Configuration

Key application properties (set in `application.properties` or environment variables):

```properties
# MongoDB Connection
spring.data.mongodb.uri=mongodb://localhost:27017/devtrackr

# JWT Configuration
jwt.secret=your-secret-key
jwt.expiration=1800000

# OAuth2 Configuration
spring.security.oauth2.client.registration.google.client-id=your-google-client-id
spring.security.oauth2.client.registration.google.client-secret=your-google-client-secret
spring.security.oauth2.client.registration.google.scope=openid,profile,email

spring.security.oauth2.client.registration.github.client-id=your-github-client-id
spring.security.oauth2.client.registration.github.client-secret=your-github-client-secret
spring.security.oauth2.client.registration.github.scope=repo,user,email

# Frontend URL
app.frontend.url=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Device Authorization
app.device-auth.expiration=600
app.device-auth.polling-interval=5
```

### Frontend Configuration

Environment variables for the Next.js frontend:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

## 🌐 Deployment

### Backend Deployment (Render)

1. Create a Web Service from the `backend` folder repo.
2. Runtime Configuration:
   - Build Command: `./mvnw clean package -DskipTests`
   - Start Command: `java -jar target/codeTracker-0.0.1-SNAPSHOT.jar`
   - Environment: Java 21
3. Environment Variables (Render → Environment):
   - `spring.data.mongodb.uri` = your MongoDB URI
   - `jwt.secret` = a long random secret (≥ 256-bit)
   - `jwt.expiration` = 1800000 (30m) or desired
   - `app.frontend.url` = https://YOUR_FRONTEND_DOMAIN
   - `app.device-auth.expiration` = 600
   - `app.device-auth.polling-interval` = 5
   - `FRONTEND_URL` = https://YOUR_FRONTEND_DOMAIN
   - `spring.security.oauth2.client.registration.google.client-id`
   - `spring.security.oauth2.client.registration.google.client-secret`
   - `spring.security.oauth2.client.registration.google.scope` = `openid,profile,email`
   - `spring.security.oauth2.client.registration.github.client-id`
   - `spring.security.oauth2.client.registration.github.client-secret`
   - `spring.security.oauth2.client.registration.github.scope` = `repo,user,email`
4. Redirects (OAuth provider consoles):
   - Google redirect URI: `https://YOUR_FRONTEND_DOMAIN/auth/google/callback`
   - GitHub callback (if using custom flow): your backend callback endpoint.

### Frontend Deployment (Vercel)

1. Import the `frontend` folder into Vercel.
2. Environment Variables (Vercel → Project → Settings → Environment Variables):
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = your Google client ID
   - `NEXT_PUBLIC_API_BASE` = https://YOUR_BACKEND_DOMAIN
3. Update OAuth Authorized JavaScript origins/redirect URIs to your Vercel domain.
4. Deploy. Make sure links in `/login` point to the backend domain (Render) and the Google redirect points to your Vercel domain.

### Monitoring Deployment

For deploying Prometheus and Grafana on Render:

1. Create a Web Service for each component using the Dockerfiles in the `prometheus` and `grafana` directories.
2. Configure persistent storage for metrics data.
3. Set up environment variables for authentication and configuration.

See the [Monitoring Guide](./monitoring-guide.md) for detailed deployment instructions.

## 🔒 Security Notes

- Always use HTTPS in production environments
- Use strong JWT secrets (at least 256 bits)
- Configure CORS on the backend to allow only your frontend domain
- Regularly update dependencies to patch security vulnerabilities
- Store sensitive configuration in environment variables, not in code
- The VS Code extension uses device flow for secure authentication

## 🧩 Architecture

DevTrackr follows a microservices architecture with:

- **Authentication Service**: Handles user login, registration, and token management
- **Activity Tracking Service**: Processes and stores coding activity data
- **Analytics Service**: Generates insights and statistics from activity data
- **VS Code Integration**: Collects coding metrics directly from the editor

For more details, see the [Architecture Diagram](./architecture_diagram.md) and [Data Flow Diagram](./data_flow_diagram.md).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for developers who love data</p>
</div>
