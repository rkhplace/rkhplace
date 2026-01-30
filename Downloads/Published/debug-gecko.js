async function checkGecko() {
    // User's specific token (Z coin from screenshot? or the 61Wj... one?)
    // The user's link in step 592 was 61Wj...
    const address = 'axUxN2q4AWzHaU6LXmjqQh7KEjaXDPKScjmzwEBpump';
    const url = `https://api.geckoterminal.com/api/v2/networks/solana/tokens/multi/${address}`;
    console.log('Fetching:', url);

    try {
        const res = await fetch(url);
        const json = await res.json();
        console.log(JSON.stringify(json, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

checkGecko();
