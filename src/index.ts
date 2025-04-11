import { Redis } from 'ioredis';
import { RedisExtendedOptions } from './types';

export class RedisExtended {
    private redis: Redis;
    private namespace: string;
    private loggingEnabled: boolean;

    constructor(options: RedisExtendedOptions) {
        this.redis = new Redis(options.redisOptions);
        this.namespace = options.namespace || '';
        this.loggingEnabled = options.loggingEnabled || false;
    }

    private logCommand(command: string, args: any[]) {
        if (this.loggingEnabled) {
            console.log(`Executing command: ${command}`, args);
        }
    }

    private namespacedKey(key: string): string {
        return this.namespace ? `${this.namespace}:${key}` : key;
    }

    async set(key: string, value: any): Promise<'OK'> {
        this.logCommand('set', [key, value]);
        return this.redis.set(this.namespacedKey(key), value);
    }

    async get(key: string): Promise<string | null> {
        this.logCommand('get', [key]);
        return this.redis.get(this.namespacedKey(key));
    }

    async del(key: string): Promise<number> {
        this.logCommand('del', [key]);
        return this.redis.del(this.namespacedKey(key));
    }

    async exists(key: string): Promise<number> {
        this.logCommand('exists', [key]);
        return this.redis.exists(this.namespacedKey(key));
    }

    async ttl(key: string): Promise<number> {
        this.logCommand('ttl', [key]);
        return this.redis.ttl(this.namespacedKey(key));
    }

    async expire(key: string, seconds: number): Promise<boolean> {
        this.logCommand('expire', [key, seconds]);
        return this.redis.expire(this.namespacedKey(key), seconds);
    }

    async setJSON(key: string, value: any): Promise<'OK'> {
        return this.set(key, JSON.stringify(value));
    }

    async getJSON<T>(key: string): Promise<T | null> {
        const result = await this.get(key);
        return result ? JSON.parse(result) : null;
    }
}