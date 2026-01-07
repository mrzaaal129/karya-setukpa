import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🌱 Starting minimal database seeding...');

        // Clear existing data using TRUNCATE for better performance and constraint handling
        console.log('🗑️  Clearing existing data...');
        try {
            await prisma.$executeRaw`TRUNCATE TABLE "ActivityLog", "Violation", "ExaminerGrade", "Grade", "Comment", "Paper", "ChapterSchedule", "Assignment", "PaperTemplate", "ExaminerAssignment", "User", "Batch" CASCADE`;
            console.log('✅ Data cleared successfully');
        } catch (error) {
            console.log('⚠️  TRUNCATE failed, trying individual deletes...');
            await prisma.activityLog.deleteMany();
            await prisma.violation.deleteMany();
            await prisma.examinerGrade.deleteMany();
            await prisma.grade.deleteMany();
            await prisma.comment.deleteMany();
            await prisma.paper.deleteMany();
            await prisma.chapterSchedule.deleteMany();
            await prisma.assignment.deleteMany();
            await prisma.paperTemplate.deleteMany();
            await prisma.examinerAssignment.deleteMany();
            await prisma.user.deleteMany();
            await prisma.batch.deleteMany();
            console.log('✅ Data cleared with deleteMany');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Create ONLY Super Admin - no mock data
        console.log('👤 Creating Super Admin...');
        const superAdmin = await prisma.user.create({
            data: {
                nosis: 'SA001',
                name: 'Super Admin SETUKPA',
                email: 'superadmin@setukpa.ac.id',
                password: hashedPassword,
                role: UserRole.SUPER_ADMIN,
            },
        });
        console.log('✅ Super Admin created');

        // Create Admin
        console.log('👤 Creating Admin...');
        await prisma.user.create({
            data: {
                nosis: 'ADM001',
                name: 'Admin SETUKPA',
                email: 'admin@setukpa.ac.id',
                password: hashedPassword,
                role: UserRole.ADMIN,
            },
        });
        console.log('✅ Admin created');

        // Create Pembimbing
        console.log('👤 Creating Pembimbing...');
        const pembimbing = await prisma.user.create({
            data: {
                nosis: 'PB001',
                name: 'Pembimbing Satu',
                email: 'pembimbing@setukpa.ac.id',
                password: hashedPassword,
                role: UserRole.ADVISOR,
            },
        });
        console.log('✅ Pembimbing created');

        // Create Penguji
        console.log('👤 Creating Penguji...');
        await prisma.user.create({
            data: {
                nosis: 'PG001',
                name: 'Penguji Satu',
                email: 'penguji@setukpa.ac.id',
                password: hashedPassword,
                role: UserRole.EXAMINER,
            },
        });
        console.log('✅ Penguji created');

        // Create Siswa
        console.log('👤 Creating Siswa...');
        await prisma.user.create({
            data: {
                nosis: '2024001',
                name: 'Siswa Satu',
                email: 'siswa@setukpa.ac.id',
                password: hashedPassword,
                role: UserRole.STUDENT,
                pembimbingId: pembimbing.id
            },
        });
        console.log('✅ Siswa created');

        // Create default template for paper structure
        console.log('📄 Creating default paper template...');
        const template = await prisma.paperTemplate.create({
            data: {
                name: 'Template Karya Tulis Ilmiah SETUKPA 2024',
                description: 'Template standar Karya Tulis Ilmiah sesuai Pedoman KARTUL SETUKPA',
                settings: {
                    paperSize: 'A4',
                    orientation: 'portrait',
                    margins: { top: 4, bottom: 3, left: 4, right: 3 },
                    font: { family: 'Times New Roman', size: 12, lineHeight: 1.5 },
                    paragraph: { indent: 1.27, spacing: 1.5 },
                },
                pages: [
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
                ],
            },
        });
        console.log('✅ Template created');

        console.log('\n✅ Minimal database seeding completed!');
        console.log('\n📋 Summary:');
        console.log(`   - Users: ${await prisma.user.count()}`);
        console.log(`   - Templates: ${await prisma.paperTemplate.count()}`);
        console.log(`   - Batches: ${await prisma.batch.count()}`);
        console.log(`   - Assignments: ${await prisma.assignment.count()}`);
        console.log(`   - Papers: ${await prisma.paper.count()}`);
        console.log('\n🔑 Login Credentials:');
        console.log('   Super Admin - NOSIS: SA001, Password: password123');
        console.log('\n💡 Database is now ready for REAL data!');
        console.log('   You can now add real users, batches, and assignments through the UI.');
    } catch (error) {
        console.error('❌ Detailed error:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
