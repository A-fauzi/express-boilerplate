import fs from 'fs';
import path from 'path';

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


export default createProjectStructure;