import { describe, it, expect } from "vitest";

describe("Blog & Deals Filter Logic", () => {
  const samplePosts = [
    {
      id: "accountflow-offer",
      title: "AccountFlow GST Billing and Accounting Software",
      slug: "accountflow-offer",
      excerpt: "Try AccountFlow for GST billing, accounting, inventory, purchase.",
      category: "Software Deals",
      tags: ["accountflow", "gst-billing", "accounting"],
    },
    {
      id: "billflow-offer",
      title: "BillFlow GST Retail POS Billing Software",
      slug: "billflow-offer",
      excerpt: "Try BillFlow for retail POS and barcode billing.",
      category: "Software Deals",
      tags: ["billflow", "retail-pos", "gst-billing"],
    },
    {
      id: "travel-deals",
      title: "Top 10 Travel Offers This Festive Season",
      slug: "top-10-travel-offers",
      excerpt: "Save big on flights, hotels and buses.",
      category: "Travel",
      tags: ["travel", "flight", "hotels"],
    },
  ];

  it("filters posts by GST & Billing category keyword", () => {
    const keyword = "gst";
    const filtered = samplePosts.filter((p) => {
      const text = `${p.title} ${p.excerpt} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
      return text.includes(keyword);
    });
    expect(filtered.length).toBe(2);
    expect(filtered[0].title).toContain("AccountFlow");
    expect(filtered[1].title).toContain("BillFlow");
  });

  it("filters posts by search query", () => {
    const query = "travel".toLowerCase();
    const filtered = samplePosts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.excerpt.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query))
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toContain("Travel");
  });

  it("returns all posts when search query is empty", () => {
    const query = "";
    const filtered = query
      ? samplePosts.filter((p) => p.title.toLowerCase().includes(query))
      : samplePosts;
    expect(filtered.length).toBe(3);
  });
});
