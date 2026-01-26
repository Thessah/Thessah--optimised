import React from "react";

const DetailsCard = ({ title, icon, items = [] }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[#B8860B] text-xl">{icon || "🪙"}</span>
        <h3 className="text-base font-semibold tracking-wide text-[#B8860B]">{title}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((it, idx) => (
          <div key={idx} className="text-left">
            <div className="text-lg font-bold text-gray-900">{it.value ?? "NA"}</div>
            <div className="text-xs text-gray-500">{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailsCard;
