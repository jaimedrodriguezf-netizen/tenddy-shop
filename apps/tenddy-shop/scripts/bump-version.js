const fs = require('fs');
const { execSync } = require('child_process');

// 1. Leer package.json dinámicamente
const pkgPath = 'package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// 2. Incrementar versión patch (SemVer: major.minor.patch)
const parts = (pkg.version || '1.0.0').split('.');
const major = parseInt(parts[0] || '1', 10);
const minor = parseInt(parts[1] || '0', 10);
const patch = parseInt(parts[2] || '0', 10) + 1;

const newVersion = `${major}.${minor}.${patch}`;
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// 3. Ejecutar generate-version.js para sincronizar src/lib/version.json
execSync('node scripts/generate-version.js', { stdio: 'inherit' });

console.log(`🚀 Versión incrementada con éxito a: v${newVersion}`);
