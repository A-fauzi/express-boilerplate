<div align="center">

# Express Clean Architecture Generator

[![NPM Version](https://img.shields.io/npm/v/create-express-clean.svg)](https://www.npmjs.com/package/create-express-clean)
[![Downloads](https://img.shields.io/npm/dm/create-express-clean.svg)](https://www.npmjs.com/package/create-express-clean)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🚀 A powerful CLI tool for generating Express.js projects with Clean Architecture principles baked in.

[Features](#features) •
[Installation](#installation) •
[Quick Start](#quick-start) •
[Documentation](#documentation) •
[Contributing](#contributing)

<img src="/api/placeholder/800/400" alt="Express Clean Architecture Banner" />

</div>

---

## 🌟 Overview

Express Clean Architecture Generator is a CLI tool designed to streamline the process of creating robust Express.js applications. It implements Uncle Bob's Clean Architecture principles, providing a solid foundation for building scalable and maintainable Node.js applications.

## ✨ Features

### Architecture & Structure
- 🏗️ **Clean Architecture Implementation**
  - Domain-driven design approach
  - Clear separation of concerns
  - Modular and maintainable structure

### Database Integration
- 🐘 **PostgreSQL Support**
  - Built-in connection setup
  - Repository pattern implementation
  - Migration structure

- 🍃 **MongoDB Support**
  - Mongoose integration
  - Schema templates
  - Repository abstractions

### Developer Experience
- 🛠️ **Pre-configured Tools**
  - ESLint for code linting
  - Prettier for code formatting
  - Jest for testing
  - Nodemon for development

- 📝 **Documentation**
  - Comprehensive inline comments
  - API documentation setup
  - Swagger integration ready

## 🚀 Quick Start

### Installation

```bash
npx create-express-clean
```

### Interactive Setup

```bash
📂 Project name: your-project-name

──────────────────────────────────────────────────
🔧 Select your database engine:
──────────────────────────────────────────────────
1. 🐘 PostgreSQL - Robust relational database
2. 🍃 MongoDB   - Flexible NoSQL database
3. ❌ None      - No database setup
──────────────────────────────────────────────────
```

## 📁 Project Structure

```
src/
├── app.js                # Application setup
├── server.js             # Server entry point
│
├── application/          # Application business rules
│   ├── services/        # Application services
│   └── use-cases/       # Use case implementations
│
├── domain/              # Enterprise business rules
│   ├── entities/        # Business entities
│   ├── repositories/    # Repository interfaces
│   ├── services/        # Domain services
│   └── value-objects/   # Value objects
│
├── infrastructure/      # Frameworks & drivers
│   ├── logger/         # Logging implementation
│   └── security/       # Security configurations
│
└── interfaces/         # Interface adapters
    ├── controllers/    # Request handlers
    ├── middlewares/    # Express middlewares
    ├── routes/         # Route definitions
    └── validators/     # Input validation
```

## 🛠️ Getting Started

### 1. Create Your Project

```bash
npx create-express-clean
```

### 2. Navigate to Project Directory

```bash
cd your-project-name
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

### 4. Start Development Server

```bash
npm run dev
```

## ⚙️ Configuration

### PostgreSQL Configuration

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password
```

### MongoDB Configuration

```env
MONGODB_URI=mongodb://localhost:27017/your_database
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## 📚 Documentation

### Architecture Overview

Our implementation follows the Clean Architecture principles:

1. **Domain Layer**: Contains business logic and rules
2. **Application Layer**: Orchestrates the flow of data
3. **Infrastructure Layer**: Implements technical capabilities
4. **Interfaces Layer**: Handles external communications

### Database Setup

#### PostgreSQL Integration

```javascript
// Example repository implementation
class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User> {
    // Implementation
  }
}
```

#### MongoDB Integration

```javascript
// Example mongoose schema
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true }
});
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Created with ❤️ by Afauzi

<div align="center">

### Show your support

Give a ⭐️ if this project helped you!

<img src="/api/placeholder/800/100" alt="Footer Banner" />

</div>

---

<div align="center">

**Built with Clean Architecture principles** •
**Made for modern Node.js development** •
**Open for community contributions**

</div>