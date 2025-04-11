class RedisExtended {
    private redis: any;
    private namespace: string;
    private loggingEnabled: boolean;

    constructor(redisClient: any, namespace: string = '', loggingEnabled: boolean = false) {
        this.redis = redisClient;
        this.namespace = namespace;
        this.loggingEnabled = loggingEnabled;
    }

    private logCommand(command: string, args: any[]) {
        if (this.loggingEnabled) {
            console.log(`Executing command: ${command}`, args);
        }
    }

    private namespacedKey(key: string): string {
        return this.namespace ? `${this.namespace}:${key}` : key;
    }

    async set(key: string, value: any): Promise<string> {
        this.logCommand('set', [key, value]);
        return await this.redis.set(this.namespacedKey(key), value);
    }

    async get(key: string): Promise<string | null> {
        this.logCommand('get', [key]);
        return await this.redis.get(this.namespacedKey(key));
    }

    async del(key: string): Promise<number> {
        this.logCommand('del', [key]);
        return await this.redis.del(this.namespacedKey(key));
    }

    async exists(key: string): Promise<number> {
        this.logCommand('exists', [key]);
        return await this.redis.exists(this.namespacedKey(key));
    }

    async ttl(key: string): Promise<number> {
        this.logCommand('ttl', [key]);
        return await this.redis.ttl(this.namespacedKey(key));
    }

    async expire(key: string, seconds: number): Promise<boolean> {
        this.logCommand('expire', [key, seconds]);
        return await this.redis.expire(this.namespacedKey(key), seconds);
    }

    async setJSON(key: string, value: any): Promise<string> {
        this.logCommand('setJSON', [key, value]);
        return await this.set(key, JSON.stringify(value));
    }

    async getJSON(key: string): Promise<any | null> {
        this.logCommand('getJSON', [key]);
        const value = await this.get(key);
        return value ? JSON.parse(value) : null;
    }
}