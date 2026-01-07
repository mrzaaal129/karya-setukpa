
import axios from 'axios';

async function main() {
    const paperId = '9f9777ee-ed44-48f4-98c0-d86a1d3df34e';
    const url = `http://localhost:3001/api/grades/paper/${paperId}`;

    console.log(`Fetching: ${url}`);

    try {
        const response = await axios.get(url);
        console.log('Response Status:', response.status);

        const gradeData = response.data.grade;
        console.log('----- Grade Data -----');
        console.log('finalFileName:', gradeData.finalFileName);
        console.log('finalFileUrl:', gradeData.finalFileUrl);
        console.log('----------------------');

    } catch (error: any) {
        console.error('Error fetching data:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

main();
