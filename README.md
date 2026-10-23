# RedisOver

[![npm version](https://badge.fury.io/js/redisover.svg)](https://www.npmjs.com/package/redisover)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**One Redis server for N projects** — with namespaced keys, JSON serialization, and cache helpers.

Simple, but powerful. Built on top of [ioredis](https://github.com/luin/ioredis).

## The idea

Redis has a single shared keyspace. If two apps use the same key (`user:123`), one overwrites the other.

RedisOver fixes that: give each project a `prefix`, and every key is automatically namespaced. All your projects can share one Redis server without ever colliding.

![One Redis, multiple apps](./assets/architecture.svg)

```typescript
const authRedis = new RedisOver({
  options: { host: 'localhost', port: 6379 },
  prefix: 'auth-app',
});

const billingRedis = new RedisOver({
  options: { host: 'localhost', port: 6379 },
  prefix: 'billing-app',
});

await authRedis.set('user:123', { role: 'admin' });
await billingRedis.set('user:123', { plan: 'pro' });

// Same Redis, zero conflicts:
// auth-app:user:123
// billing-app:user:123
```

## Install

```bash
npm install redisover
```

## Quick Start

```typescript
import { RedisOver } from 'redisover';

const redis = new RedisOver({
  options: { host: 'localhost', port: 6379 },
  prefix: 'my-app', // every key becomes "my-app:<key>"
});

// Smart set: values are serialized to JSON automatically
await redis.set('user:123', { name: 'John Doe', age: 30 }, 60); // TTL: 60s

// Smart get: values come back already parsed
const user = await redis.get('user:123'); // { name: 'John Doe', age: 30 }

await redis._close();
```

### Object keys? No problem

Keys don't have to be strings — pass an object and RedisOver flattens it for you:

```typescript
await redis.set({ type: 'user', id: 123 }, { name: 'Jane Doe' });
// stored as "my-app:type_user:id_123"

const jane = await redis.get({ type: 'user', id: 123 });
```

### Get-or-set in one call: `getOrSet()`

`getOrSet()` checks Redis first. On a cache hit, it returns the parsed value without running the factory. On a miss, it calls the factory, stores its result, and returns it:

```typescript
const report = await redis.getOrSet(
  'report',
  async () => ({ total: 42 }),
  3600, // optional TTL in seconds, applied when the value is created
);
```

If a cached value is not valid JSON, `getOrSet()` treats it as a miss and replaces it with the factory result. Errors thrown by the factory are passed to the caller and are not cached.

## API

Every method accepts keys as a `string` **or** a plain `object` (flattened into `field_value` segments).

| Method | What it does |
|---|---|
| `new RedisOver(config?)` | Connects to Redis. `config.options` accepts [ioredis connection options](https://github.com/luin/ioredis#connect-to-redis); `config.prefix` namespaces this instance's keys; `config.logging` enables a diagnostic when a `set()` is skipped |
| `set(key, value, ttl?, onlyIfNew?)` | JSON-serializes and stores a value; `ttl` is in seconds. Overwrites by default; pass `true` for `onlyIfNew` to use Redis `NX`. Returns `'OK'` or `null` if the write was skipped |
| `get<T>(key)` | Returns the JSON-parsed value (typed as `T`), or `null` if missing or invalid JSON |
| `getOrSet<T>(key, fn, ttl?)` | Returns a valid cached value, or calls `fn`, caches its result, and returns it. `fn` can be synchronous or asynchronous |
| `deleteKey(key)` | Deletes one key; returns `true` if it existed |
| `exists(key)` | Checks whether one key exists |
| `keys()` | Lists keys matching this instance's namespace |
| `clear()` | Deletes keys matching this instance's namespace using `SCAN`. Returns `true` if anything was deleted |
| `_ping()` | Health check — resolves `'PONG'` |
| `_close()` | Closes the connection gracefully |

`clear()` without a `prefix` matches `*` and deletes **all keys in the selected Redis database**. Use a prefix when sharing a database with other applications.

> Tip: hover any method in your editor — everything is documented with JSDoc, examples included.

## Requirements

- Node.js >= 14
- Redis >= 5

## Contributing

Issues and PRs are welcome on [GitHub](https://github.com/moraeszete/redisover).

## License

[MIT](LICENSE)

---

Made by [Lucas Moraes](https://github.com/moraeszete)
