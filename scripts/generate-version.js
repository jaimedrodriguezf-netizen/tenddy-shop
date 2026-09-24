const fs = require('fs');
const { execSync } = require('child_process');

let branch = 'main';
let commit = 'unknown';

try {
  branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  commit = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  // Fallback si corre en entorno sin binario git
}

const isProduction = branch === 'main';
const baseVersion = '1.0.0';
const fullVersion = isProduction ? `v${baseVersion}` : `v${baseVersion}-dev.${commit}`;

const versionInfo = {
  version: fullVersion,
  baseVersion,
  branch,
  commit,
  environment: isProduction ? 'production' : 'development',
  builtAt: new Date().toISOString(),
};

fs.writeFileSync(
  'src/lib/version.json',
  JSON.stringify(versionInfo, null, 2)
);

console.log('Versión generada con éxito:', versionInfo);
