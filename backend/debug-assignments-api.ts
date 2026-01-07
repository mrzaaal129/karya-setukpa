
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find User Mochamad Rizal
    const user = await prisma.user.findFirst({
        where: { name: { contains: 'Mochamad Rizal' } },
        include: { StudentBatch: true }
    });

    if (!user) {
        console.log("User not found");
        return;
    }

    console.log(`User: ${user.name} (${user.id})`);

    // Simulate what assignmentController.getStudentAssignments does
    // It finds User -> Batches -> Assignments for those batches

    // 1. Get batches
    const batchIds = user.StudentBatch.map(sb => sb.batchId);
    console.log(`Batches: ${batchIds.join(', ')}`);

    // 2. Find Assignments for these batches
    const assignments = await prisma.assignment.findMany({
        where: {
            OR: [
                {
                    Batches: {
                        some: {
                            id: { in: batchIds }
                        }
                    }
                },
                // Also check assignments directly assigned? (usually via batches)
            ]
        },
        include: {
            // Include papers for THIS user to check status
            Papers: {
                where: { userId: user.id }
            },
            ChapterSchedule: true
        }
    });

    console.log(`Found ${assignments.length} assignments.`);

    // 3. Map to DTO format
    const result = assignments.map(a => {
        const myPaper = a.Papers[0]; // Assuming one paper per assignment per user

        // Determine Status logic (simplified from controller)
        let status = 'SCHEDULED';
        const now = new Date();
        const start = a.activationDate ? new Date(a.activationDate) : new Date();
        const end = a.deadline ? new Date(a.deadline) : new Date(8640000000000000); // Far future

        if (myPaper) {
            // If paper exists, check its status or grade
            if (myPaper.grade || (myPaper.content && myPaper.content.length > 0)) {
                // Simplified logic: has paper = DRAFT or COMPLETED?
                // In controller it might depend on submission status
            }
        }

        // Logic for "Produk..." (Deadline passed?)
        if (now > end) {
            status = 'COMPLETED'; // Or 'MISSED'
        } else if (now >= start) {
            status = 'DRAFT'; // Active
        }

        return {
            id: a.id,
            title: a.title,
            myPaperId: myPaper?.id || null,
            deadline: a.deadline,
            status: status // Approximate
        };
    });

    result.forEach(r => {
        console.log(`Assignment: ${r.title}`);
        console.log(`  ID: ${r.id}`);
        console.log(`  MyPaperId: ${r.myPaperId}`);
        console.log(`  Deadline: ${r.deadline}`);
        console.log(`  Approximated Status: ${r.status}`);
        console.log('---');
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
