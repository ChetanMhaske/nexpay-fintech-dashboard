const API = 'https://nexpay-api-11oo.onrender.com/api';
const rand = Math.floor(Math.random() * 10000);
const user = { name: 'Test QA', email: `testqa${rand}@example.com`, password: 'Password123!' };
let token = '';
let userId = '';

async function runTests() {
  console.log('--- STARTING LIVE API TESTS ---');
  
  try {
    // 1. Register
    const regRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    const regData = await regRes.json();
    console.log(`1. Register: ${regRes.status} - ${regData.success ? 'PASS' : 'FAIL'} (${regData.message})`);
    
    // 2. Duplicate Register
    const dupRes = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    console.log(`2. Duplicate Register: ${dupRes.status} (expected 400) - ${dupRes.status === 400 ? 'PASS' : 'FAIL'}`);

    // 3. Login
    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password })
    });
    const loginData = await loginRes.json();
    token = loginData.data?.accessToken;
    userId = loginData.data?.user?._id;
    console.log(`3. Login: ${loginRes.status} - ${loginData.success && token ? 'PASS' : 'FAIL'} (${loginData.message})`);
    
    // 4. Wrong password
    const wrongRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'wrongpassword' })
    });
    console.log(`4. Wrong password: ${wrongRes.status} (expected 401) - ${wrongRes.status === 401 ? 'PASS' : 'FAIL'}`);

    // 5. Get Me (protected)
    const meRes = await fetch(`${API}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
    console.log(`5. Get Me: ${meRes.status} - ${meData.success ? 'PASS' : 'FAIL'} (${meData.data?.wallets?.length} wallets found)`);
    
    // 6. Access protected route NO TOKEN
    const noTokenRes = await fetch(`${API}/auth/me`);
    console.log(`6. No Token: ${noTokenRes.status} (expected 401) - ${noTokenRes.status === 401 ? 'PASS' : 'FAIL'}`);

    // 7. Access admin route as user
    const adminRes = await fetch(`${API}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`7. Admin Route as User: ${adminRes.status} (expected 403) - ${adminRes.status === 403 ? 'PASS' : 'FAIL'}`);

    // 8. Create Transaction (Deposit)
    const txRes = await fetch(`${API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ type: 'deposit', amount: 500, currency: 'USD' })
    });
    const txData = await txRes.json();
    console.log(`8. Deposit: ${txRes.status} - ${txData.success ? 'PASS' : 'FAIL'} (${txData.message})`);
    
    // 9. Create Transaction (Crypto Buy - Exceed balance)
    const txFailRes = await fetch(`${API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ type: 'crypto_buy', amount: 100, currency: 'BTC' }) // 100 BTC = 4.3M USD (insufficient)
    });
    const txFailData = await txFailRes.json();
    console.log(`9. Crypto Buy Insufficient: ${txFailRes.status} (expected 400) - ${txFailRes.status === 400 ? 'PASS' : 'FAIL'} (${txFailData.message})`);

    // 10. CORS Check
    const corsRes = await fetch(`${API}/auth/me`, {
      method: 'OPTIONS',
      headers: { 'Origin': 'https://nexpay-fintech-dashboard.vercel.app', 'Access-Control-Request-Method': 'GET' }
    });
    const acao = corsRes.headers.get('access-control-allow-origin');
    console.log(`10. CORS Allow Origin: ${acao} - ${acao === 'https://nexpay-fintech-dashboard.vercel.app' ? 'PASS' : 'FAIL'}`);

  } catch (error) {
    console.error('TEST ERROR:', error);
  }
}

runTests();
