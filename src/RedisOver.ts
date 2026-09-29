import Redis, { RedisOptions } from "ioredis";
//const redis = new RedisOver({ host: '127.0.0.1', port: 6379 }, 'myApp');

export class RedisOver {
  private client: Redis;
  private prefix?: string;
  private logging: boolean;

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

  async _close(): Promise<void> {
    await this.client.quit();
  }

  async _ping(): Promise<string> {
    return this.client.ping();
  }

  private prefixKey(keys:string | object): any{
    if(typeof keys === 'object'){
      keys = Object.entries(keys).map(([key, value]) => `${key}_${value}`).join(':')
    }
    const fullKey = this.prefix ? `${this.prefix}:${keys}` : keys;
    return fullKey
  }

  /**
   * Safely validates and parses a raw Redis string with `JSON.parse`.
   *
   * @returns `{ ok: true, value }` when parseable, `{ ok: false, value: null }` otherwise.
   */
  private safeParse(raw: string): SafeParse {
    try {
      return { ok: true, value: JSON.parse(raw) };
    } catch {
      return { ok: false, value: null };
    }
  }

  /**
   * Stores a JSON-serialized value in Redis. **Overwrites existing keys by default.**
   *
   * Set `onlyIfNew: true` to only write when the key does not exist yet (Redis `NX`). If `false` or omitted, the key value is overwritten.
   *
   * @param key - A string key, or a plain object flattened into `field_value` segments.
   * @param value - Any JSON-serializable value.
   * @param ttl - Optional time-to-live in seconds. Omit for no expiration.
   * @param onlyIfNew - Defaults to `false`.
   * @returns `'OK'` on success, or `null` if the write was skipped (`onlyIfNew` and key exists) or failed.
   *
   */
  async set(key:string | object, value: any, ttl?: number, onlyIfNew: boolean = false): Promise<string | null>{
    const finalKey = this.prefixKey(key);
    const payload = JSON.stringify(value);
    let result: string | null;

    if (ttl && onlyIfNew) {
      result = await this.client.set(finalKey, payload, 'EX', ttl, 'NX');
    } else if (ttl) {
      result = await this.client.set(finalKey, payload, 'EX', ttl);
    } else if (onlyIfNew) {
      result = await this.client.set(finalKey, payload, 'NX');
    } else {
      result = await this.client.set(finalKey, payload);
    }

    if (result === 'OK') return result;
    if (this.logging) console.error(`[RedisOver] Set skipped or failed for key: ${finalKey}`);
    return null;
  }
  
  /**
   * Retrieves a value from Redis, validating it is JSON-parseable first.
   *
   * @typeParam T - Expected shape of the stored value (defaults to `any`).
   * @param key - A string key, or a plain object (flattened).
   * @returns The parsed value typed as `T`, or `null` if the key is missing or the stored value is not valid JSON.
   *
   */
  async get<T = any>(key:string | object): Promise<T | null> {
    const finalKey = this.prefixKey(key);
    const result = await this.client.get(finalKey);
    if (result === null) return null;

    const parsed = this.safeParse(result);
    if (!parsed.ok) {
      console.error(`[RedisOver] Cached value is not valid JSON for key: ${finalKey}`);
      return null;
    }
    return parsed.value;
  }

  /**
   * Checks Redis first and validates the cached value is JSON-parseable:
   * - **Hit (valid JSON)**: returns the cached value.
   * - **Hit (corrupt/unparseable)**: treated as a miss - value is overwritten.
   * - **Miss**: runs `fn()`, stores the result via (with optional TTL), and returns it.
   *
   * Errors thrown by `fn` propagate to the caller — nothing is cached in that case.
   *
   * @param key - A string key, or a plain object (flattened).
   * @param fn - Factory that produces the value on cache miss (e.g. an expensive DB query). Only executed when needed.
   * @param ttl - Optional time-to-live in seconds, applied only when the value is created.
   * @returns The cached value on hit, or the fresh value produced by `fn` on miss.
   *
   */
  async getOrSet<T = any>(key:string | object, fn: () => Promise<T> | T, ttl?: number): Promise<T> {
    const finalKey = this.prefixKey(key);
    const cached = await this.client.get(finalKey);

    if (cached !== null) {
      const parsed = this.safeParse(cached);
      if (parsed.ok) return parsed.value as T;

      // Corrupt value: treat as a miss — set() overwrites it below
      console.error(`[RedisOver] Cached value is not valid JSON for key: ${finalKey} — regenerating`);
    }

    const fresh = await fn(); // MISS: run the expensive factory
    await this.set(key, fresh, ttl);
    return fresh;
  }

  /**
   * 
   * @param key The key to delete from Redis.
   * @returns `true` if the key was deleted, `false` otherwise.
   */
  async deleteKey(key:string | object): Promise<boolean> {
    const finalKey = this.prefixKey(key);
    const result = await this.client.del(finalKey);
    return result > 0;
  }

  /**
   * 
   * @returns `true` if any keys were deleted, `false` otherwise.
   */
  async clear(): Promise<boolean> {
    const temp = await this.client.del(await this.client.keys(`${this.prefix}*`));
    if (temp > 0) return true
    return false
  }

  /**
   * @returns An array of all keys in Redis that match the current prefix.
   */
  async keys(): Promise<string[]> {
    return await this.client.keys(`${this.prefix}*`);
  }

  /**
   * 
   * @param key The key to check for existence in Redis.
   * @returns `true` if the key exists, `false` otherwise.
   */
  async exists(key:string | object): Promise<boolean> {
    const finalKey = this.prefixKey(key);
    const result = await this.client.exists(finalKey);
    return result > 0;
  }
}
