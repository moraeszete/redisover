import { RedisOptions } from 'ioredis';

declare global {
  type RedisConfig = {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  }
  /**
   * Constructor options for the RedisOver class.
   * 
   * @property prefix - Namespace prefix for all Redis keys managed by this instance.
   */
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