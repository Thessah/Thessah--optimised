"use client";
import { useState, useEffect } from "react";

export default function AppProductPage() {
  const [productId, setProductId] = useState("");
  const [metalDetails, setMetalDetails] = useState([
    { label: "Karatage", value: "" },
    { label: "Material Colour", value: "" },
    { label: "Metal", value: "" },
    { label: "Size", value: "" },
  ]);
  const [generalDetails, setGeneralDetails] = useState([
    { label: "Jewellery Type", value: "" },
    { label: "Brand", value: "" },
    { label: "Collection", value: "" },
    { label: "Gender", value: "" },
    { label: "Occasion", value: "" },
  ]);

  const updateItem = (setter) => (idx, field, val) => {
    setter((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
  };

  const addRow = (setter) => () => setter((prev) => [...prev, { label: "", value: "" }]);
  const removeRow = (setter) => (idx) => setter((prev) => prev.filter((_, i) => i !== idx));

  const saveLocal = () => {
    if (!productId) return alert("Enter Product ID");
    const map = JSON.parse(localStorage.getItem("productDetailsOverrides") || "{}");
    map[productId] = { metalDetails, generalDetails };
    localStorage.setItem("productDetailsOverrides", JSON.stringify(map));
    alert("Saved locally. Open the product page to see changes.");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Add Product Details</h1>
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <label className="block text-sm font-medium">Product ID</label>
        <input value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. 64f..." />
      </div>

      <section className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Metal Details</h2>
          <button onClick={addRow(setMetalDetails)} className="text-sm px-3 py-1 rounded border">+ Add Row</button>
        </div>
        <div className="mt-4 space-y-3">
          {metalDetails.map((it, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-3">
              <input value={it.label} onChange={(e) => updateItem(setMetalDetails)(idx, "label", e.target.value)} className="border rounded px-3 py-2" placeholder="Label" />
              <div className="flex gap-2">
                <input value={it.value} onChange={(e) => updateItem(setMetalDetails)(idx, "value", e.target.value)} className="border rounded px-3 py-2 flex-1" placeholder="Value" />
                <button onClick={() => removeRow(setMetalDetails)(idx)} className="px-3 py-2 border rounded">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">General Details</h2>
          <button onClick={addRow(setGeneralDetails)} className="text-sm px-3 py-1 rounded border">+ Add Row</button>
        </div>
        <div className="mt-4 space-y-3">
          {generalDetails.map((it, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-3">
              <input value={it.label} onChange={(e) => updateItem(setGeneralDetails)(idx, "label", e.target.value)} className="border rounded px-3 py-2" placeholder="Label" />
              <div className="flex gap-2">
                <input value={it.value} onChange={(e) => updateItem(setGeneralDetails)(idx, "value", e.target.value)} className="border rounded px-3 py-2 flex-1" placeholder="Value" />
                <button onClick={() => removeRow(setGeneralDetails)(idx)} className="px-3 py-2 border rounded">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <button onClick={saveLocal} className="px-4 py-2 rounded bg-black text-white">Save Locally</button>
      </div>
    </div>
  );
}
