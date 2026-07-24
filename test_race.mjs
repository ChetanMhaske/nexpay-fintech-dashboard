const API = 'https://nexpay-api-11oo.onrender.com/api';

async function runRaceTest() {
  console.log('--- STARTING RACE CONDITION TEST ---');
  
  const userA = { name: 'Alice', email: `alice${Date.now()}@example.com`, password: 'Password123!' };
  const userB = { name: 'Bob', email: `bob${Date.now()}@example.com`, password: 'Password123!' };

  try {
    // 1. Register Alice and Bob
    let resA = await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userA) });
    let tokenA = (await resA.json()).data.accessToken;

    let resB = await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userB) });
    let tokenB = (await resB.json()).data.accessToken;

    // Alice starts with 1000 USD (from default wallets)
    // 2. Fire 3 concurrent transfers of 500 USD from Alice to Bob
    console.log('Firing 3 concurrent 500 USD transfers from Alice to Bob...');
    const reqs = [1, 2, 3].map(() => fetch(`${API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ type: 'transfer', amount: 500, currency: 'USD', recipientEmail: userB.email })
    }));

    const results = await Promise.all(reqs);
    for (const r of results) {
      const data = await r.json();
      console.log(`Transfer request returned: ${r.status} - ${data.message}`);
    }

    // 3. Check final balances
    const meA = await (await fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    const meB = await (await fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${tokenB}` } })).json();

    const balA = meA.data.wallets.find(w => w.currency === 'USD').balance;
    const balB = meB.data.wallets.find(w => w.currency === 'USD').balance;
    
    console.log(`Final Alice USD Balance: ${balA} (Expected: 0)`);
    console.log(`Final Bob USD Balance: ${balB} (Expected: 2000)`);

    if (balA >= 0 && balB === 2000) {
      console.log('RACE CONDITION PREVENTED SUCCESSFULLY! (Both wallets consistent, no double spend)');
    } else {
      console.log('RACE CONDITION OCCURRED! (Balances are inconsistent)');
    }

  } catch (error) {
    console.error('TEST ERROR:', error);
  }
}

runRaceTest();
