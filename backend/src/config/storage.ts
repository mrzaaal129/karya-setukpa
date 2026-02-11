import fs from 'fs';
import path from 'path';

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let dbClient: any;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase URL or Key is missing. Storage functionality will use LOCAL FILESYSTEM.');

    // Ensure uploads root exists
    const uploadsRoot = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsRoot)) {
        fs.mkdirSync(uploadsRoot, { recursive: true });
    }

    // Mock client with local FS implementation
    dbClient = {
        storage: {
            from: (bucket: string) => ({
                upload: async (fileName: string, fileBuffer: Buffer, options: any) => {
                    try {
                        const bucketDir = path.join(uploadsRoot, bucket);
                        if (!fs.existsSync(bucketDir)) {
                            fs.mkdirSync(bucketDir, { recursive: true });
                        }

                        const filePath = path.join(bucketDir, fileName);
                        fs.writeFileSync(filePath, fileBuffer);

                        return { data: { path: fileName }, error: null };
                    } catch (err: any) {
                        console.error('Local Upload Error:', err);
                        return { data: null, error: err };
                    }
                },
                getPublicUrl: (fileName: string) => {
                    // Assuming server runs on port 3001 and serves /uploads
                    const port = process.env.PORT || 3001;
                    return {
                        data: {
                            publicUrl: `http://localhost:${port}/uploads/${bucket}/${fileName}`
                        }
                    };
                }
            })
        }
    };
} else {
    // ... existing initialization ...
    dbClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    });
}

export const supabase = dbClient;
