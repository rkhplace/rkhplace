import { useState } from 'react';

const BannerGenerator = () => {
    const [address, setAddress] = useState('');
    const [tokenData, setTokenData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTokenData = async () => {
        if (!address) return;
        setLoading(true);
        setError(null);
        try {
            // Note: Using PumpPortal or Gecko as per backend strategy
            const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${address}`); // Kept original but simplified URL
            if (!response.ok) {
                // Try alternate if primary fails or implemented differently
                throw new Error('Failed to fetch token data');
            }
            const data = await response.json();
            if (data.data) {
                setTokenData({
                    name: data.data.attributes.name,
                    symbol: data.data.attributes.symbol,
                    // price: data.data.attributes.price_usd,
                    image_url: data.data.attributes.image_url,
                });
            } else {
                setError('Token not found');
                setTokenData(null);
            }
        } catch (err) {
            setError(err.message);
            setTokenData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchTokenData();
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-2xl bg-gray-800 p-8 rounded-xl border border-gray-700 mx-auto mt-10">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Banner Generator
            </h1>

            <form onSubmit={handleSearch} className="flex gap-4">
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter Solana Token Address"
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-purple-500 text-white placeholder-gray-400 transition-colors"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Loading...' : 'Generate'}
                </button>
            </form>

            {error && <p className="text-red-400">{error}</p>}

            {tokenData && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-300">Preview:</h2>

                    {/* Banner Layout */}
                    <div className="flex flex-col items-center justify-center p-4 bg-black/20 rounded-xl border border-gray-700">
                        <div className="relative mt-2 w-full max-w-[317px]">
                            <div
                                className="relative h-[166px] w-full overflow-hidden rounded-lg"
                                style={{
                                    backgroundImage: `url('/og-placeholder.jpg')`, // Updated to use existing file
                                    backgroundSize: '317px 166px',
                                    backgroundPosition: '0px 0px',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundColor: 'rgb(17, 20, 18)'
                                }}
                            >
                                {/* Text Content */}
                                <div className="absolute left-[21px] top-1/2 flex max-w-[126px] -translate-y-1/2 transform flex-col justify-center gap-1">
                                    <div className="mb-1 text-[26px] font-black leading-none tracking-[-0.02em] text-white uppercase truncate w-full" style={{ fontFamily: 'Inter' }}>
                                        {tokenData.symbol}
                                    </div>
                                    <div className="mb-1 text-[10.5px] font-semibold leading-tight text-white truncate w-full" style={{ fontFamily: 'Inter' }}>
                                        {tokenData.name}
                                    </div>
                                    <div className="text-[5px] font-normal leading-tight text-white line-clamp-2">
                                        {/* Placeholder description */}
                                        Custom Banner Generated
                                    </div>
                                </div>

                                {/* Logo Image */}
                                <div className="absolute right-[21px] top-1/2 flex h-[110px] w-[110px] -translate-y-1/2 transform items-center justify-center">
                                    <img
                                        alt={`${tokenData.symbol} logo`}
                                        draggable="false"
                                        width="110"
                                        height="110"
                                        className="h-[110px] w-[110px] rounded-[5px] object-cover"
                                        src={tokenData.image_url}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BannerGenerator;
