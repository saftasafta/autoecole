const axios = require('axios');

async function testFlow() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@autoecole.com',
      password: 'admin' // I will try 'admin123' if 'admin' fails
    });
    const token = loginRes.data.token;
    console.log('Login successful');

    const sumRes = await axios.get('http://localhost:5000/api/finances/summary', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Summary:', sumRes.data);

    const postRes = await axios.post('http://localhost:5000/api/finances/expenses', {
      amount: 10,
      category: 'Rent',
      date: '2026-05-07',
      description: 'Test API Flow'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Post expense:', postRes.data);

  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    if (error.response?.status === 401 && error.config.url.includes('login')) {
       try {
           const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
             email: 'admin@autoecole.com',
             password: 'admin123'
           });
           const token = loginRes.data.token;
           console.log('Login successful with admin123');
           
           const postRes = await axios.post('http://localhost:5000/api/finances/expenses', {
              amount: 10,
              category: 'Rent',
              date: '2026-05-07',
              description: 'Test API Flow'
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Post expense:', postRes.data);
       } catch (err2) {
           console.log('Error2 status:', err2.response?.status);
           console.log('Error2 data:', err2.response?.data);
       }
    }
  }
}

testFlow();
