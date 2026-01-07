import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface JWTPayload {
    userId: string;
    role: string;
    nosis: string;
}

export const generateToken = (payload: JWTPayload): string => {
    const secret = config.jwt.secret;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }

    // Convert expiresIn to seconds if needed, or use default
    const expiresInValue = config.jwt.expiresIn || '7d';

    return jwt.sign(payload, secret, {
        expiresIn: expiresInValue as jwt.SignOptions['expiresIn'],
    });
};

export const verifyToken = (token: string): JWTPayload | null => {
    try {
        const secret = config.jwt.secret;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }
        const decoded = jwt.verify(token, secret);
        return decoded as JWTPayload;
    } catch (error) {
        return null;
    }
};
