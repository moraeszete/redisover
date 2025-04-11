import Redis, { RedisOptions } from "ioredis";
//const redis = new RedisOver({ host: '127.0.0.1', port: 6379 }, 'myApp');

type RedisOverConstructor = {
  options?: RedisOptions;
  prefix?: string;
  logging?: boolean;
}

export class RedisOver {
  private client: Redis;
  private prefix?: string;
  private logging?: boolean = false;
  
  constructor(config?: RedisOverConstructor) {
    // If a prefix is provided, set it as the key prefix for all operations
    // options like { host, port, password, db, etc.}
    this.client = new Redis(config?.options || {});
    this.prefix = config?.prefix;
    this.logging = config?.logging;
  }

  private prefixKey(keys:string | object): any{
    if(typeof keys === 'object'){
      keys = Object.entries(keys).map(([key, value]) => `${key}_${value}`).join(':')
    }
    const fullKey = this.prefix ? `${this.prefix}:${keys}` : keys;
    return fullKey
  }

  async set(key:string | object, value: any, ttl?: number): Promise<string | null>{
    const finalKey = this.prefixKey(key);
    let result;
    if(ttl) {
      result = await this.client.set(finalKey, JSON.stringify(value), 'EX', ttl, 'NX');
      if(result === 'OK') return result
      // If the key already exists, update the value without changing the TTL
    }
    result = await this.client.set(finalKey, JSON.stringify(value), 'NX');
    if(result === 'OK') return result
    throw new Error(`[RedisOver] Failed to set key: ${finalKey}`);
  }

}
