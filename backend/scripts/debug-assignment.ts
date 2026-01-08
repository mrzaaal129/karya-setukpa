
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log("DEBUG: DATABASE_URL is", process.env.DATABASE_URL ? "Defined" : "Undefined");

// Standard Prisma instantiation uses env var directly.
// We will override it to test the fix.
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.gwdgxagolvvjaqejaefp:Setukpa2026@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
        }
    },
    // log: ['query', 'info', 'warn', 'error']
});

async function main() {
    console.log("🚀 Starting Debug Script for Assignment Query...");

    try {
        // 1. Get a test user (Student)
        const user = await prisma.user.findFirst({
            where: { role: 'SISWA' }
        });

        if (!user) {
            console.log("⚠️ No student found. Trying generic user.");
        } else {
            console.log(`👤 Found Student: ${user.name} (${user.id})`);
        }

        const userId = user?.id || 'dummy-id';
        const userRole = user?.role || 'SISWA';

        // 2. Run the Assignment Query
        console.log("🔍 Querying Assignments...");
        const assignments = await prisma.assignment.findMany({
            include: {
                PaperTemplate: {
                    select: { id: true, name: true },
                },
                ChapterSchedule: true,
                _count: {
                    select: { Paper: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log(`✅ Found ${assignments.length} assignments.`);

        // 3. Simulate Logic
        console.log("🔄 Running post-processing logic...");
        const now = new Date();

        const results = await Promise.all(assignments.map(async (assignment) => {
            let myPaperId = undefined;

            // Logic match
            const activationDate = new Date(assignment.activationDate);
            const deadlineDate = new Date(assignment.deadline);
            let computedStatus = assignment.status;

            // Student logic
            if (userRole === 'SISWA') {
                console.log(`   Checking paper for assignment ${assignment.id} for user ${userId}`);
                try {
                    const myPaper = await prisma.paper.findUnique({
                        where: {
                            assignmentId_userId: {
                                assignmentId: assignment.id,
                                userId: userId
                            }
                        },
                        select: { id: true, structure: true }
                    });
                    console.log(`   Found paper: ${myPaper ? 'YES' : 'NO'}`);
                } catch (err) {
                    console.error(`   ❌ Error finding paper for ${assignment.id}:`, err);
                    throw err; // Re-throw to catch valid errors
                }
            }

            return { id: assignment.id, status: computedStatus };
        }));

        console.log(`✅ Processing complete. Success!`);

    } catch (error: any) {
        console.error("❌ FATAL ERROR CAUGHT:");
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Meta:", error.meta);
        console.log("Full Error:", JSON.stringify(error, null, 2));

        // Check DB URL (Masked)
        const dbUrl = process.env.DATABASE_URL || 'UNDEFINED';
        console.log("DATABASE_URL (Masked):", dbUrl.replace(/:[^:]*@/, ':****@'));
    } finally {
        await prisma.$disconnect();
    }
}

main();
