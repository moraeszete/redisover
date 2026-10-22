import * as assert from 'node:assert';
import RedisOverDefault, { RedisOver } from 'redisover';

assert.strictEqual(typeof RedisOverDefault, 'function');
assert.strictEqual(typeof RedisOver, 'function');
assert.strictEqual(RedisOver, RedisOverDefault);
