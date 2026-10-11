const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { calculateDealScore, badgesForDeal } = require("../lib/dealScore");
const { parseTelegramDeal, validateFilteredDeal } = require("../lib/dealFilter");

describe("dealScore and dealFilter", () => {
  it("calculates high deal score for deep discounts", () => {
    const deal = {
      discountPercent: 80,
      dealPrice: 199,
      platform: "Amazon",
      couponCode: "SAVE20"
    };
    const score = calculateDealScore(deal);
    assert.ok(score >= 80, `Expected score >= 80, got ${score}`);
  });

  it("assigns badges correctly for hot deals", () => {
    const badges = badgesForDeal({
      discountPercent: 70,
      dealScore: 90,
      couponCode: "CODE10"
    });
    assert.equal(badges.isHotDeal, true);
    assert.equal(badges.isCouponDeal, true);
  });

  it("parses and validates telegram deal text", () => {
    const text = `Mega Loot! Sony WH-1000XM4 Wireless Headphones
Price: ₹19,990 (MRP: ₹29,990)
https://www.amazon.in/dp/B0863TXGM3`;

    const parsed = parseTelegramDeal({ message: text });
    assert.equal(parsed.platform, "Amazon");
    assert.equal(parsed.dealPrice, 19990);
    assert.equal(parsed.originalPrice, 29990);

    const validationError = validateFilteredDeal(parsed);
    assert.equal(validationError, "");
  });

  it("rejects telegram deal when dealPrice exceeds originalPrice", () => {
    const badDeal = {
      platform: "Amazon",
      productTitle: "Test Product With Long Title",
      dealPrice: 5000,
      originalPrice: 2000,
      productUrl: "https://www.amazon.in/dp/B0863TXGM3"
    };
    const error = validateFilteredDeal(badDeal);
    assert.equal(error, "Deal price is greater than original price");
  });
});
