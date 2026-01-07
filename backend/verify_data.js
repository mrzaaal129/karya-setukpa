async function verify() {
    try {
        // Login
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nosis: 'SA001', password: 'password123' })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful. Token obtained.');

        // Fetch Advisors
        const advisorsRes = await fetch('http://localhost:3001/api/advisors', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const advisors = await advisorsRes.json();
        console.log(`Advisors found: ${advisors.length}`);

        // Fetch Examiners
        const examinersRes = await fetch('http://localhost:3001/api/examiners', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const examiners = await examinersRes.json();
        console.log(`Examiners found: ${examiners.length}`);

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verify();
