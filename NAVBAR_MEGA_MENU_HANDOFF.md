# Navbar Mega Menu Handoff

## Purpose

This document explains the current navbar menu and mega menu implementation, including:

- where data comes from
- how desktop dropdown behavior works
- how admin updates are saved
- what another developer should know before changing it

## Main Files

- `components/Navbar.jsx`
- `app/store/menu-management/page.jsx`
- `app/api/store/settings/route.js`
- `app/(public)/layout.jsx`

## Where It Is Rendered

- The navbar component is `Navbar` in `components/Navbar.jsx`.
- It is imported in `app/(public)/layout.jsx`.
- The desktop top navigation bar is shown only when:
  - `navMenuEnabled === true`
  - `navMenuItems.length > 0`

## Data Source and Runtime Flow

Navbar menu data is loaded from `GET /api/store/settings`.

In `components/Navbar.jsx`:

1. It reads cached values first from `sessionStorage`:
   - `nav:categories:v1`
   - `nav:menu:v1`
   - `nav:menu:enabled:v1`
   - `nav:actions:visibility:v1`
2. It then revalidates in background with parallel fetch calls:
   - `/api/categories`
   - `/api/store/settings`
3. It refreshes every 10 minutes.
4. It also listens for `window` event `navMenuUpdated` and instantly re-fetches menu settings.

This means updates from admin can appear immediately without full reload if the event is dispatched.

## Settings Schema Used By Navbar

The relevant fields returned by `/api/store/settings` are:

```json
{
  "navMenuEnabled": true,
  "navActionsVisibility": {
    "store": true,
    "wishlist": true,
    "cart": true
  },
  "navMenuItems": [
    {
      "name": "Gold",
      "link": "/category/gold",
      "icon": "https://...",
      "hasDropdown": true,
      "categoryId": "optional",
      "megaMenu": {
        "linkColumns": 1,
        "links": [{ "name": "Gold Rings", "link": "/category/gold-rings" }],
        "images": [
          {
            "url": "https://...",
            "label": "Bridal Collection",
            "link": "/category/bridal"
          }
        ]
      }
    }
  ]
}
```

Notes:

- `megaMenu` is optional.
- `linkColumns` supports `1`, `2`, or `3`.
- For generic mega dropdown rendering, at least one `megaMenu.links[]` item or `megaMenu.images[]` with `url` is required.

## Desktop Menu Behavior

There are 3 menu item behaviors:

1. Plain link item
   - Condition: no usable dropdown data
   - Output: direct `Link` to `item.link`

2. Special "Collections" category dropdown
   - Condition: `item.hasDropdown` and `item.name` includes `collection` (case-insensitive)
   - Output: 2-panel category flyout
   - Left panel: top-level categories from `/api/categories` (`!parentId`)
   - Right panel: hovered category children
   - Uses `categoriesDropdownOpen`, `hoveredCategory`, and `categoryTimer`

3. Generic mega dropdown
   - Condition: `item.hasDropdown && item.megaMenu`
   - Renders using the `MegaDropdown` component
   - Dropdown opens by hover via `openMegaIndex`
   - Close behavior uses `megaTimer` with delayed close

## MegaDropdown Component Details

`MegaDropdown` is defined at the top of `components/Navbar.jsx`.

Input props:

- `item`
- `featuredImages`
- `dropdownLinks`
- `onClose`
- `timerRef`

Layout:

- Full-width absolute panel under nav row
- Left side: links grid using `megaMenu.linkColumns`
- Right side: featured image cards (if configured)
- Optional "View all {item.name}" link appears when `item.link` exists and is not `#`

Hover handling:

- `onMouseEnter`: clears close timer
- `onMouseLeave`: starts close timer (`180ms`)

## Admin Editing Flow

Menu admin UI is in `app/store/menu-management/page.jsx`.

What admin can edit:

- `navMenuEnabled`
- `navActionsVisibility` (Store/Wishlist/Cart icon toggles)
- `navMenuItems[]` base fields (`name`, `link`, `icon`, `hasDropdown`)
- mega menu links and images
- link column count (`1/2/3`)

Save flow:

1. Admin clicks "Save Navigation Menu"
2. UI sends `PUT /api/store/settings` with:
   - `navMenuItems`
   - `navMenuEnabled`
   - `navActionsVisibility`
3. On success, admin page dispatches `window.dispatchEvent(new Event('navMenuUpdated'))`
4. Navbar receives event and re-fetches latest settings

Immediate icon upload flow:

- Nav icon upload persists immediately after upload (it does not wait for manual save button).
- Mega image upload updates form state; final persistence depends on save action.

## API Behavior

In `app/api/store/settings/route.js`:

- `GET` returns merged defaults + stored DB data.
- `PUT` merges incoming payload into existing settings.
- If DB is unavailable, it falls back to in-memory cache and still returns success.

This merge behavior is why partial updates are safe for this settings endpoint.

## Important Gotchas

1. Collections dropdown is name-based
   - It depends on `item.name` containing `collection`.
   - Renaming that menu item can accidentally disable the special category flyout behavior.

2. Link format inconsistency
   - Admin helper methods often set links to `/category/{slug}`.
   - Some navbar category links use `/shop?category={slug}`.
   - Keep routing strategy consistent when making new changes.

3. Empty mega config fallback
   - If `hasDropdown` is true but `megaMenu` has no links/images, navbar falls back to plain link.

4. Desktop only
   - Mega dropdown rendering is in the desktop (`lg`) navbar section.
   - Mobile uses overlay menu and does not render the same mega UI.

5. Timers
   - Open/close UX depends on short timeouts (`~180-200ms`).
   - If behavior feels flickery, inspect `megaTimer` and `categoryTimer` handling first.

## Recommended Safe Change Process

1. Update menu data from `Menu Management` page first.
2. Verify settings payload in browser network tab (`/api/store/settings`).
3. Test desktop hover behavior for:
   - plain links
   - collections flyout
   - generic mega dropdown
4. Test mobile menu separately.
5. Confirm `navMenuUpdated` event causes immediate navbar refresh.

## Quick Troubleshooting

- Mega menu not showing:
  - Check `navMenuEnabled` is true.
  - Check item has `hasDropdown: true`.
  - Check `megaMenu.links` or `megaMenu.images` has usable content.

- Collections flyout not showing:
  - Check item name still includes `collection`.
  - Check categories endpoint returns top-level categories.

- Admin changes not appearing immediately:
  - Confirm save request succeeded.
  - Confirm `navMenuUpdated` event dispatch occurred.
  - Hard refresh to bypass stale session cache if needed.
