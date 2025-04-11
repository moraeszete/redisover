declare global {
  type RedisConfig = {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  }
}

export {};

// export interface KeyValue {
//   key: string;
//   value: string | object;
// }

// export interface RedisCommandResponse {
//   success: boolean;
//   data?: any;
//   error?: string;
// }

// export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };