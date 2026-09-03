import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const clientDir = path.join(projectRoot, 'dist', 'client');
const publicDir = path.join(projectRoot, 'public');
const outputDir = path.join(projectRoot, 'out');
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/').at(-1);

if (!repositoryName) {
  throw new Error('GITHUB_REPOSITORY is required to prepare GitHub Pages.');
}

const basePath = `/${repositoryName}`;
const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.rsc',
  '.txt',
]);

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function copyDirectoryContents(source, destination, excludedName) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name === excludedName) continue;
    await cp(
      path.join(source, entry.name),
      path.join(destination, entry.name),
      {
        recursive: true,
        force: true,
      },
    );
  }
}

async function listFiles(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(
        ...(await listFiles(path.join(directory, entry.name), relativePath)),
      );
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const publicAssetPaths = (await listFiles(publicDir))
  .map((file) => `/${file}`)
  .sort((left, right) => right.length - left.length);

await rm(outputDir, { recursive: true, force: true });
await copyDirectoryContents(clientDir, outputDir, repositoryName);

const prefixedClientDir = path.join(clientDir, repositoryName);
if (await exists(prefixedClientDir)) {
  await copyDirectoryContents(prefixedClientDir, outputDir);
}

for (const relativeFile of await listFiles(outputDir)) {
  if (!textExtensions.has(path.extname(relativeFile))) continue;
  const filePath = path.join(outputDir, ...relativeFile.split('/'));
  let content = await readFile(filePath, 'utf8');

  for (const assetPath of publicAssetPaths) {
    const unprefixedAsset = new RegExp(
      `(?<!${escapeRegExp(basePath)})${escapeRegExp(assetPath)}`,
      'g',
    );
    content = content.replace(unprefixedAsset, `${basePath}${assetPath}`);
  }

  await writeFile(filePath, content);
}

await writeFile(path.join(outputDir, '.nojekyll'), '');

if (!(await exists(path.join(outputDir, 'index.html')))) {
  throw new Error('Prepared Pages artifact is missing index.html.');
}

const remainingBadReferences = [];
for (const relativeFile of await listFiles(outputDir)) {
  if (!textExtensions.has(path.extname(relativeFile))) continue;
  const filePath = path.join(outputDir, ...relativeFile.split('/'));
  const content = await readFile(filePath, 'utf8');
  for (const assetPath of publicAssetPaths) {
    const unprefixedAsset = new RegExp(
      `(?<!${escapeRegExp(basePath)})${escapeRegExp(assetPath)}`,
    );
    if (unprefixedAsset.test(content)) {
      remainingBadReferences.push(`${relativeFile}: ${assetPath}`);
    }
  }
}

if (remainingBadReferences.length > 0) {
  throw new Error(
    `Unprefixed public assets remain:\n${remainingBadReferences.join('\n')}`,
  );
}

console.log(
  `Prepared GitHub Pages artifact with ${publicAssetPaths.length} public assets at ${basePath}.`,
);
