import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
});

async function resetDatabase() {
    try {
        console.log('🔄 Resetting database to minimal state...\n');

        // Step 1: Delete all data
        console.log('🗑️  Step 1: Deleting all existing data...');

        await prisma.activityLog.deleteMany();
        console.log('   ✓ Activity logs deleted');

        await prisma.violation.deleteMany();
        console.log('   ✓ Violations deleted');

        await prisma.examinerGrade.deleteMany();
        console.log('   ✓ Examiner grades deleted');

        await prisma.grade.deleteMany();
        console.log('   ✓ Grades deleted');

        await prisma.comment.deleteMany();
        console.log('   ✓ Comments deleted');

        await prisma.paper.deleteMany();
        console.log('   ✓ Papers deleted');

        await prisma.chapterSchedule.deleteMany();
        console.log('   ✓ Chapter schedules deleted');

        await prisma.assignment.deleteMany();
        console.log('   ✓ Assignments deleted');

        await prisma.paperTemplate.deleteMany();
        console.log('   ✓ Templates deleted');

        await prisma.examinerAssignment.deleteMany();
        console.log('   ✓ Examiner assignments deleted');

        await prisma.user.deleteMany();
        console.log('   ✓ Users deleted');

        await prisma.batch.deleteMany();
        console.log('   ✓ Batches deleted');

        // Step 2: Create Super Admin using raw SQL
        console.log('\n👤 Step 2: Creating Super Admin...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        await prisma.$executeRaw`
            INSERT INTO "User" (id, nosis, name, email, password, role, "createdAt", "updatedAt")
            VALUES (
                gen_random_uuid(),
                'SA001',
                'Super Admin SETUKPA',
                'superadmin@setukpa.ac.id',
                ${hashedPassword},
                'SUPER_ADMIN',
                NOW(),
                NOW()
            )
        `;
        console.log('   ✓ Super Admin created');

        // Step 3: Create default template using raw SQL
        console.log('\n📄 Step 3: Creating default template...');
        const templateSettings = JSON.stringify({
            paperSize: 'A4',
            orientation: 'portrait',
            margins: { top: 4, bottom: 3, left: 4, right: 3 },
            font: { family: 'Times New Roman', size: 12, lineHeight: 1.5 },
            paragraph: { indent: 1.27, spacing: 1.5 },
        });

        const templatePages = JSON.stringify([
            {
                id: 'p1',
                type: 'TITLE',
                name: 'Halaman Judul',
                order: 0,
                numbering: { type: 'none', position: 'none' },
                content: '<div style="text-align: center;"><p style="margin-top: 3cm; font-size: 14pt; font-weight: bold;">{{JUDUL_MAKALAH}}</p></div>',
            },
            {
                id: 'p2',
                type: 'STATEMENT',
                name: 'Lembar Pernyataan',
                order: 1,
                numbering: { type: 'roman', position: 'bottom-center', startNumber: 2 },
                content: '<h1 style="text-align: center;">LEMBAR PERNYATAAN</h1>',
            },
            {
                id: 'p3',
                type: 'CONTENT',
                name: 'Isi Makalah',
                order: 2,
                numbering: { type: 'arabic', position: 'bottom-center', startNumber: 1 },
                structure: [
                    {
                        id: 'bab1',
                        title: 'BAB I PENDAHULUAN',
                        minWords: 500,
                        wordCount: 0,
                        subsections: [
                            { id: 'bab1-a', title: 'A. Latar Belakang', minWords: 250, wordCount: 0, subsections: [] },
                            { id: 'bab1-b', title: 'B. Rumusan Masalah', minWords: 150, wordCount: 0, subsections: [] },
                            { id: 'bab1-c', title: 'C. Tujuan Penulisan', minWords: 100, wordCount: 0, subsections: [] },
                        ],
                    },
                    {
                        id: 'bab2',
                        title: 'BAB II LANDASAN TEORI',
                        minWords: 1000,
                        wordCount: 0,
                        subsections: [],
                    },
                    {
                        id: 'bab3',
                        title: 'BAB III PEMBAHASAN',
                        minWords: 1500,
                        wordCount: 0,
                        subsections: [],
                    },
                    {
                        id: 'bab4',
                        title: 'BAB IV PENUTUP',
                        minWords: 300,
                        wordCount: 0,
                        subsections: [
                            { id: 'bab4-a', title: 'A. Kesimpulan', minWords: 150, wordCount: 0, subsections: [] },
                            { id: 'bab4-b', title: 'B. Saran', minWords: 150, wordCount: 0, subsections: [] },
                        ],
                    },
                ],
            },
            {
                id: 'p4',
                type: 'REFERENCES',
                name: 'Daftar Pustaka',
                order: 3,
                numbering: { type: 'arabic', position: 'bottom-center' },
                content: '<h1 style="text-align: center;">DAFTAR PUSTAKA</h1>',
            },
        ]);

        await prisma.$executeRaw`
            INSERT INTO "PaperTemplate" (id, name, description, settings, pages, "createdAt", "updatedAt")
            VALUES (
                gen_random_uuid(),
                'Template Karya Tulis Ilmiah SETUKPA 2024',
                'Template standar Karya Tulis Ilmiah sesuai Pedoman KARTUL SETUKPA',
                ${templateSettings}::jsonb,
                ${templatePages}::jsonb,
                NOW(),
                NOW()
            )
        `;
        console.log('   ✓ Default template created');

        // Step 4: Verify
        console.log('\n✅ Database reset completed!\n');
        console.log('📋 Final Summary:');
        console.log(`   - Users: ${await prisma.user.count()}`);
        console.log(`   - Templates: ${await prisma.paperTemplate.count()}`);
        console.log(`   - Batches: ${await prisma.batch.count()}`);
        console.log(`   - Assignments: ${await prisma.assignment.count()}`);
        console.log(`   - Papers: ${await prisma.paper.count()}`);
        console.log('\n🔑 Login Credentials:');
        console.log('   NOSIS: SA001');
        console.log('   Password: password123');
        console.log('\n💡 Database is now ready for REAL data!');
        console.log('   All mock data has been removed.');
        console.log('   You can now add real users through the UI.');

    } catch (error) {
        console.error('\n❌ Error resetting database:');
        console.error(error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

resetDatabase();
