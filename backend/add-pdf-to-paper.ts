
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // ID Paper yang sedang kita kerjakan
    const paperId = '9f9777ee-ed44-48f4-98c0-d86a1d3df34e';

    console.log(`Updating Paper ID: ${paperId} with PDF link...`);

    // Update paper dengan link PDF dummy (contoh file pdf yang bisa diakses publik atau file lokal)
    // Disini saya pakai link PDF contoh dari internet atau file dummy jika ada
    const updatedPaper = await prisma.paper.update({
        where: { id: paperId },
        data: {
            finalFileName: '0304_ANGGA SAPUTERA S.H.pdf',
            finalFileUrl: 'http://localhost:3001/uploads/1766581809519-787992098.pdf', // Link ke file lokal yang ada
            finalFileSize: 576104,
            finalUploadedAt: new Date()
        }
    });

    console.log(`SUCCESS: Paper updated.`);
    console.log(`Final File Name: ${updatedPaper.finalFileName}`);
    console.log(`Final File URL: ${updatedPaper.finalFileUrl}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
