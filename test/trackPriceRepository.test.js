const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { extractPlatformProductId } = require("../src/repositories/trackPriceRepository");

describe("trackPriceRepository", () => {
  describe("extractPlatformProductId", () => {
    it("extracts ASIN from Amazon URL", () => {
      const pid = extractPlatformProductId("https://www.amazon.in/dp/B08L5WHFT9", "Amazon");
      assert.equal(pid, "B08L5WHFT9");
    });

    it("extracts ASIN even if storeName is omitted", () => {
      const pid = extractPlatformProductId("https://www.amazon.in/dp/B08L5WHFT9");
      assert.equal(pid, "B08L5WHFT9");
    });

    it("extracts PID from Flipkart URL with pid parameter", () => {
      const pid = extractPlatformProductId("https://www.flipkart.com/item/p/itm123?pid=MOBGTAGPAQNVFZZY", "Flipkart");
      assert.equal(pid, "MOBGTAGPAQNVFZZY");
    });

    it("extracts itm ID from Flipkart URL when pid query is absent", () => {
      const pid = extractPlatformProductId("https://www.flipkart.com/item/p/itm123", "Flipkart");
      assert.equal(pid, "itm123");
    });

    it("returns empty string for invalid product URLs without product IDs", () => {
      const pid = extractPlatformProductId("https://www.amazon.in/b?node=12345");
      assert.equal(pid, "");
    });
  });

  describe("trackProductPrice input validation", () => {
    it("throws 400 error for invalid or empty URL", async () => {
      const { trackProductPrice } = require("../src/repositories/trackPriceRepository");
      await assert.rejects(
        async () => {
          await trackProductPrice("");
        },
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /valid productUrl is required/i);
          return true;
        }
      );
    });

    it("throws 400 error for non-HTTP URL", async () => {
      const { trackProductPrice } = require("../src/repositories/trackPriceRepository");
      await assert.rejects(
        async () => {
          await trackProductPrice("not-a-url");
        },
        (err) => {
          assert.equal(err.statusCode, 400);
          return true;
        }
      );
    });
  });
});
