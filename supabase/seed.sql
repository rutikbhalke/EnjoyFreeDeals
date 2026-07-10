-- EnjoyFreeDeals sample deals seed data.
-- Safe to run multiple times. Existing rows are matched by slug and updated.

insert into public.sample_whatsapp_otp_logins (mobile, otp_code, display_name, is_active)
values ('+919699353648', '123456', 'WhatsApp User', true)
on conflict (mobile) do update set
  otp_code = excluded.otp_code,
  display_name = excluded.display_name,
  is_active = excluded.is_active,
  updated_at = now();

with category_values(name, slug) as (
  values
    ('Electronics', 'electronics'),
    ('Mobile Deals', 'mobile'),
    ('Fashion', 'fashion'),
    ('Home & Kitchen', 'home'),
    ('Grocery', 'grocery'),
    ('Beauty', 'beauty'),
    ('Student Deals', 'student')
),
upsert_categories as (
  insert into public.categories (name, slug, is_active)
  select name, slug, true
  from category_values
  on conflict (slug) do update set
    name = excluded.name,
    is_active = true
  returning id, slug
),
store_values(name, slug, website_url, logo_url) as (
  values
    ('Amazon', 'amazon', 'https://www.amazon.in', 'https://www.google.com/s2/favicons?domain=amazon.in&sz=128'),
    ('Flipkart', 'flipkart', 'https://www.flipkart.com', 'https://www.google.com/s2/favicons?domain=flipkart.com&sz=128'),
    ('Myntra', 'myntra', 'https://www.myntra.com', 'https://www.google.com/s2/favicons?domain=myntra.com&sz=128'),
    ('Ajio', 'ajio', 'https://www.ajio.com', 'https://www.google.com/s2/favicons?domain=ajio.com&sz=128'),
    ('Croma', 'croma', 'https://www.croma.com', 'https://www.google.com/s2/favicons?domain=croma.com&sz=128'),
    ('JioMart', 'jiomart', 'https://www.jiomart.com', 'https://www.google.com/s2/favicons?domain=jiomart.com&sz=128'),
    ('Nykaa', 'nykaa', 'https://www.nykaa.com', 'https://www.google.com/s2/favicons?domain=nykaa.com&sz=128')
),
upsert_stores as (
  insert into public.stores (name, slug, website_url, logo_url, is_active)
  select name, slug, website_url, logo_url, true
  from store_values
  on conflict (slug) do update set
    name = excluded.name,
    website_url = excluded.website_url,
    logo_url = excluded.logo_url,
    is_active = true
  returning id, slug
),
deal_values(
  slug,
  title,
  description,
  store_slug,
  category_slug,
  original_price,
  discounted_price,
  discount_percentage,
  coupon_code,
  image_url,
  affiliate_link,
  source_product_id
) as (
  values
    (
      'amazon-boat-earbuds',
      'boAt Bluetooth Earbuds',
      'Deep bass wireless earbuds with fast charging case.',
      'amazon',
      'electronics',
      3999,
      1599,
      60,
      'BOAT60',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80',
      'https://www.amazon.in/dp/B0CBOAT60',
      'B0CBOAT60'
    ),
    (
      'flipkart-realme-phone',
      'Realme Smartphone',
      '5G smartphone offer with exchange and bank savings.',
      'flipkart',
      'mobile',
      16999,
      13599,
      20,
      'REALME20',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
      'https://www.flipkart.com/realme-5g-smartphone/p/itmrealme20',
      'itmrealme20'
    ),
    (
      'myntra-running-shoes',
      'Sports Shoes',
      'Lightweight running shoes with extra coupon savings.',
      'myntra',
      'fashion',
      3499,
      1575,
      55,
      'RUN55',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
      'https://www.myntra.com/sports-shoes/example-running-shoes/123456/buy',
      'myntra-123456'
    ),
    (
      'ajio-cotton-tshirt',
      'Men''s T-Shirt',
      'Premium cotton t-shirt with casual weekend pricing.',
      'ajio',
      'fashion',
      999,
      499,
      50,
      'AJIO50',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
      'https://www.ajio.com/cotton-crew-neck-tshirt/p/ajio50',
      'ajio50'
    ),
    (
      'croma-bluetooth-speaker',
      'Bluetooth Speaker',
      'Portable speaker with punchy sound and compact design.',
      'croma',
      'electronics',
      2499,
      1749,
      30,
      'CROMA30',
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80',
      'https://www.croma.com/portable-bluetooth-speaker/p/123456',
      'croma-123456'
    ),
    (
      'jiomart-grocery-combo',
      'Grocery Combo',
      'Monthly grocery saver pack with staples and snacks.',
      'jiomart',
      'grocery',
      1999,
      1499,
      25,
      'GROCERY25',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
      'https://www.jiomart.com/p/groceries/monthly-grocery-combo/590001',
      'jiomart-590001'
    ),
    (
      'nykaa-beauty-combo',
      'Beauty Combo',
      'Skincare and makeup essentials combo offer.',
      'nykaa',
      'beauty',
      1999,
      1299,
      35,
      'BEAUTY35',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
      'https://www.nykaa.com/beauty-essentials-combo/p/beauty35',
      'beauty35'
    ),
    (
      'croma-student-laptop',
      'Student Laptop Deal',
      'Lightweight laptop with student exchange and bank discount.',
      'croma',
      'student',
      52999,
      44999,
      15,
      'STUDENT15',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
      'https://www.croma.com/student-laptop-deal/p/243156',
      'croma-243156'
    )
),
resolved_deals as (
  select
    deal_values.*,
    upsert_stores.id as store_id,
    upsert_categories.id as category_id
  from deal_values
  join upsert_stores on upsert_stores.slug = deal_values.store_slug
  join upsert_categories on upsert_categories.slug = deal_values.category_slug
)
insert into public.deals (
  title,
  slug,
  description,
  store_id,
  category_id,
  original_price,
  discounted_price,
  discount_percentage,
  coupon_code,
  cashback_percentage,
  affiliate_link,
  image_url,
  expiry_date,
  status,
  is_featured,
  is_verified,
  source,
  source_product_id,
  source_url,
  dedupe_key,
  last_scraped_at,
  raw_source_payload
)
select
  title,
  slug,
  description,
  store_id,
  category_id,
  original_price,
  discounted_price,
  discount_percentage,
  coupon_code,
  0,
  affiliate_link,
  image_url,
  now() + interval '7 days',
  'active',
  discount_percentage >= 50,
  true,
  'DISCOUNT',
  source_product_id,
  affiliate_link,
  'seed:' || slug,
  now(),
  jsonb_build_object(
    'connectorMode', 'html-scrape',
    'imageUrl', image_url,
    'jsonLdFound', true,
    'sourceKey', 'seed',
    'normalizedAt', now()
  )
