const fs = require('fs');

// Leer versión base dinámicamente desde package.json
let baseVersion = '1.0.0';
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (pkg.version) baseVersion = pkg.version;
} catch (err) {
  // Mantener fallback
}

// Versión limpia: solo v1.0.3
const fullVersion = `v${baseVersion}`;

const versionInfo = {
  version: fullVersion,
  baseVersion,
  builtAt: new Date().toISOString(),
};

fs.writeFileSync(
  'src/lib/version.json',
  JSON.stringify(versionInfo, null, 2)
);

console.log('Versión generada:', fullVersion);
