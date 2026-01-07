
import prisma from './src/config/database';

async function debugQuery() {
    const paperId = '70710dfe-d21f-43cf-a902-133d429f313b';
    console.log(`Debugging Paper ID: ${paperId}`);

    try {
        // 1. Simple Find
        const simple = await prisma.paper.findUnique({ where: { id: paperId } });
        console.log(`Simple Find: ${simple ? 'FOUND' : 'NOT FOUND'}`);
        if (simple) console.log(`Title: ${simple.title}, UserId: ${simple.userId}`);

        // 2. Controller Query
        console.log('Running Controller Query...');
        const paper = await prisma.paper.findUnique({
            where: { id: paperId },
            include: {
                User: {
                    include: {
                        ExaminerAssignment_ExaminerAssignment_studentIdToUser: {
                            include: {
                                User_ExaminerAssignment_examinerIdToUser: {
                                    select: { name: true, role: true }
                                }
                            }
                        }
                    }
                },
                Assignment: {
                    select: { title: true, subject: true }
                },
                Comment: {
                    where: { text: { contains: '[NILAI:' } },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        User: { select: { name: true, role: true } }
                    }
                }
            }
        });

        console.log(`Controller Query Result: ${paper ? 'FOUND' : 'NULL'}`);
        if (paper) {
            console.log(`User: ${paper.User?.name}`);
            console.log(`Assignment: ${paper.Assignment?.title}`);
            console.log(`Comments: ${paper.Comment.length}`);
        }

    } catch (error) {
        console.error('Query Failed:', error);
    }
}

debugQuery()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
