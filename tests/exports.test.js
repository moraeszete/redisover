const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = () => {
  const RedisOver = require('redisover');
  assert.strictEqual(typeof RedisOver, 'function', 'direct CommonJS constructor');
  assert.strictEqual(RedisOver.RedisOver, RedisOver, 'named CommonJS export');
  assert.strictEqual(RedisOver.default, RedisOver, 'default CommonJS export');

  const root = path.resolve(__dirname, '..');
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert';
    import Default, { RedisOver } from 'redisover';
    assert.strictEqual(typeof Default, 'function');
    assert.strictEqual(RedisOver, Default);
  `], { cwd: root, stdio: 'pipe', timeout: 10000 });

  // Compile and execute a consumer outside this package's tsconfig.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'redisover-exports-'));
  try {
    fs.mkdirSync(path.join(dir, 'node_modules'));
    fs.symlinkSync(root, path.join(dir, 'node_modules/redisover'), 'junction');
    fs.copyFileSync(path.join(__dirname, 'fixtures/imports.ts'), path.join(dir, 'imports.ts'));
    execFileSync(process.execPath, [
      path.join(path.dirname(require.resolve('typescript/package.json')), 'bin/tsc'),
      path.join(dir, 'imports.ts'),
      '--outDir', dir, '--rootDir', dir,
      '--module', 'NodeNext', '--moduleResolution', 'NodeNext',
      '--target', 'ES2019', '--skipLibCheck', '--esModuleInterop', 'true',
      '--typeRoots', path.join(root, 'node_modules/@types'),
    ], { cwd: dir, stdio: 'pipe', encoding: 'utf8', timeout: 30000 });
    execFileSync(process.execPath, [path.join(dir, 'imports.js')], {
      cwd: dir, stdio: 'pipe', timeout: 10000,
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
