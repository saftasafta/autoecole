async function testFlow() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@autoecole.com', password: 'admin' })
    });
    
    let loginData = await loginRes.json();
    if (loginRes.status === 401) {
        console.log('Login with admin failed, trying admin123...');
        const loginRes2 = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@autoecole.com', password: 'admin123' })
        });
        loginData = await loginRes2.json();
    }
    
    const token = loginData.token;
    console.log('Token acquired:', !!token);

    const sumRes = await fetch('http://localhost:5000/api/finances/summary', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Summary status:', sumRes.status);
    const sumText = await sumRes.text();
    console.log('Summary text:', sumText.substring(0, 100));

    const postRes = await fetch('http://localhost:5000/api/finances/expenses', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        amount: 15,
        category: 'Rent',
        date: '2026-05-07',
        description: 'Test Fetch Flow'
      })
    });
    console.log('Post expense status:', postRes.status);
    const postText = await postRes.text();
    console.log('Post expense text:', postText.substring(0, 100));

  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testFlow();
