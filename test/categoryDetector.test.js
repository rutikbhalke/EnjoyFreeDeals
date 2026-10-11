const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { detectCategory } = require("../lib/categoryDetector");

describe("categoryDetector", () => {
  it("detects Electronics from titles and descriptions", () => {
    assert.equal(detectCategory("Boat Airdopes Wireless Earbuds at 70% off"), "Electronics");
    assert.equal(detectCategory("Dell Inspiron Laptop Core i5"), "Electronics");
  });

  it("detects Mobiles category", () => {
    assert.equal(detectCategory("Apple iPhone 15 128GB Blue"), "Mobiles");
    assert.equal(detectCategory("Samsung Galaxy S24 Ultra"), "Mobiles");
  });

  it("detects Fashion and Footwear", () => {
    assert.equal(detectCategory("Puma Men Running Shoes at Rs 999"), "Footwear");
    assert.equal(detectCategory("Levis Slim Fit Cotton Shirt"), "Fashion");
  });

  it("detects Grocery and Food Offers", () => {
    assert.equal(detectCategory("Fortune Sunlite Refined Sunflower Oil 1L"), "Grocery");
    assert.equal(detectCategory("Flat 50% Off on Dominos Pizza Zomato"), "Food Offers");
  });

  it("falls back to Other Deals when no rules match", () => {
    assert.equal(detectCategory("Miscellaneous Mystery Item"), "Other Deals");
  });
});
