require("dotenv").config();

const { scrapeGenieLootPage } = require("../src/services/telegramDealImporter");
const { enrichGenieLootDetails } = require("../src/services/dealDetailEnricher");

async function main() {
  const maxPages = Number(process.env.GENIE_LOOT_MAX_PAGES || 25);
  const limit = Number(process.env.GENIE_LOOT_ENRICH_LIMIT || 1000);
  const concurrency = Number(process.env.GENIE_LOOT_ENRICH_CONCURRENCY || 10);
  const timeoutMs = Number(process.env.GENIE_LOOT_ENRICH_TIMEOUT_MS || 3000);

  const scrape = await scrapeGenieLootPage({ maxPages });
  const enrich = await enrichGenieLootDetails({ limit, concurrency, timeoutMs });

  console.log(JSON.stringify({ success: true, scrape, enrich }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    success: false,
    message: error.message || "Genie Loot sync failed."
  }, null, 2));
  process.exit(1);
});
