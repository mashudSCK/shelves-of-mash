import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
assert.ok(fs.existsSync('lib/site.ts'),'Missing shared canonical URL helper');
const source=ts.transpileModule(fs.readFileSync('lib/site.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
function load(env={}) {const exports={};vm.runInNewContext(source,{exports,URL,process:{env}});return exports.siteUrl;}
assert.equal(load()('/writing/test'),'https://shelves-of-mash.vercel.app/writing/test');
assert.equal(load({NEXT_PUBLIC_SITE_URL:'https://example.com/'})('/sitemap.xml'),'https://example.com/sitemap.xml');
assert.equal(load({VERCEL_PROJECT_PRODUCTION_URL:'example.vercel.app'})(), 'https://example.vercel.app');
assert.throws(()=>load({NEXT_PUBLIC_SITE_URL:'javascript:alert(1)'})());
assert.throws(()=>load({NEXT_PUBLIC_SITE_URL:'https://user:secret@example.com'})());
assert.throws(()=>load()('//example.com'));
assert.throws(()=>load()('/\\example.com'));
assert.throws(()=>load()('/\t/example.com'));
console.log('PASS: shared canonical URL defaults, configured origin, Vercel origin, invalid schemes/credentials/path escapes');
