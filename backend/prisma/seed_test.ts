
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🧪 Starting TEST database seeding...');
        console.log('🗑️  Clearing existing data...');

        // 1. Clear leaf nodes (dependent data)
        await prisma.activityLog.deleteMany();
        await prisma.violation.deleteMany();
        await prisma.examinerGrade.deleteMany();
        await prisma.grade.deleteMany();
        await prisma.comment.deleteMany();

        // 2. Clear relations to Users
        await prisma.examinerAssignment.deleteMany();

        // 3. Clear Paper Workflow
        await prisma.paper.deleteMany();

        // 4. Clear Assignment & Scheduling
        await prisma.chapterSchedule.deleteMany();
        await prisma.assignment.deleteMany();

        // 5. CRITICAL: Break Self-Referencing User Loops (Pembimbing)
        // Check if we can just update all users to have pembimbingId = null
        try {
            await prisma.user.updateMany({
                data: { pembimbingId: null }
            });
            console.log('   - Self-relations cleared');
        } catch (e) {
            console.log('   - Warning: Could not clear self-relations (might already be empty)');
        }

        // 6. Delete Users now that they are unlinked
        await prisma.user.deleteMany();

        // 7. Clear remaining roots
        await prisma.batch.deleteMany();
        await prisma.paperTemplate.deleteMany();

        console.log('✅ Data cleared successfully');


        // --- SEEDING NEW DATA ---

        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Create Batch (Needed for Assignment)
        const batch = await prisma.batch.create({
            data: {
                id: 'BATCH-TEST-2025', // Fixed ID for easier reference
                name: 'Batch Test 2025',
                startDate: new Date(),
                updatedAt: new Date()
            }
        });

        // 2. Create Users
        const superAdmin = await prisma.user.create({
            data: {
                id: 'USER-ADMIN',
                nosis: 'ADMIN01',
                name: 'Super Admin TEST',
                email: 'admin@test.com',
                password: hashedPassword,
                role: UserRole.SUPER_ADMIN,
                updatedAt: new Date(),
            }
        });

        const advisor = await prisma.user.create({
            data: {
                id: 'USER-ADVISOR',
                nosis: 'ADV001',
                name: 'Dr. Pembimbing Test',
                email: 'advisor@test.com',
                password: hashedPassword,
                role: UserRole.PEMBIMBING,
                updatedAt: new Date(),
            }
        });

        const examiner = await prisma.user.create({
            data: {
                id: 'USER-EXAMINER',
                nosis: 'EXM001',
                name: 'Prof. Penguji Test',
                email: 'examiner@test.com',
                password: hashedPassword,
                role: UserRole.PENGUJI,
                updatedAt: new Date(),
            }
        });

        const student = await prisma.user.create({
            data: {
                id: 'USER-STUDENT',
                nosis: 'STU001',
                name: 'Siswa Test 001',
                email: 'student@test.com',
                password: hashedPassword,
                role: UserRole.SISWA,
                pembimbingId: advisor.id, // Assign advisor
                rank: 'Brigadir',
                updatedAt: new Date(),
            }
        });

        // 3. Examiner Assignment
        await prisma.examinerAssignment.create({
            data: {
                id: 'EX-ASSIGN-001',
                studentId: student.id,
                examinerId: examiner.id,
                updatedAt: new Date()
            }
        });

        console.log('✅ Users & Relations created');

        // 4. Create Template
        const template = await prisma.paperTemplate.create({
            data: {
                id: 'TEMPLATE-TEST',
                name: 'Template Test Simple',
                description: 'Simple structure for testing',
                settings: {
                    paperSize: "A4",
                    orientation: "portrait",
                    margins: { top: 3, bottom: 3, left: 4, right: 3 },
                    font: { family: "Times New Roman", size: 12, lineHeight: 1.5 },
                    paragraph: { indent: 1.25, spacing: 1.5 }
                },
                pages: [
                    {
                        id: 'p1', type: 'TITLE', name: 'Halaman Judul', order: 0,
                        numbering: { type: 'none', position: 'none' }
                    },
                    {
                        id: 'p2', type: 'CONTENT', name: 'Isi', order: 1,
                        numbering: { type: 'arabic', position: 'bottom-center' },
                        structure: [
                            { id: 'ch1', title: 'BAB I PENDAHULUAN', minWords: 10 },
                            { id: 'ch2', title: 'BAB II PEMBAHASAN', minWords: 20 },
                            { id: 'ch3', title: 'BAB III PENUTUP', minWords: 10 }
                        ]
                    }
                ],
                updatedAt: new Date()
            }
        });

        // 5. Create Assignment
        const assignment = await prisma.assignment.create({
            data: {
                id: 'ASG-TEST-001',
                title: 'Penugasan KTI Test',
                subject: 'Polmas',
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
                batchId: batch.id,
                templateId: template.id,
                status: 'SCHEDULED', // 'SCHEDULED' enum allows logic to run
                updatedAt: new Date()
            }
        });

        // 6. Create Chapter Schedules (ALL OPEN)
        await prisma.chapterSchedule.createMany({
            data: [
                {
                    id: 'SCH-1', assignmentId: assignment.id, chapterName: 'BAB I PENDAHULUAN',
                    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Active
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date()
                },
                {
                    id: 'SCH-2', assignmentId: assignment.id, chapterName: 'BAB II PEMBAHASAN',
                    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date()
                },
                {
                    id: 'SCH-3', assignmentId: assignment.id, chapterName: 'BAB III PENUTUP',
                    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date()
                }
            ]
        });

        // 7. Initialize Paper for Student
        // Extract structure manually to avoid type issues in seed
        const contentPage: any = template.pages.find((p: any) => p.type === 'CONTENT');
        const initialStructure = contentPage?.structure || [];

        await prisma.paper.create({
            data: {
                id: 'PAPER-TEST-001',
                assignmentId: assignment.id,
                userId: student.id,
                title: 'Judul KTI Siswa Test',
                subject: 'Polmas',
                content: '',
                structure: initialStructure,
                updatedAt: new Date(),
                contentApprovalStatus: 'PENDING',
                wordCount: 0,
                pageCount: 0,
                totalWords: 0,
                totalPages: 0,
                timerDuration: 0
            }
        });

        console.log('\n🎉 TEST Seeding Complete!');
        console.log('Login Credentials (pass: "password123"):');
        console.log('------------------------------------------------');
        console.log(`Advisor   : ADV001`);
        console.log(`Student   : STU001`);
        console.log(`Examiner  : EXM001`);
        console.log('------------------------------------------------');

    } catch (e) {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
