#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => {
  rl.question(query, resolve);
});

// Database configurations and their specific templates
const dbConfigs = {
  postgres: {
    name: 'PostgreSQL',
    dependencies: ['pg', 'pg-hstore', 'sequelize'],
    devDependencies: ['sequelize-cli'],
    databaseFile: `
const { Sequelize } = require('sequelize');
const logger = require('../logger');

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'postgres',
  logging: msg => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected successfully');
    
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synced in development mode');
    }
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    throw error;
  }
};

module.exports = { sequelize, connectDB };`,
    envVariables: `
# Database - PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=app_db
DB_USER=postgres
DB_PASSWORD=postgres`
  },
  mongodb: {
    name: 'MongoDB',
    dependencies: ['mongoose'],
    devDependencies: [],
    databaseFile: `
const mongoose = require('mongoose');
const logger = require('../logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    throw error;
  }
};

module.exports = { mongoose, connectDB };`,
    envVariables: `
# Database - MongoDB
MONGODB_URI=mongodb://localhost:27017/app_db`
  },
  none: {
    name: 'No Database',
    dependencies: [],
    devDependencies: [],
    envVariables: ``
  }
};

// Get base templates based on database choice
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
    this.app.use('/api', routes);
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

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;`,

    '.env': `
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

// Create project structure based on database choice
const createProjectStructure = async (projectPath, dbType) => {
  const baseDirectories = [
    'src/domain/entities',
    'src/domain/repositories',
    'src/domain/services',
    'src/domain/value-objects',
    'src/application/use-cases',
    'src/application/services',
    'src/infrastructure/logger',
    'src/infrastructure/security',
    'src/interfaces/controllers',
    'src/interfaces/middlewares',
    'src/interfaces/routes',
    'src/interfaces/validators',
    'tests/unit',
    'tests/integration',
    'logs'
  ];

  // Add database-specific directories only if a database is selected
  if (dbType !== 'none') {
    baseDirectories.push(
      'src/infrastructure/database',
      'src/infrastructure/database/models',
      'src/infrastructure/database/migrations',
      'src/infrastructure/database/seeders'
    );
  }

  for (const dir of baseDirectories) {
    await fs.promises.mkdir(path.join(projectPath, dir), { recursive: true });
  }
};

// Generate project files
const generateFiles = async (projectPath, dbType) => {
  const templates = getBaseTemplates(dbType);

  // Generate base files
  for (const [filePath, content] of Object.entries(templates)) {
    await fs.promises.writeFile(
      path.join(projectPath, filePath),
      content.trim()
    );
  }

  // Generate database configuration if needed
  if (dbType !== 'none' && dbConfigs[dbType].databaseFile) {
    await fs.promises.mkdir(path.join(projectPath, 'src/infrastructure/database'), { recursive: true });
    await fs.promises.writeFile(
      path.join(projectPath, 'src/infrastructure/database/index.js'),
      dbConfigs[dbType].databaseFile.trim()
    );
  }
};

// Main function
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import gradient from 'gradient-string';

const main = async () => {
  try {
    const gradient = await import('gradient-string');
    // Title display with gradient
    console.log('\n');

    const title = gradient.pastel.multiline(boxen(
  '🚀 Express Clean Architecture Generator 🚀\n' +
  '      Building Modern Node.js Apps       \n' +
  '         Created by (Afauzi)             ',
  {
    padding: 1,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'cyan'
  }
));
    console.log(title);

    // Get project name with styled prompt
    const projectName = await askQuestion(
      chalk.cyan('📂 Project name: ')
    );
    if (!projectName) throw new Error('Project name is required');

    const projectPath = path.join(process.cwd(), projectName);
    if (fs.existsSync(projectPath)) {
      throw new Error(chalk.red('🚫 Directory already exists'));
    }

    // Database selection with styled menu
    console.log('\n' + chalk.cyan('─'.repeat(50)));
    console.log(chalk.yellowBright('🔧 Select your database engine:'));
    console.log(chalk.cyan('─'.repeat(50)));
    console.log(chalk.green('1. 🐘 PostgreSQL - Robust relational database'));
    console.log(chalk.green('2. 🍃 MongoDB   - Flexible NoSQL database'));
    console.log(chalk.green('3. ❌ None      - No database setup'));
    console.log(chalk.cyan('─'.repeat(50)));

    const dbChoice = await askQuestion(
      chalk.cyan('💡 Enter your choice (1-3): ')
    );
    const dbMap = { '1': 'postgres', '2': 'mongodb', '3': 'none' };
    const selectedDb = dbMap[dbChoice];

    if (!selectedDb) {
      throw new Error(chalk.red('🚫 Invalid database choice'));
    }

    // Create project structure with spinner
    const structureSpinner = ora({
      text: '🏗️  Creating project structure...',
      color: 'yellow'
    }).start();
    await fs.promises.mkdir(projectPath);
    process.chdir(projectPath);
    structureSpinner.succeed(chalk.green('🎉 Project structure created!'));

    // Initialize npm project
    execSync('npm init -y', { stdio: 'ignore' });

    // Install dependencies with progress
    const depsSpinner = ora({
      text: '📦 Installing dependencies...',
      color: 'yellow'
    }).start();

    const baseDeps = [
      'express',
      'cors',
      'helmet',
      'dotenv',
      'winston',
      'jsonwebtoken'
    ];

    const devDeps = [
      'nodemon',
      'jest',
      'supertest',
      'eslint',
      'prettier'
    ];

    // Add database-specific dependencies
    if (dbConfigs[selectedDb].dependencies) {
      baseDeps.push(...dbConfigs[selectedDb].dependencies);
    }
    if (dbConfigs[selectedDb].devDependencies) {
      devDeps.push(...dbConfigs[selectedDb].devDependencies);
    }

    execSync(`npm i ${baseDeps.join(' ')}`, { stdio: 'ignore' });
    depsSpinner.succeed(chalk.green('✨ Dependencies installed!'));

    const devDepsSpinner = ora({
      text: '🛠️  Installing dev dependencies...',
      color: 'yellow'
    }).start();
    execSync(`npm i -D ${devDeps.join(' ')}`, { stdio: 'ignore' });
    devDepsSpinner.succeed(chalk.green('🎯 Dev dependencies installed!'));

    // Create project files with spinner
    const filesSpinner = ora({
      text: '📝 Generating project files...',
      color: 'yellow'
    }).start();
    await createProjectStructure(projectPath, selectedDb);
    await generateFiles(projectPath, selectedDb);
    filesSpinner.succeed(chalk.green('📚 Project files generated!'));

    // Update package.json
    const packageJson = JSON.parse(
      await fs.promises.readFile(path.join(projectPath, 'package.json'))
    );

    packageJson.scripts = {
      start: 'node src/server.js',
      dev: 'nodemon src/server.js',
      test: 'jest',
      lint: 'eslint .',
      format: 'prettier --write "src/**/*.js"'
    };

    await fs.promises.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Success message with styled box
    console.log('\n');
    console.log(boxen(
      chalk.greenBright('🎊 Project created successfully! 🎊\n\n') +
      chalk.yellowBright('Next steps:\n') +
      chalk.cyan(`1. cd ${projectName}\n`) +
      chalk.cyan('2. Update .env with your configuration\n') +
      chalk.cyan('3. npm run dev\n\n') +
      chalk.magentaBright('🚀 Happy coding! May the code be with you 🌟'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));

  } catch (error) {
    console.error('\n' + boxen(
      chalk.red('❌ Error: ') + chalk.redBright(error.message),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'red'
      }
    ));
    await main()
    //process.exit(1);
  } finally {
    rl.close();
  }
};

main();