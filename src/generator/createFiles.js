import fs from 'fs';
import path from 'path';
import getBaseTemplates from './templates.js';
import dbConfigs from './dbConfig.js';

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

export default generateFiles;