from resolved_deals
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  store_id = excluded.store_id,
  category_id = excluded.category_id,
  original_price = excluded.original_price,
  discounted_price = excluded.discounted_price,
  discount_percentage = excluded.discount_percentage,
  coupon_code = excluded.coupon_code,
  affiliate_link = excluded.affiliate_link,
  image_url = excluded.image_url,
  expiry_date = excluded.expiry_date,
  status = excluded.status,
  is_featured = excluded.is_featured,
  is_verified = excluded.is_verified,
  source = excluded.source,
  source_product_id = excluded.source_product_id,
  source_url = excluded.source_url,
  dedupe_key = excluded.dedupe_key,
  last_scraped_at = excluded.last_scraped_at,
  raw_source_payload = excluded.raw_source_payload,
  updated_at = now();

with static_blog_deals (
  slug,
  product_title,
  offer_label,
  deal_type,
  excerpt,
  description,
  product_url,
  cover_image,
  tags
) as (
  values
    (
      'accountflow-gst-billing-accounting-software-offer',
      'AccountFlow GST Billing and Accounting Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try AccountFlow for GST billing, accounting, inventory, purchase, payment tracking, reports and WhatsApp invoices. Free 14-day trial available.',
      'AccountFlow is a desktop GST billing and accounting product for businesses that need inventory, purchase tracking, payment follow-up, reports, WhatsApp invoices and safe updates in one billing workflow.',
      'https://bizflowindia.cloud/accountflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['accountflow', 'gst-billing', 'accounting', 'inventory']::text[]
    ),
    (
      'academyflow-coaching-academy-management-software-offer',
      'AcademyFlow Coaching and Academy Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try AcademyFlow for student enrollment, fees, batches, attendance and performance tracking. Free 14-day trial available.',
      'AcademyFlow helps coaching institutes and academies manage admissions, fee collection, batch schedules, attendance and student performance without juggling separate registers or spreadsheets.',
      'https://bizflowindia.cloud/bizflow/academyflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['academyflow', 'coaching-management', 'academy-management', 'fees']::text[]
    ),
    (
      'billflow-gst-retail-pos-billing-software-offer',
      'BillFlow GST Retail POS Billing Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try BillFlow for GST retail billing, barcode POS, inventory, multi-store work and WhatsApp receipts. Free 14-day trial available.',
      'BillFlow is built for Indian retail teams that need fast GST invoices, barcode scanning, stock control, multi-store billing and receipt sharing from one POS workflow.',
      'https://bizflowindia.cloud/bizflow/billflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['billflow', 'retail-pos', 'gst-billing', 'barcode-pos']::text[]
    ),
    (
      'cateringflow-catering-business-management-software-offer',
      'CateringFlow Catering Business Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try CateringFlow for catering orders, menus, event schedules, billing and inventory. Free 14-day trial available.',
      'CateringFlow supports catering businesses with order planning, menu management, event scheduling, stock tracking, billing and follow-ups for each event.',
      'https://bizflowindia.cloud/bizflow/cateringflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['cateringflow', 'catering-management', 'event-orders', 'billing']::text[]
    ),
    (
      'chatflow-whatsapp-business-chatbot-software-offer',
      'ChatFlow WhatsApp Business API and Chatbot Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try ChatFlow for WhatsApp Business API messaging, bulk campaigns, bots and lead capture. Free 14-day trial available.',
      'ChatFlow helps teams manage two-way WhatsApp conversations, automated replies, lead capture and campaign workflows from a business-friendly messaging setup.',
      'https://bizflowindia.cloud/bizflow/chatflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['chatflow', 'whatsapp-business', 'chatbot', 'lead-capture']::text[]
    ),
    (
      'contractorflow-construction-contractor-management-software-offer',
      'ContractorFlow Construction and Contractor Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try ContractorFlow for estimates, project billing, labor tracking, materials and site reports. Free 14-day trial available.',
      'ContractorFlow gives contractors one place to manage project estimates, material usage, labor records, billing, payments and practical site reporting.',
      'https://bizflowindia.cloud/bizflow/contractorflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['contractorflow', 'construction-management', 'contractor-billing', 'site-reports']::text[]
    ),
    (
      'dairyflow-dairy-management-software-offer',
      'DairyFlow Dairy Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try DairyFlow for milk collection, fat/SNF testing, dairy records, payments and reports. Free 14-day trial available.',
      'DairyFlow digitizes daily milk collection, fat and SNF testing, supplier records, payment tracking and dairy reports for Indian dairy businesses.',
      'https://bizflowindia.cloud/bizflow/dairyflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['dairyflow', 'dairy-management', 'milk-collection', 'payments']::text[]
    ),
    (
      'eduflow-education-management-software-offer',
      'EduFlow Education Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try EduFlow for students, faculty, fees, attendance, hostel, library, transport, exams and placements. Free 14-day trial available.',
      'EduFlow is an education management platform for schools, colleges, universities and institutes that need student records, faculty workflows, fee collection, attendance, exams, hostel, library, transport, placements and reports.',
      'https://bizflowindia.cloud/bizflow/eduflow',
      'https://storage.googleapis.com/gpt-engineer-file-uploads/lAaVSYx4RVVmxIS64ld97TLZWug1/social-images/social-1760781174571-clg%20crm.JPG',
      array['eduflow', 'education-management', 'school-erp', 'college-erp']::text[]
    ),
    (
      'exportflow-15-day-free-demo',
      'ExportFlow Software',
      'Free 15-Day Demo',
      'Free 15-day demo offer.',
      'Get a free 15-day ExportFlow demo for export invoices, shipment tracking, payment follow-up and reports. Demo booking: 8888567870.',
      'Use the demo to try export documentation, GST export invoices, proforma invoices, multi-currency payment tracking, shipment and freight tracking, customer ledgers, export cost calculations and reports with your real workflow.',
      'https://bizflowindia.cloud/bizflow/exportflow',
      'https://freedeals1.vercel.app/exportflow-document-hub.png',
      array['exportflow', 'export-management', 'shipping-management', 'free-demo']::text[]
    ),
    (
      'garageflow-garage-workshop-management-software-offer',
      'GarageFlow Garage and Workshop Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try GarageFlow for job cards, service history, spare parts, estimates, billing and reminders. Free 14-day trial available.',
      'GarageFlow helps garages and workshops manage vehicle job cards, service history, spare parts, estimates, GST invoices, mechanic tasks, payments and WhatsApp reminders.',
      'https://bizflowindia.cloud/bizflow/garageflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['garageflow', 'garage-management', 'workshop-management', 'job-cards']::text[]
    ),
    (
      'giftflow-gift-shop-hamper-business-software-offer',
      'GiftFlow Gift Shop and Hamper Business Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try GiftFlow for gift catalog, custom orders, hamper tracking, delivery and billing. Free 14-day trial available.',
      'GiftFlow helps gift shops and hamper businesses manage product catalogs, custom orders, delivery tracking, customer records and billing from one place.',
      'https://bizflowindia.cloud/bizflow/giftflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['giftflow', 'gift-shop', 'hamper-business', 'delivery-tracking']::text[]
    ),
    (
      'imageflow-photo-studio-management-software-offer',
      'ImageFlow Photo Studio Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try ImageFlow for bookings, order tracking, album workflow, billing and customer management. Free 14-day trial available.',
      'ImageFlow supports photo studios with booking records, order tracking, album design workflow, billing, customer details and delivery follow-ups.',
      'https://bizflowindia.cloud/bizflow/imageflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['imageflow', 'photo-studio', 'booking-management', 'album-workflow']::text[]
    ),
    (
      'influencerflow-influencer-marketing-platform-offer',
      'InfluencerFlow Influencer Marketing Platform',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try InfluencerFlow for campaign management, content tracking, payments and ROI analytics. Free 14-day trial available.',
      'InfluencerFlow helps brands and agencies track influencer campaigns, deliverables, content approvals, payments and campaign performance in one workflow.',
      'https://bizflowindia.cloud/bizflow/influencerflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['influencerflow', 'influencer-marketing', 'campaign-management', 'analytics']::text[]
    ),
    (
      'labflow-pathology-lab-management-software-offer',
      'LabFlow Pathology Lab Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try LabFlow for sample tracking, report generation, doctor links and lab billing. Free 14-day trial available.',
      'LabFlow gives pathology labs a digital workflow for sample registration, tracking, report generation, doctor/customer records and billing.',
      'https://bizflowindia.cloud/bizflow/labflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['labflow', 'pathology-lab', 'sample-tracking', 'reports']::text[]
    ),
    (
      'laundryflow-laundry-management-software-offer',
      'LaundryFlow Laundry Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try LaundryFlow for intake, barcode tags, scan stations, billing, WhatsApp updates and multi-shop work. Free 14-day trial available.',
      'LaundryFlow helps laundries and dry cleaners manage garment intake, barcode tags, scan stations, billing, customer updates and multi-shop records.',
      'https://bizflowindia.cloud/bizflow/laundryflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['laundryflow', 'laundry-management', 'barcode-tags', 'multi-shop']::text[]
    ),
    (
      'lodgeflow-hotel-lodge-management-software-offer',
      'LodgeFlow Hotel and Lodge Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try LodgeFlow for room booking, guest check-in, housekeeping, billing and hotel reports. Free 14-day trial available.',
      'LodgeFlow supports hotels and lodges with room booking, guest check-in/check-out, housekeeping status, billing and practical occupancy reports.',
      'https://bizflowindia.cloud/bizflow/lodgeflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['lodgeflow', 'hotel-management', 'room-booking', 'guest-checkin']::text[]
    ),
    (
      'matrimonyflow-matrimony-business-software-offer',
      'MatrimonyFlow Matrimony Business Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try MatrimonyFlow for member profiles, matchmaking, communication, payments and CRM. Free 14-day trial available.',
      'MatrimonyFlow helps matrimony businesses manage member profiles, matchmaking workflows, communication tools, payments and customer follow-ups.',
      'https://bizflowindia.cloud/bizflow/matrimonyflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['matrimonyflow', 'matrimony-crm', 'matchmaking', 'member-profiles']::text[]
    ),
    (
      'mcqflow-online-exam-assessment-platform-offer',
      'MCQFlow Online Exam and Assessment Platform',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try MCQFlow for question banks, online tests, auto-grading, analytics and certificates. Free 14-day trial available.',
      'MCQFlow helps schools, academies and coaching teams run online MCQ exams with question banks, auto-grading, result analytics and certificate workflows.',
      'https://bizflowindia.cloud/bizflow/mcqflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['mcqflow', 'online-exam', 'assessment-platform', 'question-bank']::text[]
    ),
    (
      'mlmflow-network-marketing-software-offer',
      'MLMFlow MLM and Network Marketing Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try MLMFlow for genealogy trees, commissions, e-wallets, KYC and payouts. Free 14-day trial available.',
      'MLMFlow supports network marketing teams with genealogy views, commission calculations, e-wallets, KYC workflows and payout tracking.',
      'https://bizflowindia.cloud/bizflow/mlmflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['mlmflow', 'mlm-software', 'network-marketing', 'commission-management']::text[]
    ),
    (
      'opdflow-clinic-hospital-management-software-offer',
      'OPDFlow Clinic and Hospital Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try OPDFlow for appointments, prescriptions, patient records, billing and clinic reports. Free 14-day trial available.',
      'OPDFlow helps clinics and hospitals manage appointments, digital prescriptions, patient records, billing and daily OPD workflows.',
      'https://bizflowindia.cloud/bizflow/opdflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['opdflow', 'clinic-management', 'hospital-management', 'appointments']::text[]
    ),
    (
      'plannerflow-event-planning-management-software-offer',
      'PlannerFlow Event Planning and Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try PlannerFlow for venues, vendors, budgets, tasks and client communication. Free 14-day trial available.',
      'PlannerFlow gives event planners a workspace for venue bookings, vendor coordination, budgeting, task lists, event notes and client updates.',
      'https://bizflowindia.cloud/bizflow/plannerflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['plannerflow', 'event-planning', 'vendor-management', 'task-management']::text[]
    ),
    (
      'silaiflow-tailoring-shop-management-software-offer',
      'SilaiFlow Tailoring Shop Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try SilaiFlow for measurements, tailoring orders, delivery dates, billing and boutique records. Free 14-day trial available.',
      'SilaiFlow helps tailors and boutiques store customer measurements, manage stitching orders, track deliveries, create bills and follow up on payments.',
      'https://bizflowindia.cloud/bizflow/silaiflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['silaiflow', 'tailoring-management', 'boutique-software', 'measurements']::text[]
    ),
    (
      'tableflow-restaurant-pos-management-software-offer',
      'TableFlow Restaurant POS and Management Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try TableFlow for table booking, KOT printing, kitchen display, restaurant billing and reports. Free 14-day trial available.',
      'TableFlow helps restaurants and hotels manage tables, KOT printing, kitchen display workflows, billing, orders and daily restaurant reports.',
      'https://bizflowindia.cloud/bizflow/tableflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['tableflow', 'restaurant-pos', 'kot-printing', 'billing']::text[]
    ),
    (
      'bizflow-gst-billing-accounting-software-offer',
      'BizFlow GST Billing and Accounting Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try BizFlow Billing for GST invoices, e-invoicing support, barcode POS, inventory and reports. Free 14-day trial available.',
      'BizFlow Billing gives Indian SMEs GST-compliant invoicing, e-invoicing readiness, barcode POS, inventory management and business reports in one product line.',
      'https://bizflowindia.cloud/products/billing',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['bizflow-billing', 'gst-billing', 'accounting', 'inventory']::text[]
    ),
    (
      'bizflow-smart-crm-software-offer',
      'BizFlow Smart CRM Software',
      'Free Demo',
      'Special software deal, free demo offer.',
      'Try BizFlow Smart CRM for WhatsApp leads, follow-ups, sales pipeline, GST invoicing and customer history. Free demo available.',
      'BizFlow Smart CRM helps Indian sales teams capture leads, manage follow-ups, track customer conversations, use WhatsApp-friendly workflows and connect sales activity with billing.',
      'https://bizflowindia.cloud/products/crm',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['bizflow-crm', 'smart-crm', 'whatsapp-crm', 'sales-pipeline']::text[]
    ),
    (
      'bizflow-enterprise-erp-software-offer',
      'BizFlow Enterprise ERP Software',
      'Free Demo',
      'Special software deal, free demo offer.',
      'Try BizFlow ERP for HR, inventory, procurement, finance, manufacturing and multi-industry operations. Free demo available.',
      'BizFlow ERP connects business operations such as HR, inventory, procurement, finance, manufacturing, reporting and industry-specific workflows for growing teams.',
      'https://bizflowindia.cloud/products/erp',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['bizflow-erp', 'cloud-erp', 'enterprise-erp', 'operations']::text[]
    ),
    (
      'promobot-missed-call-whatsapp-marketing-software-offer',
      'PromoBot Missed Call and WhatsApp Marketing Software',
      'Free Trial',
      'Special software deal, free trial offer.',
      'Try PromoBot for missed-call lead capture, bulk WhatsApp campaigns and automated customer follow-up. Free trial available.',
      'PromoBot helps businesses capture missed-call leads, run WhatsApp campaign workflows and automate follow-ups for promotions and customer communication.',
      'https://bizflowindia.cloud/promobot',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['promobot', 'missed-call-marketing', 'whatsapp-marketing', 'lead-capture']::text[]
    ),
    (
      'retailflow-pos-billing-software-offer',
      'RetailFlow POS Billing Software',
      'Free 14-Day Trial',
      'Special software deal, free 14-day trial offer.',
      'Try RetailFlow for desktop POS billing, barcode inventory, hold bills, returns, mixed payments and reminders. Free 14-day trial available.',
      'RetailFlow is a desktop POS billing product for retailers that need barcode inventory, hold bills, returns, mixed payments, WhatsApp invoices, reminders, backup and safe updates.',
      'https://bizflowindia.cloud/retailflow',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['retailflow', 'retail-pos', 'barcode-inventory', 'desktop-billing']::text[]
    ),
    (
      'saarthi-pro-voter-management-app-offer',
      'Saarthi Pro Voter Management App',
      'Demo Available',
      'Special software deal, demo available.',
      'Try Saarthi Pro for voter data management, constituency mapping and political CRM workflows. Demo available.',
      'Saarthi Pro supports voter data management, constituency mapping, political CRM workflows and field coordination for election-focused teams.',
      'https://bizflowindia.cloud/saarthi-pro',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['saarthi-pro', 'voter-management', 'political-crm', 'constituency-mapping']::text[]
    ),
    (
      'tableflow-offline-restaurant-pos-software-offer',
      'TableFlow Offline Restaurant POS Software',
      'Demo Available',
      'Special software deal, demo available.',
      'Try TableFlow Offline for Windows restaurant POS, table billing, KOT printing, mobile captain app and backups. Demo available.',
      'TableFlow Offline gives restaurants a Windows POS setup with table billing, KOT printing, Mobile KOT Manager, Android captain app, backup/restore and safe update packages.',
      'https://bizflowindia.cloud/tableflow-offline',
      'https://bizflowindia.cloud/images/bizflow-og-banner.png',
      array['tableflow-offline', 'restaurant-pos', 'offline-pos', 'kot-printing']::text[]
    )
)
insert into public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  cover_image,
  category,
  tags,
  author_name,
  status,
  published_at,
  meta_description
)
select
  product_title || ' Offer: ' || offer_label,
  slug,
  excerpt,
  concat_ws(
    E'\n\n',
    excerpt,
    'Deal type: ' || deal_type,
    description,
    product_title || ': ' || product_url,
    'Book demo: https://bizflowindia.cloud/',
    'Mobile: 8888567870'
  ),
  cover_image,
  'Software Deals',
  tags || array['bizflow', 'software-deal', 'special-offer', 'free-trial']::text[],
  'BizFlow Team',
  'published',
  timestamp with time zone '2026-07-10 00:00:00+00',
  product_title || ' offer with ' || lower(offer_label) || '. ' || excerpt
from static_blog_deals
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content = excluded.content,
  cover_image = excluded.cover_image,
  category = excluded.category,
  tags = excluded.tags,
  author_name = excluded.author_name,
  status = excluded.status,
  published_at = excluded.published_at,
  meta_description = excluded.meta_description,
  updated_at = now();
