
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const assignmentId = '70710dfe-d21f-43cf-a902-133d429f313b'; // "PRODUK KARYA AKHIR PERORANGAN"
    console.log(`Setting up Paper for Assignment ID: ${assignmentId}`);

    // 1. Find User
    const user = await prisma.user.findFirst({
        where: { name: { contains: 'Mochamad Rizal' } }
    });

    if (!user) {
        throw new Error("User Mochamad Rizal not found");
    }
    console.log(`User: ${user.name} (${user.id})`);

    // 2. Check if Paper already exists
    const existingPaper = await prisma.paper.findFirst({
        where: {
            userId: user.id,
            assignmentId: assignmentId
        }
    });

    if (existingPaper) {
        console.log(`Paper already exists: ${existingPaper.id}`);
        return;
    }

    // 3. Get Assignment Structure/Template
    const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId }
    });

    if (!assignment) {
        throw new Error("Assignment not found");
    }

    // 4. Create Paper with custom UUID
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    const initialStructure = [
        { title: "BAB I PENDAHULUAN", content: "", status: "DRAFT" },
        { title: "BAB II PEMBAHASAN", content: "", status: "DRAFT" }
    ];

    const newPaper = await prisma.paper.create({
        data: {
            id: generateUUID(),
            title: `Paper: ${assignment.title}`,
            userId: user.id,
            assignmentId: assignment.id,
            subject: assignment.subject || "Umum",
            structure: initialStructure, // JSON
            content: "",
            updatedAt: new Date()
        }
    });

    console.log(`SUCCESS: Created new Paper ID: ${newPaper.id}`);
    console.log(`This should fix the dashboard link.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
