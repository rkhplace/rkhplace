async function testApi() {
    // Trying PumpPortal API
    const url = 'https://pumpportal.fun/api/data/token-info?address=61Wj56QgGyxB966T7YsMzEAKRLcMvJpDbPzjkrCZc4Bi';
    console.log('Fetching:', url);

    try {
        const res = await fetch(url);

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body Preview:', text.substring(0, 500));

    } catch (e) {
        console.error('Error:', e);
    }
}

testApi();
