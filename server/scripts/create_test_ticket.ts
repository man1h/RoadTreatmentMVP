import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function createTicket() {
    try {
        // Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@aldot.alabama.gov',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        const user = loginRes.data.user;

        console.log('Logged in as:', user.email);

        // Create Ticket
        const ticketRes = await axios.post(`${API_URL}/tickets`, {
            tmcId: 1,
            truckId: 1,
            driverId: 3, // driver1.huntsville
            priority: 'high',
            scheduledTime: new Date().toISOString(),
            notes: 'Real-time test ticket',
            bridgeIds: ['005645', '005646']
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Ticket created:', ticketRes.data.ticket_number);
    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

createTicket();
