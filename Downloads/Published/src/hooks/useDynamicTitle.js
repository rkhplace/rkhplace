import { useEffect } from 'react';

const useDynamicTitle = () => {
    useEffect(() => {
        const fetchTokenInfo = async () => {
            // Get the path segment (potential token address)
            // Ignoring the leading slash
            const path = window.location.pathname.substring(1);

            if (!path) {
                // If root, we do nothing or reset to default if needed. 
                // Implementation plan said: "Open the base URL. Check if the title remains default or is handled gracefully."
                // So we leave it as is or maybe set it back to a default if we want. 
                // For now, let's leave it alone as per the plan "If a path exists..."
                return;
            }

            try {
                const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/multi/${path}`);

                if (!response.ok) {
                    document.title = 'Doxxing Myself as Dev - Pump';
                    return;
                }

                const data = await response.json();

                // The /multi endpoint returns a list of tokens in `data`.
                // Since we are asking for one address, we expect the first item to match.
                if (data && data.data && data.data.length > 0) {
                    const tokenAttributes = data.data[0].attributes;
                    if (tokenAttributes && tokenAttributes.name) {
                        document.title = tokenAttributes.name + ' (' + tokenAttributes.symbol + ') - Pump';
                    } else {
                        document.title = 'Doxxing Myself as Dev - Pump';
                    }
                } else {
                    // Address might not exist in GeckoTerminal
                    document.title = 'Doxxing Myself as Dev - Pump';
                }

            } catch (error) {
                console.error("Failed to fetch token info:", error);
                document.title = 'Doxxing Myself as Dev - Pump';
            }
        };

        fetchTokenInfo();
    }, []); // Run once on mount
};

export default useDynamicTitle;
