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

export default dbConfigs;