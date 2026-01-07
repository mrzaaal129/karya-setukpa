
import prisma from './src/config/database';

async function verifyAssignment() {
    const id = '70710dfe-d21f-43cf-a902-133d429f313b';
    const paper = await prisma.paper.findUnique({ where: { id } });

    if (paper) {
        console.log(`Paper AssignmentID: ${paper.assignmentId}`);
        const assignment = await prisma.assignment.findUnique({ where: { id: paper.assignmentId } });
        console.log(`Assignment Valid: ${!!assignment}`);
    }
}

verifyAssignment()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
