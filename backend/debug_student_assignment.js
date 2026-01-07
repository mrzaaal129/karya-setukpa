import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStudentStatus(nosis) {
    console.log(`🔍 Mengecek data siswa: ${nosis}...`);

    try {
        // 1. Cek User & Batch
        const user = await prisma.user.findUnique({
            where: { nosis: nosis },
            include: { Batch: true }
        });

        if (!user) {
            console.log('❌ Siswa tidak ditemukan!');
            return;
        }

        console.log('✅ Siswa Ditemukan:');
        console.log(`   - Nama: ${user.name}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Angkatan: ${user.Batch ? user.Batch.name : 'TIDAK ADA ANGKATAN (⚠️ Ini mungkin penyebabnya)'}`);
        console.log(`   - Batch ID: ${user.batchId}`);
        console.log(`   - Is Active: ${user.isActive}`);

        // 2. Cek Daftar Tugas (Assignment) yang tersedia
        console.log('\n📋 Daftar Tugas di Sistem:');
        const assignments = await prisma.assignment.findMany({
            include: {
                Batch: true
            }
        });

        if (assignments.length === 0) {
            console.log('   (Tidak ada tugas di sistem)');
        }

        for (const assignment of assignments) {
            console.log(`   - [${assignment.status}] ${assignment.title} (ID: ${assignment.id})`);
            console.log(`     Batch Assignment: ${assignment.batchId ? (assignment.Batch ? assignment.Batch.name : assignment.batchId) : 'Global (Semua)'}`);

            // 3. Cek apakah siswa punya Paper di tugas ini
            const paper = await prisma.paper.findFirst({
                where: {
                    assignmentId: assignment.id,
                    studentId: user.id
                }
            });

            if (paper) {
                console.log(`     ✅ Siswa SUDAH PUNYA Paper (ID: ${paper.id})`);
            } else {
                console.log(`     ❌ Siswa BELUM mempunyai Paper untuk tugas ini.`);

                // Analisa kenapa belum
                if (assignment.batchId && assignment.batchId !== user.batchId) {
                    console.log(`        🛑 BLOKIR: Tugas ini untuk Batch ID ${assignment.batchId}, siswa ada di Batch ID ${user.batchId || 'null'}.`);
                } else {
                    console.log(`        ⚠️ STATUS: Paper belum dibuat. Siswa harus "Mulai Tugas" atau Admin harus "Distribusikan".`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStudentStatus('0070574');
