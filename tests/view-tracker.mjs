import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync('components/writing/view-tracker.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const requests = [];
const storage = new Map();
let pending = Promise.resolve();
let sequence = 0;
const context = {
  exports: {},
  require: () => ({ useEffect: (effect) => effect() }),
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  },
  crypto: { randomUUID: () => `30000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}` },
  navigator: { locks: { request: (_name, action) => {
    pending = pending.then(action);
    return pending;
  } } },
  fetch: async (url, options) => requests.push({ url, ...JSON.parse(options.body) }),
};
vm.runInNewContext(source, context);
const mount = () => context.exports.ViewTracker({ writingId: 'writing' });
mount();
mount();
await pending;
assert.equal(requests[0].visitorId, requests[1].visitorId, 'Remounts retain browser identity');
assert.equal(sequence, 1, 'Concurrent first mounts generate only one identity');
storage.clear();
context.localStorage.setItem = () => { throw new Error('Storage denied'); };
mount();
await pending;
assert.equal(requests[2].visitorId, null, 'Failed persistence must not create a new counted identity');
context.navigator.locks = undefined;
mount();
await new Promise(resolve => setImmediate(resolve));
assert.equal(requests[3].visitorId, null, 'No lock support must not create unstable anonymous identities');
console.log('PASS: browser identity persists across mounts; unavailable storage sends no anonymous identity');
