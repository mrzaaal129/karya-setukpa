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
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns 
            WHERE table_name = 'Assignment' AND column_name = 'status';
        `);
        console.log('Status column type:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();
