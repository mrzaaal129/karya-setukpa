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
            SELECT enum_range(NULL::"AssignmentStatus");
        `);
        console.log('Enum values:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();
