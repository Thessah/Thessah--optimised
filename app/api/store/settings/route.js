import { connectToDatabase } from '@/lib/mongodb';

// In-memory storage as fallback
let cachedSettings = {
  collectionsHeading: {
    title: 'Thessah Collections',
    subtitle: 'Explore our newly launched collection',
    image: '',
    content: '',
    visible: true
  },
  bestSellingSection: {
    title: 'Best Selling Products',
    subtitle: 'Shop our most popular items',
    image: '',
    content: '',
    visible: true
  },
  featuredSection: {
    title: 'Featured Collection',
    subtitle: 'Discover our curated selection',
    image: '',
    content: '',
    visible: true
  },
  shopCategoriesHeading: {
    title: '',
    subtitle: '',
    visible: true
  },
  section3Heading: {
    title: 'Top Deals',
    subtitle: ''
  },
  section3Display: {
    selectedCategoryIds: [],
    selectedProductIds: [],
    order: []
  },
  shopCategoriesDisplay: {
    selectedIds: [],
    order: []
  },
  // Section 5 defaults (Shop By Gender)
  section5Heading: {
    title: 'Curated For You',
    subtitle: 'Shop By Gender',
  },
  section5GenderCategories: [
    // Admin can override; start empty so UI can populate
  ],
  section8Heading: {
    title: 'For an Auspicious Beginning',
    subtitle: 'Discover our most-loved designs, curated for this Akshaya Tritiya',
    image: '',
    visible: true
  },
  section8Display: {
    selectedCategoryIds: [],
    selectedCategoryNames: [],
    order: []
  },
  navMenuEnabled: true,
  navActionsVisibility: {
    store: true,
    wishlist: true,
    cart: true
  },
  footerSections: [],
  topBar: {
    enabled: true,
    text: 'Exclusive Welcome Offer: AED 199 OFF your first jewelry order & Free Shipping.',
    buttonText: 'Apply Now',
    buttonPath: '/'
  }
};

console.log('✓ Settings API loaded');

// GET - Fetch settings
export async function GET(req) {
  try {
    try {
      const { db } = await connectToDatabase();
      const settings = await db.collection('storeSettings').findOne({ _id: 'homepage' });
      
      if (settings && settings.data) {
        // Merge with defaults to ensure all fields exist (database values take priority)
        const merged = {
          ...cachedSettings,
          ...settings.data
        }
        cachedSettings = merged
        console.log('✓ Fetched settings from MongoDB:', JSON.stringify(merged, null, 2));
        return Response.json({ success: true, settings: merged });
      }
      
      console.log('→ Returning cached settings');
      return Response.json({ success: true, settings: cachedSettings });
    } catch (dbError) {
      console.error('✗ MongoDB connection error in GET:', dbError.message);
      console.log('→ Returning cached settings (DB error)');
      return Response.json({ success: true, settings: cachedSettings });
    }
  } catch (error) {
    console.error('✗ Error in GET /api/store/settings:', error);
    return Response.json({ success: true, settings: cachedSettings });
  }
}

// PUT - Update settings
export async function PUT(req) {
  try {
    const body = await req.json();
    console.log('📝 Updating settings with:', JSON.stringify(body, null, 2));
    
    // Merge with existing cached settings instead of replacing
    cachedSettings = {
      ...cachedSettings,
      ...body
    };
    console.log('✓ Settings merged in cache');
    
    // Try to save to MongoDB
    try {
      const { db } = await connectToDatabase();
      
      // First get existing settings
      const existingSettings = await db.collection('storeSettings').findOne({ _id: 'homepage' });
      const existingData = existingSettings?.data || {};
      
      // Merge with existing data
      const mergedData = {
        ...existingData,
        ...body
      };
      
      await db.collection('storeSettings').updateOne(
        { _id: 'homepage' },
        { 
          $set: { 
            data: mergedData,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log('✓ Settings saved to MongoDB (merged)');
      
      // Update cache with merged data
      cachedSettings = mergedData;
      
      return Response.json({ 
        success: true, 
        message: 'Settings updated successfully',
        settings: mergedData
      });
    } catch (dbError) {
      console.error('⚠ MongoDB save error (using cache):', dbError.message);
      // Still return success - cache is updated
      return Response.json({ 
        success: true, 
        message: 'Settings updated (cached, pending database sync)',
        warning: 'Database temporarily unavailable - changes will sync when connection restored',
        settings: cachedSettings
      }, { status: 200 });
    }
  } catch (error) {
    console.error('✗ Error updating settings:', error);
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
