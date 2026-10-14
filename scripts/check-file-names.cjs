const fs = require('node:fs');
const path = require('node:path');

const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const componentName = /^[A-Z][A-Za-z0-9]*$/;
const hookName = /^use[A-Z][A-Za-z0-9]*$/;
const routeParameter = /^\[[a-z][A-Za-z0-9]*\]$/;
const failures = [];

function checkDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!kebabCase.test(entry.name) && !routeParameter.test(entry.name)) failures.push(entryPath);
      checkDirectory(entryPath);
      continue;
    }
    if (!entry.isFile()) continue;

    const extension = path.extname(entry.name);
    let stem = entry.name.slice(0, -extension.length);
    if (extension === '.css' && stem.endsWith('.module')) stem = stem.slice(0, -'.module'.length);
    if (extension === '.ts' && stem.endsWith('.d')) stem = stem.slice(0, -'.d'.length);

    const parts = entryPath.split(path.sep);
    const isComponent = ['components', 'page-components', 'popups', 'providers'].includes(parts[1]) && ['.tsx', '.jsx'].includes(extension) && stem !== 'index';
    const isHook = parts[1] === 'hooks' && hookName.test(stem);
    const valid = isComponent ? componentName.test(stem) : isHook || kebabCase.test(stem);
    if (!valid) failures.push(entryPath);
  }
}

for (const directory of ['src', 'scripts', 'build-deb']) checkDirectory(directory);

if (failures.length) {
  process.stderr.write(`Invalid source paths:\n${failures.join('\n')}\n`);
  process.exitCode = 1;
}
