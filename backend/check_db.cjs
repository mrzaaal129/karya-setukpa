const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'setukpa_db',
    password: '1234',
    port: 5432,
});

async function check() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Assignment';
        `);
        console.log('Assignment columns:', res.rows);

        const res2 = await pool.query(`SELECT * FROM "Assignment" LIMIT 1`);
        console.log('Assignment row:', res2.rows[0]);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();
