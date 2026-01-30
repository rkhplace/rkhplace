async function checkPump() {
    const address = '61Wj56QgGyxB966T7YsMzEAKRLcMvJpDbPzjkrCZc4Bi';
    const url = `https://pumpportal.fun/api/data/token-info?address=${address}`;
    console.log('Fetching:', url);

    try {
        const res = await fetch(url);
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Raw Body:', text.substring(0, 1000));

        try {
            const json = JSON.parse(text);
            console.log('Parsed JSON keys:', Object.keys(json));
            if (json.data) console.log('Data keys:', Object.keys(json.data));
        } catch (e) {
            console.log('JSON Parse Error:', e.message);
        }
    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

checkPump();
