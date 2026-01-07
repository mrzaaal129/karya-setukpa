
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    // Pick an assignment ID. The user error log showed an ID: 4ba29c8f-ad35-4771-bda9-dfafad055d68.
    // Replace with a valid one if that one doesn't exist.
    // I'll query last assignment to be safe.

    console.log("--- START DEBUG CHAPTER ROUTE ---");

    const lastAssignment = await prisma.assignment.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { PaperTemplate: true, ChapterSchedule: true }
    });

    if (!lastAssignment) {
        console.log("No assignments found.");
        return;
    }

    const assignmentId = lastAssignment.id;
    console.log(`Using Assignment ID: ${assignmentId} (${lastAssignment.title})`);

    // Simulate the route logic
    try {
        let chapters = await prisma.chapterSchedule.findMany({
            where: { assignmentId },
            orderBy: { chapterId: 'asc' },
        });
        console.log(`Existing chapters count: ${chapters.length}`);

        if (chapters.length === 0) {
            console.log("Chapters empty. Fetching Assignment+Template...");
            const assignment = await prisma.assignment.findUnique({
                where: { id: assignmentId },
                include: { PaperTemplate: true }
            });

            if (!assignment) {
                console.log("Assignment not found (weird)");
                return;
            }

            console.log("Assignment found.");

            if (assignment.PaperTemplate?.pages) {
                console.log("Template pages found.");

                // Safely handle pages (parse if string)
                let pages: any[] = [];
                const rawPages = assignment.PaperTemplate.pages;
                console.log(`Raw Pages Type: ${typeof rawPages}`);
                // console.log(`Raw Pages Value:`, rawPages);

                if (typeof rawPages === 'string') {
                    try {
                        pages = JSON.parse(rawPages);
                        console.log("Pages parsed from string.");
                    } catch (e) {
                        console.error("Failed to parse pages:", e);
                        pages = [];
                    }
                } else if (Array.isArray(rawPages)) {
                    pages = rawPages as any[];
                    console.log("Pages is already array.");
                } else {
                    console.log("Pages is unknown type/object.");
                    // In Prisma Json can be object but not array
                    if (rawPages && typeof rawPages === 'object') {
                        console.log("Treating object as likely error unless it has structure?");
                        // If it's a single object page?
                    }
                }

                console.log(`Pages count: ${pages.length}`);

                // Find content page (dynamic check)
                const contentPage = pages.find((p: any) => {
                    const hasStruct = p.structure && Array.isArray(p.structure) && p.structure.length > 0;
                    console.log(`Page type: ${p.type}, Last Structure check: ${hasStruct}`);
                    return hasStruct;
                });

                if (contentPage) {
                    console.log("Content page found.");
                    if (contentPage.structure) {
                        console.log("Structure found. Mapping...");
                        try {
                            const scheduleData = contentPage.structure.map((ch: any, index: number) => {
                                console.log(`Mapping chapter ${index}:`, ch);
                                return {
                                    id: crypto.randomUUID(),
                                    assignmentId,
                                    chapterId: `CH-${index + 1}`,
                                    chapterName: ch.title || "Untitled Chapter", // Safety fallback
                                    startDate: assignment.activationDate || new Date(),
                                    endDate: assignment.deadline || new Date(new Date().setDate(new Date().getDate() + 30)),
                                    isActive: true,
                                    isOpen: true
                                };
                            });
                            console.log(`Mapped ${scheduleData.length} schedules.`);
                            console.log("NOT writing to DB in debug script, but logic seems OK up to here.");
                        } catch (mapErr) {
                            console.error("Error during map:", mapErr);
                        }
                    }
                } else {
                    console.log("No Content Page with structure found.");
                }
            } else {
                console.log("No Template or Pages.");
            }
        } else {
            console.log("Chapters already exist.");
        }

    } catch (error) {
        console.error('Logic crashed:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
