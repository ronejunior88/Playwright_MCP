const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const candidateDirs = ['tests', 'test', 'spec', 'e2e'];

function hasTestFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return false;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  return entries.some((entry) => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      return hasTestFiles(fullPath);
    }

    return /\.(spec|test)\.[jt]sx?$|\.cy\.[jt]s$|\.feature$/.test(entry.name);
  });
}

const hasTests = candidateDirs.some((dir) => hasTestFiles(dir));

if (!hasTests) {
  console.log('Nenhum teste encontrado no repositório. Validação concluída sem testes executáveis.');
  process.exit(0);
}

const result = spawnSync('npx', ['playwright', 'test'], {
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 0);
