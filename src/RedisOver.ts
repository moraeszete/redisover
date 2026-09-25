import Redis, { RedisOptions } from "ioredis";

/**
 * A smart Redis client that lets multiple projects share a single Redis server.
 *
 * Every key is automatically namespaced with your app's `prefix`, values are
 * JSON-serialized/parsed transparently, and keys can even be plain objects.
 *
 * @example
 * ```typescript
 * const redis = new RedisOver({
 *   options: { host: 'localhost', port: 6379 },
 *   prefix: 'my-app', // keys become "my-app:<key>"
 * });
 *
 * await redis.set('user:123', { name: 'John' }, 60);
 * const user = await redis.get('user:123'); // { name: 'John' }
 * ```
 */
export class RedisOver {
  private client: Redis;
  private prefix?: string;
  private logging: boolean;

  /**
   * Creates a new RedisOver client and connects to Redis.
   *
   * @param config - Optional configuration object.
   * @param config.options - Standard ioredis connection options (`host`, `port`, `username`, `password`, `db`).
   * @param config.prefix - Namespace prepended to every key as `"<prefix>:<key>"`. Use a unique prefix per project to safely share one Redis server.
   * @param config.logging - Enables internal logging. Defaults to `false`.
   *
   * @example
   * ```typescript
   * const redis = new RedisOver({
   *   options: { host: '127.0.0.1', port: 6379 },
   *   prefix: 'auth-app',
   * });
   * ```
   */
  constructor(config?: RedisOverConstructor) {
    const raw = config?.options || {};
    
    const options: RedisOptions = {
      username: raw.username?.toString() || undefined,
      password: raw.password?.toString() || undefined,
      host: raw.host?.toString(),
      port: raw.port ? Number(raw.port) : 6379,
      db:  raw.db ? Number(raw.db) : 0,
    }
    // If a prefix is provided, set it as the key prefix for all operations
    // options like { host, port, password, db, etc.}
    this.client = new Redis(options);
    this.prefix = config?.prefix;
    this.logging = config?.logging ?? false ;
  }
  /**
   * Gracefully closes the connection to Redis.
   *
   * Call this when your app shuts down to release the connection.
   *
   * @example
   * ```typescript
   * await redis._close();
   * ```
   */
  async _close(): Promise<void> {
    await this.client.quit();
  }

  /**
   * Health check — verifies the connection to Redis is alive.
   *
   * @returns Resolves with `'PONG'` if Redis is reachable.
   *
   * @example
   * ```typescript
   * const pong = await redis._ping(); // 'PONG'
   * ```
   */
  async _ping(): Promise<string> {
    return this.client.ping();
  }

  /**
   * Builds the final Redis key: flattens object keys into `field_value`
   * segments and prepends the configured prefix.
   */
  private prefixKey(keys:string | object): any{
    if(typeof keys === 'object'){
      keys = Object.entries(keys).map(([key, value]) => `${key}_${value}`).join(':')
    }
    const fullKey = this.prefix ? `${this.prefix}:${keys}` : keys;
    return fullKey
  }

  /**
   * Stores a value in Redis, automatically serialized to JSON.
   *
   * The key is namespaced with your prefix. If the key is an object, it is
   * flattened into `field_value` segments (e.g. `{ type: 'user', id: 1 }`
   * becomes `"type_user:id_1"`).
   *
   * @param key - A string key, or a plain object to be flattened into a key.
   * @param value - Any JSON-serializable value (object, array, string, number...).
   * @param ttl - Optional time-to-live in seconds. Omit for no expiration.
   * @returns `'OK'` on success, or `null` if the key could not be set.
   *
   * @example
   * ```typescript
   * await redis.set('user:123', { name: 'John' }, 60); // expires in 60s
   * await redis.set({ type: 'user', id: 123 }, { name: 'Jane' }); // object key
   * ```
   */
  async set(key:string | object, value: any, ttl?: number): Promise<string | null>{
    const finalKey = await this.prefixKey(key);
    let result;
    if(ttl) {
      result = await this.client.set(finalKey, JSON.stringify(value), 'EX', ttl, 'NX');
      if(result === 'OK') return result
      // If the key already exists, update the value without changing the TTL
    }
    result = await this.client.set(finalKey, JSON.stringify(value), 'NX');
    if(result === 'OK') return result
    console.error(`[RedisOver] Failed to set key: ${finalKey}`);
    return null
  }
  
  /**
   * Retrieves a value from Redis, automatically parsed from JSON.
   *
   * @param key - A string key, or a plain object (flattened the same way as in `set`).
   * @returns The parsed value (object, array, etc.), or `null` if the key does not exist or parsing fails.
   *
   * @example
   * ```typescript
   * const user = await redis.get('user:123'); // { name: 'John' } or null
   * ```
   */
  async get(key:string | object): Promise<any> {
    const finalKey = await this.prefixKey(key);
    try {
      let result = await this.client.get(finalKey);
      return result ? JSON.parse(result) : null
    } catch (er){
      console.error(`[RedisOver] Failed to parse JSON for key: ${finalKey}`, er);
      return null
    }
  }

  /**
   * Smart get-or-set in a single call.
   *
   * Checks Redis for the key first: if it exists, returns the cached value
   * (`created: false`). If it doesn't, stores your `value` via `set()` — so
   * object keys are flattened and the value is JSON-serialized exactly like a
   * direct `set()` call — and returns it (`created: true`).
   *
   * @param keys - A string key, or a plain object (flattened the same way as in `set`).
   * @param value - A JSON string to store if the key does not exist yet.
   * @param ttl - Optional time-to-live in seconds, applied only when the value is created.
   * @returns `{ created, key, value }` — `created` tells you whether the value was just stored or already existed. Returns `null` on parsing errors.
   *
   * @example
   * ```typescript
   * const result = await redis.parse('report', JSON.stringify({ total: 42 }), 3600);
   * if (result?.created) console.log('cached now:', result.value);
   * else console.log('already cached:', result?.value);
   * ```
   */
  async parse(keys:string | object, value: any, ttl?: number): Promise<parseType> {
    const finalkey = await this.prefixKey(keys);
    let result;
    try {
      result = await this.client.get(finalkey);
      if(result === null) {
        result = await this.set(keys, value, ttl ? ttl : undefined);
        return {created: true, key: finalkey, value: JSON.parse(value)};
      }
      return {created: false, key: finalkey, value: JSON.parse(result)};
    } catch (er) {
      console.error(`[RedisOver] Failed to parse JSON for key: ${finalkey}`, er);
      return null;
    }
  }
}
