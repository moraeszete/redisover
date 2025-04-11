# redisover

## Overview
`redisover` is a TypeScript package that extends the native Redis experience by providing advanced capabilities. It encapsulates Redis functionalities in a class-based structure, making it easier to interact with Redis while adding additional features such as JSON support, key namespacing, and TTL management.

## Installation
To install the `redisover` package, you can use npm:

```bash
npm install redisover
```

## Usage
Here is a basic example of how to use the `RedisExtended` class:

```typescript
import { RedisExtended } from 'redisover';

const redis = new RedisExtended({
  host: 'localhost',
  port: 6379,
});

// Set a value
await redis.set('key', 'value');

// Get a value
const value = await redis.get('key');
console.log(value); // Output: value

// Set a JSON object
await redis.setJSON('user:1', { name: 'John Doe', age: 30 });

// Get a JSON object
const user = await redis.getJSON('user:1');
console.log(user); // Output: { name: 'John Doe', age: 30 }
```

## Features
- Basic Redis commands: `get`, `set`, `del`, `exists`, `ttl`, `expire`
- JSON support with `getJSON` and `setJSON` methods
- Key namespacing for better organization
- TTL support for automatic expiration of keys
- Optional logging hooks for command tracing

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the ISC License.