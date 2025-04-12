import { RedisOver as RedisOverClass } from './RedisOver';

// Export for ESM/TS users
export const RedisOver = RedisOverClass;
export default RedisOverClass;

// Export for CommonJS users
if (typeof module !== 'undefined') {
  module.exports = RedisOverClass;
}
 