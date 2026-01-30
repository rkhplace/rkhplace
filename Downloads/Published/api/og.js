import { ImageResponse } from '@vercel/og';
import React from 'react';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    // Construct absolute URL for the background image
    const bgUrl = new URL('/og-placeholder.jpg', req.url).toString();

    // 1. Empty State (No Address)
    if (!address) {
        return new ImageResponse(
            React.createElement('div', {
                style: {
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                }
            }, [
                React.createElement('img', {
                    src: bgUrl,
                    width: "1200",
                    height: "630",
                    style: { width: '100%', height: '100%', objectFit: 'cover' }
                })
            ]),
            { width: 1200, height: 630 }
        );
    }

    // Fetch Token Data
    let tokenData = null;

    // Strategy 1: GeckoTerminal (Primary - As Requested)
    try {
        const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/multi/${address}`);
        if (res.ok) {
            const json = await res.json();
            // User confirmed structure: { data: [ { attributes: { name, symbol, image_url, ... } } ] }
            if (json.data && Array.isArray(json.data) && json.data.length > 0) {
                const attr = json.data[0].attributes;
                tokenData = {
                    name: attr.name || 'Unknown Token',
                    symbol: attr.symbol || 'UNK',
                    image: attr.image_url, // Gecko uses image_url
                };
            }
        }
    } catch (e) {
        console.error('GeckoTerminal fetch failed:', e);
    }

    // Strategy 2: Fallback to PumpPortal (Secondary)
    if (!tokenData) {
        try {
            const res = await fetch(`https://pumpportal.fun/api/data/token-info?address=${address}`);
            if (res.ok) {
                const data = await res.json();
                // Handle PumpPortal variants
                if (data && data.data) {
                    tokenData = {
                        name: data.data.name || 'Unknown Token',
                        symbol: data.data.symbol || 'UNK',
                        image: data.data.image,
                    };
                } else if (data && data.name) {
                    tokenData = {
                        name: data.name || 'Unknown Token',
                        symbol: data.symbol || 'UNK',
                        image: data.image,
                    };
                }
            }
        } catch (e) {
            console.error('PumpPortal fetch failed:', e);
        }
    }

    // 2. Not Found State
    // If no data found, render the Not Found overlay
    if (!tokenData) {
        return new ImageResponse(
            React.createElement('div', {
                style: {
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                }
            }, [
                React.createElement('img', {
                    src: bgUrl,
                    width: "1200",
                    height: "630",
                    style: { width: '100%', height: '100%', objectFit: 'cover' }
                }),
                React.createElement('div', {
                    style: {
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.6)', // Darker overlay for readability
                        color: 'white',
                        fontSize: 60,
                        fontWeight: 900,
                        fontFamily: '"Inter", sans-serif',
                    }
                }, 'TOKEN DATA NOT FOUND')
            ]),
            { width: 1200, height: 630 }
        );
    }

    // 3. RENDER FOUND STATE
    // Clean Layout: Symbol (Big), Name (Small), Image (Right). No Market Cap.

    return new ImageResponse(
        React.createElement('div', {
            style: {
                height: '100%',
                width: '100%',
                display: 'flex',
                position: 'relative',
                fontFamily: '"Inter", sans-serif',
                // No default background color ensure image covers
            }
        }, [
            // Background Image
            React.createElement('img', {
                src: bgUrl,
                width: "1200",
                height: "630",
                style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }
            }),

            // Left Container (Text)
            React.createElement('div', {
                style: {
                    position: 'absolute',
                    left: '80px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    maxWidth: '600px',
                    gap: '0px', // Tight spacing
                }
            }, [
                // SYMBOL (Main Title)
                // SYMBOL (Main Title)
                // Scaled ~3.8x from 26px design to ~100px for 1200px width
                React.createElement('div', {
                    style: {
                        fontSize: (tokenData.symbol && tokenData.symbol.length > 8) ? 80 : 100,
                        fontWeight: 900, // Black
                        lineHeight: 1.0,
                        letterSpacing: '-0.03em',
                        color: '#FFFFFF',
                        marginBottom: '10px',
                        maxWidth: '650px',
                        textTransform: 'uppercase',
                        display: 'flex',
                        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
                    }
                }, tokenData.symbol),

                // NAME (Subtitle)
                // Scaled ~3.8x from 10.5px design to ~40px for 1200px width
                React.createElement('div', {
                    style: {
                        fontSize: 40,
                        fontWeight: 600, // Semibold
                        lineHeight: 1.25,
                        letterSpacing: '-0.025em',
                        color: '#FFFFFF',
                        maxWidth: '650px',
                        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
                    }
                }, tokenData.name || 'Name Missing'),
            ]),

            // Right Container (Image)
            React.createElement('div', {
                style: {
                    position: 'absolute',
                    right: '80px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '415px',
                    height: '415px'
                }
            }, [
                // Ensure image loads or fallback? Edge ImageResponse usually handles valid URLs well.
                tokenData.image ? React.createElement('img', {
                    src: tokenData.image,
                    width: "415",
                    height: "415",
                    style: {
                        width: '415px',
                        height: '415px',
                        borderRadius: '24px', // Slightly rounder
                        objectFit: 'cover',
                        border: '4px solid rgba(255,255,255,0.1)' // Subtle border
                    }
                }) : null
            ]),

        ]),
        {
            width: 1200,
            height: 630,
        }
    );
}
