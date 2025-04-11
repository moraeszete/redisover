import Redis, { RedisOptions } from "ioredis";
//const redis = new RedisOver({ host: '127.0.0.1', port: 6379 }, 'myApp');

export class RedisOver {
  private client: Redis;
  private prefix?: string;
  
  constructor(options?: RedisConfig, prefix?: string) {
    // If a prefix is provided, set it as the key prefix for all operations
    // options like { host, port, password, db, etc.}
    this.client = new Redis(options);
    this.prefix = prefix;
  }

}