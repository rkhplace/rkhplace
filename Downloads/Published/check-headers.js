async function checkHeaders() {
    // Check the live endpoint
    const url = 'https://published-eta.vercel.app/api/og?address=61Wj56QgGyxB966T7YsMzEAKRLcMvJpDbPzjkrCZc4Bi';
    console.log('Checking headers for:', url);

    try {
        const res = await fetch(url, { method: 'HEAD' });
        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers.get('content-type'));
        console.log('Content-Length:', res.headers.get('content-length'));
        console.log('X-Vercel-Cache:', res.headers.get('x-vercel-cache'));
    } catch (e) {
        console.error('Error:', e);
    }
}

checkHeaders();
