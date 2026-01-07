
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Check graded paper for "Produk Karya Akhir" - The new one we created
    const paperId = '9f9777ee-ed44-48f4-98c0-d86a1d3df34e'; // From screenshot URL

    console.log(`Checking paper: ${paperId}`);

    const paper = await prisma.paper.findUnique({
        where: { id: paperId },
        include: {
            User: { select: { name: true } },
            Assignment: { select: { title: true, subject: true } },
            Grade: {
                include: {
                    User: { select: { name: true, role: true } },
                    ExaminerGrade: {
                        include: {
                            User: { select: { name: true, role: true } }
                        }
                    }
                }
            },
            Comment: {
                where: { text: { contains: '[NILAI:' } },
                include: { User: { select: { name: true, role: true } } },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!paper) {
        console.log("Paper not found!");
        return;
    }

    console.log("\n=== PAPER INFO ===");
    console.log(`Title: ${paper.title}`);
    console.log(`Student: ${paper.User?.name}`);
    console.log(`Paper.grade (Examiner Score): ${paper.grade}`);
    console.log(`Structure length: ${Array.isArray(paper.structure) ? (paper.structure as any[]).length : 0}`);

    console.log("\n=== GRADE TABLE (Advisor) ===");
    if (paper.Grade) {
        console.log(`Advisor: ${paper.Grade.User?.name}`);
        console.log(`finalScore: ${paper.Grade.finalScore}`);
        console.log(`contentScore: ${paper.Grade.contentScore} / ${paper.Grade.maxContent}`);
        console.log(`structureScore: ${paper.Grade.structureScore} / ${paper.Grade.maxStructure}`);
        console.log(`languageScore: ${paper.Grade.languageScore} / ${paper.Grade.maxLanguage}`);
        console.log(`formatScore: ${paper.Grade.formatScore} / ${paper.Grade.maxFormat}`);
        console.log(`advisorFeedback: ${paper.Grade.advisorFeedback}`);
        console.log(`ExaminerGrades count: ${paper.Grade.ExaminerGrade?.length}`);
    } else {
        console.log("No Grade record (Advisor hasn't graded)");
    }

    console.log("\n=== COMMENTS (Examiner Feedback) ===");
    if (paper.Comment.length > 0) {
        paper.Comment.forEach((c, i) => {
            console.log(`[${i + 1}] Author: ${c.User?.name} (${c.User?.role})`);
            console.log(`    Text: ${c.text}`);
            console.log(`    Date: ${c.createdAt}`);
        });
    } else {
        console.log("No grading comments found.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
