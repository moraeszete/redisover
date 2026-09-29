import { RedisOptions } from 'ioredis';

declare global {
  type RedisConfig = {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  }
  type RedisOverConstructor = {
    options?: RedisOptions;
    prefix?: string;
    logging?: boolean;
  }
  type SafeParse = {
    ok: boolean; 
    value: any 
  }
}

export {};