import { build } from 'vite';
const result = await build({
  configFile:false, logLevel:'error',
  define:{__PUBLIC_ASSET_BASE_PATH__:JSON.stringify('')},
  build:{ssr:'tests/phase78.ts',write:false,minify:false,
    rollupOptions:{external:['node:assert/strict','node:fs/promises'],output:{format:'es',inlineDynamicImports:true}}},
});
const output=(Array.isArray(result)?result[0]:result).output;
const entry=output.find(item=>item.type==='chunk'&&item.isEntry);
if(!entry) throw new Error('Test bundle missing');
await import('data:text/javascript;base64,'+Buffer.from(entry.code).toString('base64'));
