const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  detectPlatform,
  isSupportedPlatform,
  normalizePlatformName
} = require("../lib/platformDetector");

describe("platformDetector", () => {
  it("detects Amazon from URLs and short links", () => {
    assert.equal(detectPlatform("https://www.amazon.in/dp/B08L5WHFT9"), "Amazon");
    assert.equal(detectPlatform("Check this https://amzn.to/3xyz"), "Amazon");
  });

  it("detects Flipkart from URLs and short links", () => {
    assert.equal(detectPlatform("https://www.flipkart.com/product/p/itm123"), "Flipkart");
    assert.equal(detectPlatform("Grab deal: https://fkrt.it/xyz"), "Flipkart");
  });

  it("detects other popular Indian ecommerce platforms", () => {
    assert.equal(detectPlatform("https://www.myntra.com/tshirts/puma"), "Myntra");
    assert.equal(detectPlatform("https://www.ajio.com/clothing"), "Ajio");
    assert.equal(detectPlatform("https://www.meesho.com/saree"), "Meesho");
    assert.equal(detectPlatform("https://www.croma.com/tv"), "Croma");
    assert.equal(detectPlatform("https://www.nykaa.com/lipstick"), "Nykaa");
    assert.equal(detectPlatform("https://www.tatacliq.com/electronics"), "TataCliq");
  });

  it("normalizes platform names correctly", () => {
    assert.equal(normalizePlatformName("amazon"), "Amazon");
    assert.equal(normalizePlatformName("FLIPKART"), "Flipkart");
    assert.equal(normalizePlatformName("tata cliq"), "TataCliq");
  });

  it("checks platform support accurately", () => {
    assert.ok(isSupportedPlatform("Amazon"));
    assert.ok(isSupportedPlatform("Flipkart"));
    assert.ok(isSupportedPlatform("Myntra"));
    assert.ok(!isSupportedPlatform("UnknownRandomStore123"));
  });
});
