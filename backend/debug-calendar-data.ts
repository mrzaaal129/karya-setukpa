import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    let output = 'Fetching all assignments...\n';
    const assignments = await prisma.assignment.findMany({
        select: {
            id: true,
            title: true,
            deadline: true,
            status: true,
            createdAt: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    output += '\n--- All Assignments in Database ---\n';
    if (assignments.length === 0) {
        output += 'No assignments found.\n';
    } else {
        // console.log(JSON.stringify(assignments, null, 2));
        assignments.forEach(a => {
            output += `TITLE: ${a.title} | DEADLINE: ${a.deadline ? a.deadline.toISOString() : 'NULL'} | STATUS: ${a.status}\n`;
        });
    }

    output += '\n--- Analysis ---\n';
    const futureAssignments = assignments.filter(a => a.deadline && new Date(a.deadline) > new Date());
    output += `Future Assignments (visible in Agenda): ${futureAssignments.length}\n`;

    const noDeadline = assignments.filter(a => !a.deadline);
    output += `Assignments with NO Deadline (invisible): ${noDeadline.length}\n`;

    fs.writeFileSync('debug-output.txt', output);
    console.log('Output written to debug-output.txt');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
