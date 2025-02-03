import dbConfigs from './dbConfig.js';
const getBaseTemplates = (dbType) => {
  const templates = {
    'src/app.js': `
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./interfaces/routes');
const errorHandler = require('./interfaces/middlewares/errorHandler');

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    this.app.use('/', routes);
    this.app.use(errorHandler);
  }

  getApp() {
    return this.app;
  }
}

module.exports = new App().getApp();`,

    'src/infrastructure/logger/index.js': `
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

module.exports = logger;`,

    'src/interfaces/middlewares/errorHandler.js': `
const logger = require('../../infrastructure/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = \`\${statusCode}\`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode
  });

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
module.exports.AppError = AppError;`,

    'src/interfaces/routes/index.js': `
const router = require('express').Router();

// Route main
router.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running successfully!',
    status: 'success',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;`,

     'README.md': `
# Express Clean Architecture Generator

🚀 **A CLI tool for generating Express.js applications following Clean Architecture principles**  

---

## 🌟 Overview  

Express Clean Architecture Generator is a CLI tool designed to streamline the process of creating robust Express.js applications. It follows **Uncle Bob's Clean Architecture** principles, ensuring modularity and maintainability.  

---

## ✨ Features  

### 🏗️ Architecture & Structure  
- **Clean Architecture Implementation**  
- **Domain-driven design approach**  
- **Modular and maintainable structure**  

### 🛢️ Database Integration  
- **PostgreSQL** (Knex.js for migrations, repository pattern)  
- **MongoDB** (Mongoose integration, schema-based models)  

### 🛠️ Developer Experience  
- **Pre-configured Tools**: ESLint, Prettier, Jest, Nodemon  

---

## 🚀 Quick Start  

### 1️⃣ Configure Environment Variables  
\`\`\`sh
cp .env.example .env
\`\`\`

### 2️⃣ Start Development Server  
\`\`\`sh
npm run dev
\`\`\`

---

## 📁 Project Structure  

\`\`\`
src/
├── app.js                # Application setup
├── server.js             # Server entry point
│
├── application/          # Business logic layer
│   ├── services/        # Application services
│   └── use-cases/       # Use case implementations
│
├── domain/              # Core domain logic
│   ├── entities/        # Business entities
│   ├── repositories/    # Repository interfaces
│   ├── services/        # Domain services
│   └── value-objects/   # Value objects
│
├── infrastructure/      # External dependencies
│   ├── database/       # Database connection
│   ├── logger/         # Logging (Winston)
│   └── security/       # Security configurations
│
└── interfaces/         # API & external interactions
    ├── controllers/    # Route handlers
    ├── middlewares/    # Express middlewares
    ├── routes/         # API route definitions
    └── validators/     # Input validation
\`\`\`

---

## 📜 Available Scripts  

| Command          | Description                          |  
|-----------------|----------------------------------|  
| \`npm run dev\`  | Start development server (hot-reload) |  
| \`npm start\`    | Start production server         |  
| \`npm test\`     | Run tests                       |  
| \`npm run lint\` | Run ESLint                      |  
| \`npm run format\` | Format code with Prettier      |  

---

## 📚 Documentation  

### Architecture Overview  

1. **Domain Layer** → Business rules (pure logic)  
2. **Application Layer** → Coordinates use cases  
3. **Infrastructure Layer** → External tools (DB, logging, security)  
4. **Interfaces Layer** → Handles external input/output  

---

## 📄 License  

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.  

---

## 👨‍💻 Author  

Created with ❤️ by **Afauzi**  

⭐ **Show some love by starring this repo!**  
`,

    '.env.example': `
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

${dbConfigs[dbType].envVariables}

# JWT (if needed)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d`,

    '.gitignore': `
# Dependencies
node_modules/

# Environment
.env
.env.*
!.env.example

# Logs
logs/
*.log

# Build
dist/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/`
  };

  // Add database-specific server file
  templates['src/server.js'] = dbType === 'none' ? 
    // Server template without database
    `
require('dotenv').config();
const app = require('./app');
const logger = require('./infrastructure/logger');

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Server is running',
    port: PORT,
    status: 'success',
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  try {
    const server = app.listen(PORT, () => {
      logger.info(\`Server running on port \${PORT}\`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();` :
    // Server template with database
    `
require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./infrastructure/database');
const logger = require('./infrastructure/logger');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize database connection
    await connectDB();
    
    const server = app.listen(PORT, () => {
      logger.info(\`Server running on port \${PORT}\`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();`;

  return templates;
};

export default getBaseTemplates;