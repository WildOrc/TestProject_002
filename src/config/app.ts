import { cleanEnv, str, num } from 'envalid';

export default cleanEnv(process.env, {
  PORT: num({ default: 3000 }),
  SERVER_URL: str({ default: '127.0.0.1' }),
});