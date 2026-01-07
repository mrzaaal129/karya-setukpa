import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwt: {
        secret: process.env.JWT_SECRET || (isProduction ? undefined : 'dev-secret-key-change-in-production'),
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    cors: {
        // Support multiple origins separated by comma in production
        // e.g., CORS_ORIGIN=https://app.example.com,https://admin.example.com
        origin: process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
            : 'http://localhost:5173',
    },
    database: {
        url: process.env.DATABASE_URL,
    },
};

// ============================================
// Environment Validation
// ============================================
const requiredInProduction = ['JWT_SECRET', 'DATABASE_URL', 'CORS_ORIGIN'];
const requiredAlways = ['DATABASE_URL'];

// Validate required environment variables
const missingVars: string[] = [];

for (const envVar of requiredAlways) {
    if (!process.env[envVar]) {
        missingVars.push(envVar);
    }
}

if (isProduction) {
    for (const envVar of requiredInProduction) {
        if (!process.env[envVar] && !missingVars.includes(envVar)) {
            missingVars.push(envVar);
        }
    }
}

if (missingVars.length > 0) {
    throw new Error(
        `FATAL: Missing required environment variables: ${missingVars.join(', ')}\n` +
        `Please set these in your .env file or environment.`
    );
}

// Warn about insecure defaults in development
if (!isProduction && !process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: Using default JWT secret. Set JWT_SECRET in production!');
}
