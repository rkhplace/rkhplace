export const config = {
    matcher: '/:path*',
};

export default async function middleware(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Check if the path is a Solana address (Base58, 32-44 chars)
    // And avoid matching static assets or API routes
    const isCoinAddress = /^\/[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(path) && !path.includes('.');

    if (isCoinAddress) {
        // Determine the address from the path (remove leading slash)
        const address = path.slice(1);

        // Fetch the original index.html
        // Note: We use the origin from the request to ensure we fetch from the same deployment
        const origin = url.origin;
        const res = await fetch(`${origin}/index.html`);
        const html = await res.text();

        // The Dynamic Image URL
        const ogImageUrl = `${origin}/api/og?address=${address}&v=4`;

        // Fetch Token Data for Dynamic Title
        let pageTitle = 'Doxxing Myself as Dev - Pump'; // Default Fallback
        try {
            const tokenRes = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/multi/${address}`);
            if (tokenRes.ok) {
                const json = await tokenRes.json();
                if (json.data && json.data.length > 0) {
                    const attr = json.data[0].attributes;
                    if (attr.name && attr.symbol) {
                        // Include space before parenthesis as requested
                        pageTitle = `${attr.name} (${attr.symbol}) - Pump`;
                    }
                }
            }
        } catch (e) {
            console.error('Middleware token fetch failed:', e);
        }

        // Meta Tags to Inject
        const metaTags = `
    <!-- Dynamic OG/Twitter Tags Injected by Middleware -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@pumpdotfun" />
    <meta name="twitter:title" content="${pageTitle}" />
    <meta name="twitter:description" content="Watch the latest token stream and trade live." />
    
    <meta property="og:image" content="${ogImageUrl}" />
    <meta name="twitter:image" content="${ogImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:title" content="${pageTitle}" />
    <meta property="og:description" content="Watch the latest token stream and trade live." />
    <meta property="og:type" content="website" />
    `;

        const newHtml = html.replace('</head>', `${metaTags}\n <title>${pageTitle}</title>\n </head>`);

        return new Response(newHtml, {
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'public, max-age=0, must-revalidate' // Ensure fresh preview
            },
        });
    }
}
