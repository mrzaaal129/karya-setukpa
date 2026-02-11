
import { supabase } from './src/config/storage';
import fs from 'fs';
import path from 'path';

async function testUpload() {
    console.log('Testing Local Storage Upload...');

    const fileName = `test-${Date.now()}.txt`;
    const fileBuffer = Buffer.from('Hello Local Storage!');

    try {
        const { data, error } = await supabase.storage.from('paper-uploads').upload(fileName, fileBuffer, {
            contentType: 'text/plain'
        });

        if (error) {
            console.error('❌ Upload Failed:', error);
            return;
        }

        console.log('✅ Upload Success:', data);

        // Verify file exists
        const uploadPath = path.join(process.cwd(), 'uploads', 'paper-uploads', fileName);
        if (fs.existsSync(uploadPath)) {
            console.log('✅ File written to disk:', uploadPath);
        } else {
            console.error('❌ File NOT found on disk at:', uploadPath);
        }

        // Test Public URL
        const { data: urlData } = supabase.storage.from('paper-uploads').getPublicUrl(fileName);
        console.log('🔗 Public URL:', urlData.publicUrl);

    } catch (err) {
        console.error('❌ Exception:', err);
    }
}

testUpload();
