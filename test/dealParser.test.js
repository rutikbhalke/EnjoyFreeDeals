const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { parseDealText, validateDeal } = require("../lib/dealParser");

describe("dealParser", () => {
  it("parses price, platform, and title from deal text", async () => {
    const text = `🔥 LOOT: Boat Rockerz 450 Bluetooth Headphones
M.R.P: ₹3,990
Deal Price: ₹1,299 (67% off)
Link: https://www.amazon.in/dp/B08L5WHFT9`;

    const parsed = await parseDealText({ message: text });
    assert.equal(parsed.platform, "Amazon");
    assert.equal(parsed.dealPrice, 1299);
    assert.equal(parsed.originalPrice, 3990);
    assert.ok(parsed.discountPercent >= 60);
    assert.ok(parsed.productTitle.includes("Boat"));
    assert.equal(parsed.category, "Electronics");
  });

  it("validates deal and detects missing platform or url", () => {
    const invalidDeal = {
      platform: "UnknownPlatform",
      productTitle: "Test item",
      productUrl: "invalid-url",
      dealPrice: 100
    };
    const validationError = validateDeal(invalidDeal);
    assert.ok(validationError.length > 0);
  });

  it("approves valid deal with supported platform and valid URL", () => {
    const validDeal = {
      platform: "Amazon",
      productTitle: "Apple iPhone 15 128GB Blue",
      productUrl: "https://www.amazon.in/dp/B0CHX1W1XY",
      dealPrice: 65999,
      originalPrice: 79900
    };
    const error = validateDeal(validDeal);
    assert.equal(error, "");
  });

  it("rejects negative prices", () => {
    const negativePriceDeal = {
      platform: "Amazon",
      productTitle: "Apple iPhone 15",
      productUrl: "https://www.amazon.in/dp/B0CHX1W1XY",
      dealPrice: -500,
      originalPrice: 1000
    };
    const error = validateDeal(negativePriceDeal);
    assert.equal(error, "Price cannot be negative");
  });
});
