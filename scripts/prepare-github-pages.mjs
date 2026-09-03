import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
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

const publicAssetPaths = (await listFiles(publicDir))
  .map((file) => `/${file}`)
  .sort((left, right) => right.length - left.length);

await rm(outputDir, { recursive: true, force: true });
await copyDirectoryContents(clientDir, outputDir, repositoryName);

const prefixedClientDir = path.join(clientDir, repositoryName);
if (await exists(prefixedClientDir)) {
  await copyDirectoryContents(prefixedClientDir, outputDir);
}

await writeFile(path.join(outputDir, '.nojekyll'), '');

if (!(await exists(path.join(outputDir, 'index.html')))) {
  throw new Error('Prepared Pages artifact is missing index.html.');
}

const missingAssets = [];
for (const assetPath of publicAssetPaths) {
  const outputAsset = path.join(outputDir, ...assetPath.slice(1).split('/'));
  if (!(await exists(outputAsset))) missingAssets.push(assetPath);
}

if (missingAssets.length > 0) {
  throw new Error(
    `Prepared Pages artifact is missing:\n${missingAssets.join('\n')}`,
  );
}

console.log(
  `Prepared GitHub Pages artifact with ${publicAssetPaths.length} public assets at ${basePath}.`,
);
