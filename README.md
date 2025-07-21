# RedisOver

[![npm version](https://badge.fury.io/js/redisover.svg)](https://badge.fury.io/js/redisover)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

**RedisOver** is a powerful TypeScript package that extends the Redis experience with advanced capabilities built on top of [ioredis](https://github.com/luin/ioredis). It provides a clean, class-based interface that makes Redis operations more intuitive while adding features like automatic JSON serialization, key namespacing, and intelligent caching patterns.

### Why RedisOver?

- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Simple API**: Clean, intuitive methods that abstract Redis complexity
- **Auto JSON**: Automatic JSON serialization and deserialization
- **Namespacing**: Built-in key prefixing for better organization
- **TTL Management**: Intelligent TTL handling with smart caching
- **Performance**: Built on the robust ioredis library
- **Error Handling**: Graceful error handling with detailed logging

## Installation

Install RedisOver using your preferred package manager:

```bash
# npm
npm install redisover

# yarn
yarn add redisover

# pnpm
pnpm add redisover
```

## Quick Start

### Basic Usage

```typescript
import { RedisOver } from 'redisover';

// Initialize with default localhost connection
const redis = new RedisOver();

// Or with custom configuration
const redis = new RedisOver({
  options: {
    host: 'localhost',
    port: 6379,
    password: 'your-password',
    db: 0
  },
  prefix: 'myapp',  // All keys will be prefixed with 'myapp:'
  logging: true     // Enable operation logging
});

// Set and get values (automatically handles JSON)
await redis.set('user:123', { name: 'John Doe', age: 30 });
const user = await redis.get('user:123');
console.log(user); // { name: 'John Doe', age: 30 }

// Set with TTL (expires in 60 seconds)
await redis.set('session:abc123', { userId: 123 }, 60);

// Close connection when done
await redis._close();
```

### Object-based Keys

RedisOver supports object-based keys for complex key structures:

```typescript
// Using object as key
const userKey = { type: 'user', id: 123, section: 'profile' };
await redis.set(userKey, { name: 'Jane Doe', email: 'jane@example.com' });

// Retrieves with key: "myapp:type_user:id_123:section_profile"
const profile = await redis.get(userKey);
```

### Smart Caching with Parse

The `parse` method provides intelligent caching - it gets existing data or sets new data if it doesn't exist:

```typescript
// Will set the value if key doesn't exist, or return existing value
const result = await redis.parse('expensive-calculation', 
  JSON.stringify({ result: 42, timestamp: Date.now() }), 
  3600 // TTL: 1 hour
);

if (result.created) {
  console.log('New value was set:', result.value);
} else {
  console.log('Retrieved existing value:', result.value);
}
```

## API Reference

### Constructor

```typescript
new RedisOver(config?: RedisOverConstructor)
```

**Parameters:**
- `config.options`: [ioredis RedisOptions](https://github.com/luin/ioredis#connect-to-redis) - Redis connection configuration
- `config.prefix`: `string` - Prefix for all keys (optional)
- `config.logging`: `boolean` - Enable operation logging (default: false)

### Methods

#### `set(key, value, ttl?)`
Sets a value in Redis with optional TTL.

```typescript
await redis.set('mykey', { data: 'value' }, 300); // Expires in 5 minutes
```

**Parameters:**
- `key`: `string | object` - The key to set
- `value`: `any` - The value to store (automatically JSON serialized)
- `ttl`: `number` - Time to live in seconds (optional)

**Returns:** `Promise<string | null>` - 'OK' on success, null on failure

#### `get(key)`
Retrieves a value from Redis.

```typescript
const value = await redis.get('mykey');
```

**Parameters:**
- `key`: `string | object` - The key to retrieve

**Returns:** `Promise<any>` - The parsed value or null if not found

#### `parse(key, value, ttl?)`
Smart caching method that gets existing value or sets new value.

```typescript
const result = await redis.parse('cache-key', JSON.stringify(data), 3600);
```

**Parameters:**
- `key`: `string | object` - The key to check/set
- `value`: `any` - The value to set if key doesn't exist
- `ttl`: `number` - Time to live in seconds (optional)

**Returns:** `Promise<ParseResult>` - Object with `created`, `key`, and `value` properties

#### `_ping()`
Tests the Redis connection.

```typescript
const response = await redis._ping(); // Returns 'PONG'
```

#### `_close()`
Closes the Redis connection.

```typescript
await redis._close();
```

## Advanced Examples

### Session Management

```typescript
const sessionStore = new RedisOver({
  prefix: 'session',
  logging: true
});

// Create session
await sessionStore.set('user:123', {
  userId: 123,
  loginTime: new Date(),
  permissions: ['read', 'write']
}, 1800); // 30 minutes

// Check session
const session = await sessionStore.get('user:123');
if (session) {
  console.log(`User ${session.userId} is authenticated`);
}
```

### Caching API Responses

```typescript
const cache = new RedisOver({ prefix: 'api-cache' });

async function getCachedApiData(endpoint: string) {
  const cacheKey = { endpoint, version: 'v1' };
  
  // Try to get from cache first
  let data = await cache.get(cacheKey);
  
  if (!data) {
    // Fetch from API if not in cache
    data = await fetchFromApi(endpoint);
    
    // Cache for 5 minutes
    await cache.set(cacheKey, data, 300);
  }
  
  return data;
}
```

### Configuration Management

```typescript
const config = new RedisOver({ prefix: 'config' });

// Store configuration
await config.set('app-settings', {
  theme: 'dark',
  notifications: true,
  language: 'en'
});

// Retrieve configuration
const settings = await config.get('app-settings');
```

## Error Handling

RedisOver includes built-in error handling and logging:

```typescript
try {
  const redis = new RedisOver({ logging: true });
  await redis.set('test', 'value');
} catch (error) {
  console.error('Redis operation failed:', error);
}
```

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-username/redisover.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Requirements

- **Node.js**: >= 14.0.0
- **Redis**: >= 5.0.0
- **TypeScript**: >= 4.0.0 (for development)

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on top of the excellent [ioredis](https://github.com/luin/ioredis) library
- Inspired by the need for simpler Redis operations in TypeScript projects

---

**Made with care by [Lucas Moraes](https://github.com/lucas-moraes)**

*If you find this package useful, please consider giving it a star on GitHub!*