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

  private prefixKey(keys:string | object): any{
    if(typeof keys === 'object'){
      keys = Object.entries(keys).map(([key, value]) => `${key}_${value}`).join(':')
    }
    const fullKey = this.prefix ? `${this.prefix}:${keys}` : keys;
    return fullKey
  }

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

  async get(key:string | object): Promise<string | null> {
    const finalKey = await this.prefixKey(key);
    try {
      let result = await this.client.get(finalKey);
      return result ? JSON.parse(result) : null
    } catch (er){
      console.error(`[RedisOver] Failed to parse JSON for key: ${finalKey}`, er);
      return null
    }
  }
}
