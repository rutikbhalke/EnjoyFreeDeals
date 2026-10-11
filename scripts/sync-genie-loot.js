require("dotenv").config();

const { scrapeGenieLootPage } = require("../src/services/telegramDealImporter");
const { enrichGenieLootDetails } = require("../src/services/dealDetailEnricher");

async function main() {
  const maxPages = Number(process.env.GENIE_LOOT_MAX_PAGES || 10);
  const limit = Number(process.env.GENIE_LOOT_ENRICH_LIMIT || 200);
  const concurrency = Number(process.env.GENIE_LOOT_ENRICH_CONCURRENCY || 8);
  const timeoutMs = Number(process.env.GENIE_LOOT_ENRICH_TIMEOUT_MS || 4000);

  console.log("=== STEP 1: Scraping connected Telegram channels ===");
  console.log(JSON.stringify({ maxPages, limit, concurrency, timeoutMs }, null, 2));

  const scrape = await scrapeGenieLootPage({ maxPages, allDeals: true });
  console.log("Scrape completed successfully:");
  console.log(JSON.stringify({
    pageUrls: scrape.pageUrls,
    messageCount: scrape.messageCount,
    candidateDealCount: scrape.candidateDealCount,
    dealCount: scrape.dealCount,
    imported: scrape.imported,
    updated: scrape.updated,
    skipped: scrape.skipped,
    failed: scrape.failed,
    pruned: scrape.pruned
  }, null, 2));

  console.log("\n=== STEP 2: Enriching product images & details ===");
  const enrich = await enrichGenieLootDetails({ limit, concurrency, timeoutMs });
  console.log("Enrichment completed successfully:");
  console.log(JSON.stringify({
    requested: enrich.requested,
    enriched: enrich.enriched,
    skipped: enrich.skipped,
    failed: enrich.failed,
    sampleEnriched: enrich.results.filter(r => r.status === "enriched").slice(0, 5)
  }, null, 2));

  console.log("\n=== Telegram Sync & Product Enrichment Fully Finished ===");
}

main().catch((error) => {
  console.error("Genie Loot sync failed:", error);
  process.exit(1);
});
