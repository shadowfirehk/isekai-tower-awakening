import { build } from 'vite';
const result = await build({
  configFile: false,
  logLevel: 'error',
  build: {
    ssr: 'tests/wwi.ts',
    write: false,
    minify: false,
    rolldownOptions: {
      external: ['node:assert/strict', 'node:fs/promises'],
      output: { format: 'es', codeSplitting: false },
    },
  },
});
const output = (Array.isArray(result) ? result[0] : result).output;
const entry = output.find((item) => item.type === 'chunk' && item.isEntry);
try {
  await import(
    'data:text/javascript;base64,' + Buffer.from(entry.code).toString('base64')
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
