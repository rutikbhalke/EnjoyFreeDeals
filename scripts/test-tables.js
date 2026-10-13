require('dotenv').config();
const { listAdminTables } = require('../src/repositories/adminDatabaseRepository');
const { supabaseAdmin, supabasePublic } = require('../src/config/supabaseClient');

async function run() {
  console.log('Testing Supabase Connection & Admin Tables...\n');
  const result = await listAdminTables();

  console.log('================ SUMMARY ================');
  console.log(`Total Tables Monitored : ${result.summary.total}`);
  console.log(`Available & Healthy    : ${result.summary.ok}`);
  console.log(`Missing                : ${result.summary.missing}`);
  console.log(`Errors                 : ${result.summary.error}`);
  console.log('=========================================\n');

  console.log('--- ALL TABLES BREAKDOWN ---');
  for (const t of result.tables) {
    const statusStr = t.status === 'ok' ? '✓ OK' : `✗ ${t.status.toUpperCase()}`;
    const rowStr = t.count !== null ? `${t.count} rows`.padEnd(12) : `ERR: ${t.errorMessage || t.errorCode}`.padEnd(12);
    console.log(`- ${statusStr.padEnd(8)} | ${t.name.padEnd(28)} | ${t.group.padEnd(13)} | ${rowStr} | Latency: ${t.latencyMs}ms`);
  }

  const latestMigrationTables = [
    'products',
    'product_offers',
    'fetch_runs',
    'saved_deals',
    'price_alerts',
    'recently_viewed_deals',
    'telegram_channels',
    'scrape_logs',
    'telegram_sources',
    'price_tracking_requests',
    'tracked_products',
    'upvoted_deals',
    'deal_upvotes'
  ];

  console.log('\n--- 13 NEW CONSOLIDATED MIGRATION TABLES ---');
  for (const name of latestMigrationTables) {
    const t = result.tables.find(x => x.name === name);
    if (!t) {
      console.log(`- ? UNKNOWN: ${name}`);
      continue;
    }
    const status = t.status === 'ok' ? '✓ ACTIVE' : `✗ ${t.status.toUpperCase()}`;
    console.log(`- ${status.padEnd(10)} | ${name.padEnd(26)} | Rows: ${t.count !== null ? t.count : 'N/A'}`);
  }

  console.log('\n--- PUBLIC & SERVICE ROLE ACCESS CHECKS ---');
  const sampleTables = ['telegram_channels', 'telegram_sources', 'products', 'tracked_products', 'upvoted_deals', 'deals'];
  for (const tbl of sampleTables) {
    const { data: pubData, error: pubErr } = await supabasePublic.from(tbl).select('*').limit(1);
    const { data: adminData, error: adminErr } = await supabaseAdmin.from(tbl).select('*').limit(1);
    const pubRes = pubErr ? `ERR (${pubErr.code || pubErr.message})` : `OK (${pubData?.length || 0} sample rows)`;
    const adminRes = adminErr ? `ERR (${adminErr.code || adminErr.message})` : `OK (${adminData?.length || 0} sample rows)`;
    console.log(`- Table ${tbl.padEnd(22)} -> Public Anon: ${pubRes.padEnd(24)} | Service Role: ${adminRes}`);
  }

  console.log('\n--- DEALS SCHEMA CHECK ---');
  const { data: dealSample, error: dealErr } = await supabaseAdmin.from('deals').select('id, upvote_count').limit(1);
  if (dealErr) {
    console.log(`- upvote_count column on deals: FAIL (${dealErr.message})`);
  } else {
    console.log(`- upvote_count column on deals: OK (Column exists and readable)`);
  }
}

run().catch(err => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
