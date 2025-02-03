import { execSync } from 'child_process';

const installDependencies = (baseDeps, devDeps) => {
  execSync(`npm i ${baseDeps.join(' ')}`, { stdio: 'ignore' });
  execSync(`npm i -D ${devDeps.join(' ')}`, { stdio: 'ignore' });
};

export default installDependencies;