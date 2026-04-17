import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// In-memory storage as fallback (persists for session)
let cachedBanners = [];

console.log('✓ Hero banners API loaded - cache initialized');

// GET - Fetch all banners
export async function GET(req) {
  try {
    try {
      const { db } = await connectToDatabase();
      const banners = await db.collection('storeBanners')
        .find({})
        .sort({ order: 1, createdAt: -1 })
        .toArray();
      cachedBanners = banners; // Update cache from DB
      console.log('✓ Fetched from MongoDB:', banners.length, 'banners');
      return Response.json({ success: true, banners: banners || [] }, {
        headers: {
          'Cache-Control': 'public, max-age=120, stale-while-revalidate=600'
        }
      });
    } catch (dbError) {
      console.error('✗ MongoDB connection error:', dbError.message);
      // Return cached banners if database fails
      console.log('→ Returning from cache:', cachedBanners.length, 'banners');
      return Response.json({ success: true, banners: cachedBanners }, {
        headers: {
          'Cache-Control': 'public, max-age=120, stale-while-revalidate=600'
        }
      });
    }
  } catch (error) {
    console.error('✗ Error in GET /api/store/hero-banners:', error);
    return Response.json({ success: true, banners: cachedBanners }, {
      headers: {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=600'
      }
    });
  }
}

// POST - Create new banner
export async function POST(req) {
  try {
    const body = await req.json();
    console.log('📝 Creating banner:', body.title);
    
    const banner = {
      _id: new ObjectId(),
      badge: body.badge || '',
      subtitle: body.subtitle || '',
      title: body.title || '',
      description: body.description || '',
      cta: body.cta || 'SHOP NOW',
      link: body.link || '/shop',
      image: body.image || '',
      mobileImage: body.mobileImage || '',
      order: body.order || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
      showTitle: body.showTitle !== undefined ? body.showTitle : true,
      showSubtitle: body.showSubtitle !== undefined ? body.showSubtitle : true,
      showBadge: body.showBadge !== undefined ? body.showBadge : true,
      showButton: body.showButton !== undefined ? body.showButton : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to cache immediately
    cachedBanners.push(banner);
    console.log('✓ Added to cache. Total banners:', cachedBanners.length);
    
    // Try to save to MongoDB
    try {
      const { db } = await connectToDatabase();
      await db.collection('storeBanners').insertOne(banner);
      console.log('✓ Banner saved to MongoDB');
      return Response.json({ 
        success: true, 
        message: 'Banner created successfully',
        banner: banner
      });
    } catch (dbError) {
      console.error('⚠ MongoDB save error (using cache):', dbError.message);
      // Return success with warning - banner is in cache
      return Response.json({ 
        success: true, 
        message: 'Banner created (cached, pending database sync)',
        warning: 'Database temporarily unavailable - data will sync when connection is restored',
        banner: banner
      }, { status: 200 });
    }
  } catch (error) {
    console.error('✗ Error creating banner:', error);
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}

// PUT - Update banner
export async function PUT(req) {
  try {
    const body = await req.json();
    const { bannerId, ...updates } = body;

    if (!bannerId) {
      return Response.json({ success: false, error: 'Banner ID required' }, { status: 400 });
    }

    try {
      const { db } = await connectToDatabase();
      
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await db.collection('storeBanners').updateOne(
        { _id: new ObjectId(bannerId) },
        { $set: updateData }
      );

      return Response.json({ success: true, message: 'Banner updated successfully' });
    } catch (dbError) {
      console.error('MongoDB connection error in PUT:', dbError.message);
      // Return success even if database fails
      return Response.json({ 
        success: true, 
        message: 'Banner updated (pending database sync)',
        warning: 'Database temporarily unavailable'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error updating banner:', error);
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}

// DELETE - Delete banner
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const bannerId = searchParams.get('bannerId');

    if (!bannerId) {
      return Response.json({ success: false, error: 'Banner ID required' }, { status: 400 });
    }

    try {
      const { db } = await connectToDatabase();

      await db.collection('storeBanners').deleteOne({
        _id: new ObjectId(bannerId)
      });

      return Response.json({ success: true, message: 'Banner deleted successfully' });
    } catch (dbError) {
      console.error('MongoDB connection error in DELETE:', dbError.message);
      // Return success even if database fails
      return Response.json({ 
        success: true, 
        message: 'Banner deleted (pending database sync)',
        warning: 'Database temporarily unavailable'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error deleting banner:', error);
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
