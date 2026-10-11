const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeUrl,
  isHomepageUrl,
  isActualProductUrl,
  buildSearchUrl
} = require("../lib/urlUtils");

describe("urlUtils", () => {
  describe("normalizeUrl", () => {
    it("returns empty string for invalid URLs", () => {
      assert.equal(normalizeUrl(""), "");
      assert.equal(normalizeUrl(null), "");
      assert.equal(normalizeUrl("not-a-url"), "");
    });

    it("normalizes standard HTTP/HTTPS URLs", () => {
      const url = "https://www.example.com/product/123?utm_source=telegram";
      const normalized = normalizeUrl(url);
      assert.ok(normalized.startsWith("https://"));
      assert.ok(!normalized.includes("utm_source"));
    });

    it("strips tracking parameters", () => {
      const url = "https://www.amazon.in/dp/B08L5WHFT9?tag=loot-21&utm_campaign=test";
      const normalized = normalizeUrl(url);
      assert.ok(!normalized.includes("tag="));
      assert.ok(!normalized.includes("utm_campaign"));
    });
  });

  describe("isHomepageUrl", () => {
    it("returns true for homepages", () => {
      assert.equal(isHomepageUrl("https://www.amazon.in/"), true);
      assert.equal(isHomepageUrl("https://www.flipkart.com"), true);
    });

    it("returns false for deep product links", () => {
      assert.equal(isHomepageUrl("https://www.amazon.in/dp/B08L5WHFT9"), false);
      assert.equal(isHomepageUrl("https://www.flipkart.com/product/p/itm123"), false);
    });
  });

  describe("isActualProductUrl", () => {
    it("identifies valid Amazon product URLs", () => {
      assert.equal(isActualProductUrl("Amazon", "https://www.amazon.in/dp/B08L5WHFT9"), true);
      assert.equal(isActualProductUrl("Amazon", "https://www.amazon.in/gp/product/B08L5WHFT9"), true);
    });

    it("identifies valid Flipkart product URLs", () => {
      assert.equal(isActualProductUrl("Flipkart", "https://www.flipkart.com/item/p/itm123"), true);
    });

    it("rejects homepages as product URLs", () => {
      assert.equal(isActualProductUrl("Amazon", "https://www.amazon.in/"), false);
    });
  });

  describe("buildSearchUrl", () => {
    it("generates correct Amazon search URL", () => {
      const searchUrl = buildSearchUrl("Amazon", "iPhone 15");
      assert.ok(searchUrl.includes("amazon.in/s?k=iPhone"));
    });

    it("generates correct Flipkart search URL", () => {
      const searchUrl = buildSearchUrl("Flipkart", "Sony Headphones");
      assert.ok(searchUrl.includes("flipkart.com/search?q="));
    });

    it("generates fallback search URL for other stores", () => {
      const searchUrl = buildSearchUrl("Myntra", "Running Shoes");
      assert.ok(searchUrl.includes("myntra.com/"));
    });
  });
});
