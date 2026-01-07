import { createNotification } from '../src/controllers/notificationController.js';
import prisma from '../src/config/database.js';

async function createSampleNotifications() {
    try {
        console.log('Creating sample notifications...');

        // Get a sample user (assuming there's at least one user)
        const users = await prisma.user.findMany({ take: 5 });

        if (users.length === 0) {
            console.log('No users found. Please create users first.');
            return;
        }

        for (const user of users) {
            // Create a welcome notification
            await createNotification(
                user.id,
                'SYSTEM',
                'Selamat Datang!',
                'Sistem notifikasi telah aktif. Anda akan menerima update langsung di sini.',
                null
            );

            // Create an assignment notification
            await createNotification(
                user.id,
                'ASSIGNMENT',
                'Tugas Baru Tersedia',
                'Tugas "Makalah Semester Ganjil" telah dibuat dan menunggu pengerjaan Anda.',
                'assignment-id-1'
            );

            // Create a deadline notification
            await createNotification(
                user.id,
                'DEADLINE',
                'Batas Waktu Mendekati',
                'Tugas Anda akan berakhir dalam 3 hari. Segera selesaikan!',
                'assignment-id-1'
            );

            console.log(`✅ Created notifications for user: ${user.name}`);
        }

        console.log('\n✅ Sample notifications created successfully!');
    } catch (error) {
        console.error('❌ Error creating sample notifications:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSampleNotifications();
