import { connectToDatabase } from '@/lib/mongodb';

// In-memory cache
let cachedCategories = [];
let cachedHeading = {
  title: 'Find Your Perfect Match',
  subtitle: 'Shop by Categories'
};
let cachedPayload = null;
let lastFetchTs = 0;

const CACHE_TTL_MS = 60 * 1000; // 1 minute

export async function GET(req) {
  try {
    // Fast path: serve in-memory cache while warm
    if (cachedPayload && Date.now() - lastFetchTs < CACHE_TTL_MS) {
      return Response.json(cachedPayload, {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
        }
      });
    }

    try {
      const { db } = await connectToDatabase();

      // Read only required fields from homepage settings
      const settingsDoc = await db.collection('storeSettings').findOne(
        { _id: 'homepage' },
        {
          projection: {
            'data.shopCategoriesHeading': 1,
            'data.shopCategoriesDisplay': 1
          }
        }
      );

      const settings = settingsDoc?.data || {};
      const heading = {
        title: settings?.shopCategoriesHeading?.title || 'Find Your Perfect Match',
        subtitle: settings?.shopCategoriesHeading?.subtitle || 'Shop by Categories'
      };
      const selectedIds = Array.isArray(settings?.shopCategoriesDisplay?.selectedIds)
        ? settings.shopCategoriesDisplay.selectedIds
        : [];

      // Fetch only required fields and filter in memory to avoid ID type mismatches.
      const categories = await db.collection('categories')
        .find({}, {
          projection: {
            _id: 1,
            name: 1,
            slug: 1,
            image: 1,
            parentId: 1
          }
        })
        .sort({ name: 1 })
        .limit(200)
        .toArray();

      const topLevelCategories = categories.filter((cat) => !cat.parentId);

      const baseMapped = topLevelCategories.map((cat) => ({
        _id: cat._id,
        title: cat.name,
        image: cat.image,
        link: `/category/${cat.slug || cat._id}`,
        isActive: true
      }));

      // Preserve admin-selected order when selected IDs are configured
      let mappedCategories = baseMapped.slice(0, 7);

      if (selectedIds.length > 0) {
        const selectedSet = new Set(selectedIds.map((id) => String(id)));
        const selectedPool = baseMapped.filter((cat) => selectedSet.has(String(cat._id)));

        const orderedSelected = selectedIds
          .map((id) => selectedPool.find((cat) => String(cat._id) === String(id)))
          .filter(Boolean)
          .slice(0, 7);

        // If selected IDs are stale/mismatched, fall back to top categories instead of blank UI.
        mappedCategories = orderedSelected.length > 0 ? orderedSelected : mappedCategories;
      }

      cachedCategories = mappedCategories;
      cachedHeading = heading;
      cachedPayload = {
        success: true, 
        categories: mappedCategories,
        heading
      };
      lastFetchTs = Date.now();

      console.log('✓ Shop categories payload built:', mappedCategories.length);

      return Response.json(cachedPayload, {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
        }
      });
    } catch (dbError) {
      console.error('✗ MongoDB error:', dbError.message);
      console.log('→ Using cache:', cachedCategories.length, 'categories');
      return Response.json({ 
        success: true, 
        categories: cachedCategories,
        heading: cachedHeading
      });
    }
  } catch (error) {
    console.error('✗ Error:', error);
    return Response.json({ 
      success: true, 
      categories: cachedCategories,
      heading: cachedHeading
    });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('📝 Creating category:', body.title);
    
    const category = {
      _id: new ObjectId(),
      title: body.title || '',
      image: body.image || '',
      link: body.link || '/shop',
      order: body.order || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    cachedCategories.push(category);
    
    try {
      const { db } = await connectToDatabase();
      await db.collection('shopCategories').insertOne(category);
      console.log('✓ Category saved to MongoDB');
      return Response.json({ 
        success: true, 
        message: 'Category created successfully',
        category: category
      });
    } catch (dbError) {
      console.error('⚠ MongoDB save error:', dbError.message);
      return Response.json({ 
        success: true, 
        message: 'Category created (cached)',
        category: category
      }, { status: 200 });
    }
  } catch (error) {
    console.error('✗ Error creating category:', error);
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
