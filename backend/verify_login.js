async function verifyLogin() {
    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nosis: 'SA001', password: 'password123' })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Login failed: ${response.status} ${error}`);
        }

        const data = await response.json();
        console.log('Login successful!');
        console.log('Token:', data.token ? 'Present' : 'Missing');
    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verifyLogin();
