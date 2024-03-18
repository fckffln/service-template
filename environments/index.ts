// @ts-ignore
import env from './env.json';

type Environment = {
    port: number;
    host: string;
    ssl?: boolean;
    mode: 'development' | 'production' | string;
    internalApi: string;
    publicApi: string;
    externalApi: string;
    secret: string;
}

export default {
    port: 3001,
    host: '0.0.0.0',
    ssl: false,
    mode: 'development',
    internalApi: '/internal',
    publicApi: '/api',
    externalApi: '/external',
    secret: 'input-your-secret-code',
    ...env,
} as Environment;
