import Link from "next/link";
import { ArrowRight, HomeIcon, LayoutListIcon } from "lucide-react";

const adminSections = [
  {
    title: "Hero Banners",
    href: "/store/hero-banners",
    description: "Manage the homepage hero carousel and spotlight offers.",
    icon: HomeIcon,
  },
  {
    title: "Collections",
    href: "/store/collections",
    description: "Curate featured collections showcased across the store.",
    icon: LayoutListIcon,
  },
  {
    title: "Section 3",
    href: "/store/section-3",
    description: "Manage Section 3 highlights on the homepage.",
    icon: LayoutListIcon,
  },
  {
    title: "Section 4",
    href: "/store/section-4",
    description: "Configure Section 4 visuals and links.",
    icon: LayoutListIcon,
  },
  {
    title: "Section 5",
    href: "/store/section-5",
    description: "Control Section 5 tiles and featured items.",
    icon: LayoutListIcon,
  },
  {
    title: "Section 6",
    href: "/store/section-6",
    description: "Adjust Section 6 copy and destinations.",
    icon: LayoutListIcon,
  },
  {
    title: "Section 7",
    href: "/store/section-7",
    description: "Set up Section 7 promos and callouts.",
    icon: LayoutListIcon,
  },
  {
    title: "Section 8",
    href: "/store/section-8",
    description: "Choose categories and heading for the new product carousel.",
    icon: LayoutListIcon,
  },
];

export default function StoreHome() {
  return (
    <div className="text-slate-700 mb-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-slate-500">Home Content</p>
          <h1 className="text-2xl font-semibold">Quick access</h1>
          <p className="text-slate-500 text-sm mt-1">
            Open any homepage section below to edit its content.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group border border-slate-200 rounded-lg p-4 flex flex-col gap-3 hover:border-blue-500 hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:text-blue-600">
                  <Icon size={18} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800 group-hover:text-blue-600">
                    {section.title}
                  </h2>
                  <p className="text-sm text-slate-500 leading-5">{section.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold">
                Go to page
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
