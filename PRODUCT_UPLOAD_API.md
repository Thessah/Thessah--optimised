# Thessah.ae Product Upload API

This document covers only the API needed to upload product details for the Thessah.ae website.

Use this as the developer handoff for integrating product creation into Thessah.ae.

## Endpoint

- Method: `POST`
- URL: `/api/store/product`
- Content-Type: `multipart/form-data`
- Auth: `Authorization: Bearer <firebase_id_token>`

## Required Fields

Send these fields in `FormData`:

- `name`
  - Type: `string`
  - Example: `Classic Gold ID Bracelet`

- `category`
  - Type: `string`
  - Use comma-separated values if multiple categories are selected.
  - Example: `Bracelet,Bangle`

- `targetAudience`
  - Type: `string`
  - Send as JSON array string.
  - Allowed values: `men`, `women`, `kids`
  - Example: `["men","women"]`

- `stockQuantity`
  - Type: `number`
  - Example: `25`

- `description`
  - Type: `string`
  - This is the detailed description.

- `images`
  - Type: `file`
  - Send one or more files using the same key: `images`

## Optional Fields Used By The Current Form

- `sku`
  - Type: `string`

- `attributes`
  - Type: `string`
  - JSON string
  - Used for short description and extra grouped values
  - Example:

```json
{
  "shortDescription": "Lightweight everyday bracelet",
  "brand": "Thessah"
}
```

- `metalDetails`
  - Type: `string`
  - JSON string
  - Used for Jewelry Details
  - Example:

```json
[
  { "label": "Metal", "value": "Gold" },
  { "label": "Purity", "value": "22K" }
]
```

- `generalDetails`
  - Type: `string`
  - JSON string
  - Example:

```json
[
  { "label": "Closure", "value": "Hook" },
  { "label": "Occasion", "value": "Daily Wear" }
]
```

## Field Mapping From UI To API

- `name` -> `name`
- `select category` -> `category`
- `this product is for` -> `targetAudience`
- `quantity` -> `stockQuantity`
- `short desc.` -> `attributes.shortDescription`
- `Jewelry Details` -> `metalDetails`
- `Detailed Description` -> `description`
- `Product Images` -> `images`

## Example Request

```javascript
const formData = new FormData();

formData.append("name", "Classic Gold ID Bracelet");
formData.append("category", "Bracelet,Bangle");
formData.append("targetAudience", JSON.stringify(["men", "women"]));
formData.append("stockQuantity", "25");
formData.append("description", "<p>Detailed product description here</p>");

formData.append(
  "attributes",
  JSON.stringify({
    shortDescription: "Lightweight everyday bracelet",
    brand: "Thessah",
  }),
);

formData.append(
  "metalDetails",
  JSON.stringify([
    { label: "Metal", value: "Gold" },
    { label: "Purity", value: "22K" },
  ]),
);

formData.append(
  "generalDetails",
  JSON.stringify([{ label: "Occasion", value: "Daily Wear" }]),
);

formData.append("images", file1);
formData.append("images", file2);

await fetch("/api/store/product", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${firebaseIdToken}`,
  },
  body: formData,
});
```

## Success Response

```json
{
  "message": "Product added successfully",
  "product": {
    "_id": "..."
  }
}
```

## Common Validation Rules

- `name` is required
- `description` is required
- `category` is required
- At least 1 `images` file is required
- `targetAudience` accepts only `men`, `women`, `kids`
- If multiple categories are needed, send them as one comma-separated string
