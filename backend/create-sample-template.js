const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleTemplate() {
    try {
        const template = await prisma.paperTemplate.create({
            data: {
                name: 'Template Karya Tulis Ilmiah SETUKPA 2024',
                description: 'Template standar untuk Karya Tulis Ilmiah Setukpa',
                settings: {
                    paperSize: 'A4',
                    orientation: 'portrait',
                    margins: { top: 4, bottom: 3, left: 4, right: 3 },
                    font: {
                        family: 'Times New Roman',
                        size: 12,
                        lineHeight: 1.5
                    }
                },
                pages: [
                    {
                        id: 'p1',
                        type: 'TITLE',
                        name: 'Halaman Judul',
                        order: 0,
                        numbering: { type: 'none', position: 'none' },
                        content: '<div style="text-align: center;"><p style="margin-top: 3cm; font-size: 14pt; font-weight: bold;">{{JUDUL_MAKALAH}}</p></div>'
                    },
                    {
                        id: 'p2',
                        type: 'CONTENT',
                        name: 'Isi Makalah',
                        order: 1,
                        numbering: { type: 'arabic', position: 'bottom-center' },
                        content: '<h1>BAB I PENDAHULUAN</h1><p>Isi pendahuluan...</p>'
                    }
                ]
            }
        });

        console.log('✅ Template created successfully:');
        console.log(JSON.stringify(template, null, 2));
    } catch (error) {
        console.error('❌ Error creating template:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSampleTemplate();
