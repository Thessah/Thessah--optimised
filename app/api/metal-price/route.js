import { NextResponse } from 'next/server';

const METAL_PRICE_API_KEY = 'dde28869cb1e777033ac3e9e214353e5';
const METAL_PRICE_API_URL = 'https://api.metalpriceapi.com/v1/latest';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const metalType = searchParams.get('type') || 'XAU'; // XAU = Gold, XAG = Silver, XPT = Platinum
        
        // Fetch from metal price API
        const response = await fetch(
            `${METAL_PRICE_API_URL}?api_key=${METAL_PRICE_API_KEY}&base=AED&currencies=${metalType}`,
            { next: { revalidate: 300 } } // Cache for 5 minutes
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch metal prices');
        }
        
        const data = await response.json();
        
        console.log('Metal Price API raw response:', data);
        
        // Convert troy ounce to grams (1 troy oz = 31.1035 grams)
        const TROY_OZ_TO_GRAMS = 31.1035;
        
        // The API returns rates where base=AED means "1 AED = X units of metal"
        // We need to invert to get "1 unit of metal = Y AED"
        const rateFromAPI = data.rates?.[metalType];
        if (!rateFromAPI) {
            return NextResponse.json({ error: 'Metal type not found' }, { status: 400 });
        }
        
        // Invert to get AED per troy ounce
        const aedPerOunce = 1 / rateFromAPI;
        const pricePerGram = aedPerOunce / TROY_OZ_TO_GRAMS;
        
        console.log('Calculated price per gram:', pricePerGram);
        
        return NextResponse.json({
            success: true,
            metalType,
            pricePerGram: Math.round(pricePerGram),
            pricePerOunce: Math.round(aedPerOunce),
            timestamp: data.timestamp,
            base: data.base
        });
        
    } catch (error) {
        console.error('Metal price API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch metal prices', details: error.message },
            { status: 500 }
        );
    }
}
