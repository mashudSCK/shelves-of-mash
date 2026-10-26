import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, imports = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(source, { exports, URL, require: name => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  } });
  return exports;
}
const helper = fs.existsSync('lib/auth/local-destination.ts') ? load('lib/auth/local-destination.ts') : {};
const { GET } = load('app/auth/callback/route.ts', {
  'next/server': { NextResponse: { redirect: url => ({ url: new URL(url).href }) } },
  '@/lib/supabase/server': { createClient: async () => ({ auth: { exchangeCodeForSession: async () => ({ error: null }) } }) },
  '@/lib/auth/local-destination': helper,
});
for (const next of ['//outside.invalid', '/\\outside.invalid', '/\t/outside.invalid', 'https://outside.invalid', '/%5coutside.invalid', '/%2foutside.invalid', '/a/..//outside.invalid']) {
  const response = await GET(new Request(`https://archive.invalid/auth/callback?code=fixture&next=${encodeURIComponent(next)}`));
  assert.equal(response.url, 'https://archive.invalid/', `Reject unsafe destination ${JSON.stringify(next)}`);
}
for (const next of ['/account', '/archive?shelf=essays&page=2', '/writing/a#section']) {
  const response = await GET(new Request(`https://archive.invalid/auth/callback?code=fixture&next=${encodeURIComponent(next)}`));
  assert.equal(response.url, `https://archive.invalid${next}`);
}
console.log('PASS: callback rejects cross-origin, backslash, control and encoded escape destinations; preserves local paths/query/fragment');
