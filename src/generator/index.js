#!/usr/bin/env node

import fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { execSync } from 'child_process';
import dbConfigs from './dbConfig.js';
import { askQuestion, rl} from './askQuestion.js';
import createProjectStructure from './createDirectories.js';
import generateFiles from './createFiles.js';
import installDependencies from './installDependencies.js';
import path from 'path';  // Add the path module

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
      chalk.cyan('2. cp .env.example .env\n') +
      chalk.cyan('3. update .env with your configuration\n') +
      chalk.cyan('4. npm run dev\n\n') +
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
    process.exit(1);
  } finally {
    rl.close();
  }
};

main();