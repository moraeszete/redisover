import Redis from "ioredis";

export class RedisOver{
  private client: Redis;
  constructor(options?: Redis.RedisOptions) {
    this.client = new Redis(options);
  }

}