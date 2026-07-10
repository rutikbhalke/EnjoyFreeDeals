import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  category: string | null;
  tags: string[];
  author_name: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_description: string | null;
}

type SoftwareDealProduct = {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  description: string;
  tags: string[];
  image?: string;
  offer?: string;
  dealType?: string;
};

const PUBLISHED_AT = "2026-07-10T00:00:00.000Z";
const BIZFLOW_IMAGE = "https://bizflowindia.cloud/images/bizflow-og-banner.png";
const EDUFLOW_IMAGE = "https://storage.googleapis.com/gpt-engineer-file-uploads/lAaVSYx4RVVmxIS64ld97TLZWug1/social-images/social-1760781174571-clg%20crm.JPG";
const EXPORTFLOW_IMAGE = "/exportflow-document-hub.png";
const DEFAULT_OFFER = "Free 14-Day Trial";
const DEFAULT_DEAL_TYPE = "Special software deal, free 14-day trial offer.";
const BIZFLOW_DEAL_TAGS = ["bizflow", "software-deal", "special-offer", "free-trial"];

const BIZFLOW_SOFTWARE_PRODUCTS: SoftwareDealProduct[] = [
  {
    id: "accountflow-gst-billing-accounting-software-offer",
    title: "AccountFlow GST Billing and Accounting Software",
    url: "https://bizflowindia.cloud/accountflow",
    excerpt: "Try AccountFlow for GST billing, accounting, inventory, purchase, payment tracking, reports and WhatsApp invoices. Free 14-day trial available.",
    description: "AccountFlow is a desktop GST billing and accounting product for businesses that need inventory, purchase tracking, payment follow-up, reports, WhatsApp invoices and safe updates in one billing workflow.",
    tags: ["accountflow", "gst-billing", "accounting", "inventory"],
  },
  {
    id: "academyflow-coaching-academy-management-software-offer",
    title: "AcademyFlow Coaching and Academy Management Software",
    url: "https://bizflowindia.cloud/bizflow/academyflow",
    excerpt: "Try AcademyFlow for student enrollment, fees, batches, attendance and performance tracking. Free 14-day trial available.",
    description: "AcademyFlow helps coaching institutes and academies manage admissions, fee collection, batch schedules, attendance and student performance without juggling separate registers or spreadsheets.",
    tags: ["academyflow", "coaching-management", "academy-management", "fees"],
  },
  {
    id: "billflow-gst-retail-pos-billing-software-offer",
    title: "BillFlow GST Retail POS Billing Software",
    url: "https://bizflowindia.cloud/bizflow/billflow",
    excerpt: "Try BillFlow for GST retail billing, barcode POS, inventory, multi-store work and WhatsApp receipts. Free 14-day trial available.",
    description: "BillFlow is built for Indian retail teams that need fast GST invoices, barcode scanning, stock control, multi-store billing and receipt sharing from one POS workflow.",
    tags: ["billflow", "retail-pos", "gst-billing", "barcode-pos"],
  },
  {
    id: "cateringflow-catering-business-management-software-offer",
    title: "CateringFlow Catering Business Management Software",
    url: "https://bizflowindia.cloud/bizflow/cateringflow",
    excerpt: "Try CateringFlow for catering orders, menus, event schedules, billing and inventory. Free 14-day trial available.",
    description: "CateringFlow supports catering businesses with order planning, menu management, event scheduling, stock tracking, billing and follow-ups for each event.",
    tags: ["cateringflow", "catering-management", "event-orders", "billing"],
  },
  {
    id: "chatflow-whatsapp-business-chatbot-software-offer",
    title: "ChatFlow WhatsApp Business API and Chatbot Software",
    url: "https://bizflowindia.cloud/bizflow/chatflow",
    excerpt: "Try ChatFlow for WhatsApp Business API messaging, bulk campaigns, bots and lead capture. Free 14-day trial available.",
    description: "ChatFlow helps teams manage two-way WhatsApp conversations, automated replies, lead capture and campaign workflows from a business-friendly messaging setup.",
    tags: ["chatflow", "whatsapp-business", "chatbot", "lead-capture"],
  },
  {
    id: "contractorflow-construction-contractor-management-software-offer",
    title: "ContractorFlow Construction and Contractor Management Software",
    url: "https://bizflowindia.cloud/bizflow/contractorflow",
    excerpt: "Try ContractorFlow for estimates, project billing, labor tracking, materials and site reports. Free 14-day trial available.",
    description: "ContractorFlow gives contractors one place to manage project estimates, material usage, labor records, billing, payments and practical site reporting.",
    tags: ["contractorflow", "construction-management", "contractor-billing", "site-reports"],
  },
  {
    id: "dairyflow-dairy-management-software-offer",
    title: "DairyFlow Dairy Management Software",
    url: "https://bizflowindia.cloud/bizflow/dairyflow",
    excerpt: "Try DairyFlow for milk collection, fat/SNF testing, dairy records, payments and reports. Free 14-day trial available.",
    description: "DairyFlow digitizes daily milk collection, fat and SNF testing, supplier records, payment tracking and dairy reports for Indian dairy businesses.",
    tags: ["dairyflow", "dairy-management", "milk-collection", "payments"],
  },
  {
    id: "eduflow-education-management-software-offer",
    title: "EduFlow Education Management Software",
    url: "https://bizflowindia.cloud/bizflow/eduflow",
    image: EDUFLOW_IMAGE,
    excerpt: "Try EduFlow for students, faculty, fees, attendance, hostel, library, transport, exams and placements. Free 14-day trial available.",
    description: "EduFlow is an education management platform for schools, colleges, universities and institutes that need student records, faculty workflows, fee collection, attendance, exams, hostel, library, transport, placements and reports.",
    tags: ["eduflow", "education-management", "school-erp", "college-erp"],
  },
  {
    id: "exportflow-15-day-free-demo",
    title: "ExportFlow Software",
    url: "https://bizflowindia.cloud/bizflow/exportflow",
    image: EXPORTFLOW_IMAGE,
    offer: "Free 15-Day Demo",
    dealType: "Free 15-day demo offer.",
    excerpt: "Get a free 15-day ExportFlow demo for export invoices, shipment tracking, payment follow-up and reports. Demo booking: 8888567870.",
    description: "Use the demo to try export documentation, GST export invoices, proforma invoices, multi-currency payment tracking, shipment and freight tracking, customer ledgers, export cost calculations and reports with your real workflow.",
    tags: ["exportflow", "export-management", "shipping-management", "free-demo"],
  },
  {
    id: "garageflow-garage-workshop-management-software-offer",
    title: "GarageFlow Garage and Workshop Management Software",
    url: "https://bizflowindia.cloud/bizflow/garageflow",
    excerpt: "Try GarageFlow for job cards, service history, spare parts, estimates, billing and reminders. Free 14-day trial available.",
    description: "GarageFlow helps garages and workshops manage vehicle job cards, service history, spare parts, estimates, GST invoices, mechanic tasks, payments and WhatsApp reminders.",
    tags: ["garageflow", "garage-management", "workshop-management", "job-cards"],
  },
  {
    id: "giftflow-gift-shop-hamper-business-software-offer",
    title: "GiftFlow Gift Shop and Hamper Business Software",
    url: "https://bizflowindia.cloud/bizflow/giftflow",
    excerpt: "Try GiftFlow for gift catalog, custom orders, hamper tracking, delivery and billing. Free 14-day trial available.",
    description: "GiftFlow helps gift shops and hamper businesses manage product catalogs, custom orders, delivery tracking, customer records and billing from one place.",
    tags: ["giftflow", "gift-shop", "hamper-business", "delivery-tracking"],
  },
  {
    id: "imageflow-photo-studio-management-software-offer",
    title: "ImageFlow Photo Studio Management Software",
    url: "https://bizflowindia.cloud/bizflow/imageflow",
    excerpt: "Try ImageFlow for bookings, order tracking, album workflow, billing and customer management. Free 14-day trial available.",
    description: "ImageFlow supports photo studios with booking records, order tracking, album design workflow, billing, customer details and delivery follow-ups.",
    tags: ["imageflow", "photo-studio", "booking-management", "album-workflow"],
  },
  {
    id: "influencerflow-influencer-marketing-platform-offer",
    title: "InfluencerFlow Influencer Marketing Platform",
    url: "https://bizflowindia.cloud/bizflow/influencerflow",
    excerpt: "Try InfluencerFlow for campaign management, content tracking, payments and ROI analytics. Free 14-day trial available.",
    description: "InfluencerFlow helps brands and agencies track influencer campaigns, deliverables, content approvals, payments and campaign performance in one workflow.",
    tags: ["influencerflow", "influencer-marketing", "campaign-management", "analytics"],
  },
  {
    id: "labflow-pathology-lab-management-software-offer",
    title: "LabFlow Pathology Lab Management Software",
    url: "https://bizflowindia.cloud/bizflow/labflow",
    excerpt: "Try LabFlow for sample tracking, report generation, doctor links and lab billing. Free 14-day trial available.",
    description: "LabFlow gives pathology labs a digital workflow for sample registration, tracking, report generation, doctor/customer records and billing.",
    tags: ["labflow", "pathology-lab", "sample-tracking", "reports"],
  },
  {
    id: "laundryflow-laundry-management-software-offer",
    title: "LaundryFlow Laundry Management Software",
    url: "https://bizflowindia.cloud/bizflow/laundryflow",
    excerpt: "Try LaundryFlow for intake, barcode tags, scan stations, billing, WhatsApp updates and multi-shop work. Free 14-day trial available.",
    description: "LaundryFlow helps laundries and dry cleaners manage garment intake, barcode tags, scan stations, billing, customer updates and multi-shop records.",
    tags: ["laundryflow", "laundry-management", "barcode-tags", "multi-shop"],
  },
  {
    id: "lodgeflow-hotel-lodge-management-software-offer",
    title: "LodgeFlow Hotel and Lodge Management Software",
    url: "https://bizflowindia.cloud/bizflow/lodgeflow",
    excerpt: "Try LodgeFlow for room booking, guest check-in, housekeeping, billing and hotel reports. Free 14-day trial available.",
    description: "LodgeFlow supports hotels and lodges with room booking, guest check-in/check-out, housekeeping status, billing and practical occupancy reports.",
    tags: ["lodgeflow", "hotel-management", "room-booking", "guest-checkin"],
  },
  {
    id: "matrimonyflow-matrimony-business-software-offer",
    title: "MatrimonyFlow Matrimony Business Software",
    url: "https://bizflowindia.cloud/bizflow/matrimonyflow",
    excerpt: "Try MatrimonyFlow for member profiles, matchmaking, communication, payments and CRM. Free 14-day trial available.",
    description: "MatrimonyFlow helps matrimony businesses manage member profiles, matchmaking workflows, communication tools, payments and customer follow-ups.",
    tags: ["matrimonyflow", "matrimony-crm", "matchmaking", "member-profiles"],
  },
  {
    id: "mcqflow-online-exam-assessment-platform-offer",
    title: "MCQFlow Online Exam and Assessment Platform",
    url: "https://bizflowindia.cloud/bizflow/mcqflow",
    excerpt: "Try MCQFlow for question banks, online tests, auto-grading, analytics and certificates. Free 14-day trial available.",
    description: "MCQFlow helps schools, academies and coaching teams run online MCQ exams with question banks, auto-grading, result analytics and certificate workflows.",
    tags: ["mcqflow", "online-exam", "assessment-platform", "question-bank"],
  },
  {
    id: "mlmflow-network-marketing-software-offer",
    title: "MLMFlow MLM and Network Marketing Software",
    url: "https://bizflowindia.cloud/bizflow/mlmflow",
    excerpt: "Try MLMFlow for genealogy trees, commissions, e-wallets, KYC and payouts. Free 14-day trial available.",
    description: "MLMFlow supports network marketing teams with genealogy views, commission calculations, e-wallets, KYC workflows and payout tracking.",
    tags: ["mlmflow", "mlm-software", "network-marketing", "commission-management"],
  },
  {
    id: "opdflow-clinic-hospital-management-software-offer",
    title: "OPDFlow Clinic and Hospital Management Software",
    url: "https://bizflowindia.cloud/bizflow/opdflow",
    excerpt: "Try OPDFlow for appointments, prescriptions, patient records, billing and clinic reports. Free 14-day trial available.",
    description: "OPDFlow helps clinics and hospitals manage appointments, digital prescriptions, patient records, billing and daily OPD workflows.",
    tags: ["opdflow", "clinic-management", "hospital-management", "appointments"],
  },
  {
    id: "plannerflow-event-planning-management-software-offer",
    title: "PlannerFlow Event Planning and Management Software",
    url: "https://bizflowindia.cloud/bizflow/plannerflow",
    excerpt: "Try PlannerFlow for venues, vendors, budgets, tasks and client communication. Free 14-day trial available.",
    description: "PlannerFlow gives event planners a workspace for venue bookings, vendor coordination, budgeting, task lists, event notes and client updates.",
    tags: ["plannerflow", "event-planning", "vendor-management", "task-management"],
  },
  {
    id: "silaiflow-tailoring-shop-management-software-offer",
    title: "SilaiFlow Tailoring Shop Management Software",
    url: "https://bizflowindia.cloud/bizflow/silaiflow",
    excerpt: "Try SilaiFlow for measurements, tailoring orders, delivery dates, billing and boutique records. Free 14-day trial available.",
    description: "SilaiFlow helps tailors and boutiques store customer measurements, manage stitching orders, track deliveries, create bills and follow up on payments.",
    tags: ["silaiflow", "tailoring-management", "boutique-software", "measurements"],
  },
  {
    id: "tableflow-restaurant-pos-management-software-offer",
    title: "TableFlow Restaurant POS and Management Software",
    url: "https://bizflowindia.cloud/bizflow/tableflow",
    excerpt: "Try TableFlow for table booking, KOT printing, kitchen display, restaurant billing and reports. Free 14-day trial available.",
    description: "TableFlow helps restaurants and hotels manage tables, KOT printing, kitchen display workflows, billing, orders and daily restaurant reports.",
    tags: ["tableflow", "restaurant-pos", "kot-printing", "billing"],
  },
  {
    id: "bizflow-gst-billing-accounting-software-offer",
    title: "BizFlow GST Billing and Accounting Software",
    url: "https://bizflowindia.cloud/products/billing",
    excerpt: "Try BizFlow Billing for GST invoices, e-invoicing support, barcode POS, inventory and reports. Free 14-day trial available.",
    description: "BizFlow Billing gives Indian SMEs GST-compliant invoicing, e-invoicing readiness, barcode POS, inventory management and business reports in one product line.",
    tags: ["bizflow-billing", "gst-billing", "accounting", "inventory"],
  },
  {
    id: "bizflow-smart-crm-software-offer",
    title: "BizFlow Smart CRM Software",
    url: "https://bizflowindia.cloud/products/crm",
    offer: "Free Demo",
    dealType: "Special software deal, free demo offer.",
    excerpt: "Try BizFlow Smart CRM for WhatsApp leads, follow-ups, sales pipeline, GST invoicing and customer history. Free demo available.",
    description: "BizFlow Smart CRM helps Indian sales teams capture leads, manage follow-ups, track customer conversations, use WhatsApp-friendly workflows and connect sales activity with billing.",
    tags: ["bizflow-crm", "smart-crm", "whatsapp-crm", "sales-pipeline"],
  },
  {
    id: "bizflow-enterprise-erp-software-offer",
    title: "BizFlow Enterprise ERP Software",
    url: "https://bizflowindia.cloud/products/erp",
    offer: "Free Demo",
    dealType: "Special software deal, free demo offer.",
    excerpt: "Try BizFlow ERP for HR, inventory, procurement, finance, manufacturing and multi-industry operations. Free demo available.",
    description: "BizFlow ERP connects business operations such as HR, inventory, procurement, finance, manufacturing, reporting and industry-specific workflows for growing teams.",
    tags: ["bizflow-erp", "cloud-erp", "enterprise-erp", "operations"],
  },
  {
    id: "promobot-missed-call-whatsapp-marketing-software-offer",
    title: "PromoBot Missed Call and WhatsApp Marketing Software",
    url: "https://bizflowindia.cloud/promobot",
    offer: "Free Trial",
    dealType: "Special software deal, free trial offer.",
    excerpt: "Try PromoBot for missed-call lead capture, bulk WhatsApp campaigns and automated customer follow-up. Free trial available.",
    description: "PromoBot helps businesses capture missed-call leads, run WhatsApp campaign workflows and automate follow-ups for promotions and customer communication.",
    tags: ["promobot", "missed-call-marketing", "whatsapp-marketing", "lead-capture"],
  },
  {
    id: "retailflow-pos-billing-software-offer",
    title: "RetailFlow POS Billing Software",
    url: "https://bizflowindia.cloud/retailflow",
    excerpt: "Try RetailFlow for desktop POS billing, barcode inventory, hold bills, returns, mixed payments and reminders. Free 14-day trial available.",
    description: "RetailFlow is a desktop POS billing product for retailers that need barcode inventory, hold bills, returns, mixed payments, WhatsApp invoices, reminders, backup and safe updates.",
    tags: ["retailflow", "retail-pos", "barcode-inventory", "desktop-billing"],
  },
  {
    id: "saarthi-pro-voter-management-app-offer",
    title: "Saarthi Pro Voter Management App",
    url: "https://bizflowindia.cloud/saarthi-pro",
    offer: "Demo Available",
    dealType: "Special software deal, demo available.",
    excerpt: "Try Saarthi Pro for voter data management, constituency mapping and political CRM workflows. Demo available.",
    description: "Saarthi Pro supports voter data management, constituency mapping, political CRM workflows and field coordination for election-focused teams.",
    tags: ["saarthi-pro", "voter-management", "political-crm", "constituency-mapping"],
  },
  {
    id: "tableflow-offline-restaurant-pos-software-offer",
    title: "TableFlow Offline Restaurant POS Software",
    url: "https://bizflowindia.cloud/tableflow-offline",
    offer: "Demo Available",
    dealType: "Special software deal, demo available.",
    excerpt: "Try TableFlow Offline for Windows restaurant POS, table billing, KOT printing, mobile captain app and backups. Demo available.",
    description: "TableFlow Offline gives restaurants a Windows POS setup with table billing, KOT printing, Mobile KOT Manager, Android captain app, backup/restore and safe update packages.",
    tags: ["tableflow-offline", "restaurant-pos", "offline-pos", "kot-printing"],
  },
  {
    id: "bizflow-academy-management-software-india-offer",
    title: "BizFlow Academy Management Software",
    url: "https://bizflowindia.cloud/academy-management-software-india",
    excerpt: "Compare BizFlow AcademyFlow for academy management software in India with cloud access, local support and practical daily workflows. Free 14-day trial available.",
    description: "This offer page helps academies and coaching institutes check AcademyFlow for admissions, fees, batch schedules, attendance, student records and day-to-day management.",
    tags: ["academy-management", "academyflow", "coaching-management", "education-software"],
  },
  {
    id: "bizflow-barcode-pos-software-india-offer",
    title: "BizFlow Barcode POS Software",
    url: "https://bizflowindia.cloud/barcode-pos-software-india",
    excerpt: "Compare BizFlow BillFlow for barcode POS software in India with retail billing, inventory and local support. Free 14-day trial available.",
    description: "This offer page is for shops that need barcode billing, stock control, GST invoices, quick checkout, WhatsApp receipts and retail reports.",
    tags: ["barcode-pos", "billflow", "retail-pos", "inventory"],
  },
  {
    id: "bizflow-clinic-management-software-india-offer",
    title: "BizFlow Clinic Management Software",
    url: "https://bizflowindia.cloud/clinic-management-software-india",
    excerpt: "Try BizFlow OPDFlow for appointments, patient records, prescriptions, billing, lab orders and follow-up communication. Free 14-day trial available.",
    description: "This offer page helps clinics review OPDFlow for patient registration, appointment queues, prescription records, billing, lab coordination and follow-up workflows.",
    tags: ["clinic-management", "opdflow", "appointments", "prescriptions"],
  },
  {
    id: "bizflow-cloud-erp-software-india-offer",
    title: "BizFlow Cloud ERP Software",
    url: "https://bizflowindia.cloud/cloud-erp-software-india",
    excerpt: "Try BizFlow Cloud ERP for billing, inventory, purchasing, CRM, finance, HR and operations. Free 14-day trial available.",
    description: "This offer page is for SMEs that are outgrowing spreadsheets and need connected workflows for billing, inventory, purchasing, CRM, finance, HR and reporting.",
    tags: ["cloud-erp", "bizflow-erp", "inventory", "operations"],
  },
  {
    id: "bizflow-contractor-management-software-india-offer",
    title: "BizFlow Contractor Management Software",
    url: "https://bizflowindia.cloud/contractor-management-software-india",
    excerpt: "Compare BizFlow ContractorFlow for contractor management software in India with estimates, billing and site workflows. Free 14-day trial available.",
    description: "This offer page helps contractors check ContractorFlow for project estimates, billing, labor tracking, material use, payment follow-up and site reports.",
    tags: ["contractor-management", "contractorflow", "construction", "project-billing"],
  },
  {
    id: "bizflow-dairy-management-software-india-offer",
    title: "BizFlow Dairy Management Software",
    url: "https://bizflowindia.cloud/dairy-management-software-india",
    excerpt: "Compare BizFlow DairyFlow for dairy management software in India with milk collection, testing, records and payments. Free 14-day trial available.",
    description: "This offer page is for dairies that need milk collection records, fat/SNF testing, supplier ledgers, digital payments and dairy reports.",
    tags: ["dairy-management", "dairyflow", "milk-collection", "payments"],
  },
  {
    id: "bizflow-e-invoicing-software-india-offer",
    title: "BizFlow E-Invoicing Software",
    url: "https://bizflowindia.cloud/e-invoicing-software-india",
    excerpt: "Compare BizFlow BillFlow for e-invoicing software in India with GST billing, inventory and daily workflows. Free 14-day trial available.",
    description: "This offer page helps businesses review e-invoicing-ready billing workflows for GST invoices, inventory, customer records, payment tracking and reports.",
    tags: ["e-invoicing", "billflow", "gst-billing", "accounting"],
  },
  {
    id: "bizflow-export-management-software-india-offer",
    title: "BizFlow Export Management Software",
    url: "https://bizflowindia.cloud/export-management-software-india",
    offer: "Free 15-Day Demo",
    dealType: "Free 15-day demo offer.",
    excerpt: "Compare BizFlow ExportFlow for export management software in India with documents, shipments and payment follow-up. Free 15-day demo available.",
    description: "This offer page helps exporters evaluate ExportFlow for export documents, invoices, shipment tracking, multi-currency records, ledgers and reports.",
    tags: ["export-management", "exportflow", "shipping-management", "free-demo"],
  },
  {
    id: "bizflow-gst-billing-software-india-offer",
    title: "BizFlow GST Billing Software",
    url: "https://bizflowindia.cloud/gst-billing-software-india",
    excerpt: "Try BizFlow BillFlow for GST invoices, stock management, WhatsApp receipts and accounting reports. Free 14-day trial available.",
    description: "This offer page is for SMEs that need GST billing, inventory, WhatsApp receipts, customer records, accounting reports and practical billing workflows.",
    tags: ["gst-billing", "billflow", "inventory", "accounting"],
  },
  {
    id: "bizflow-hotel-management-software-india-offer",
    title: "BizFlow Hotel Management Software",
    url: "https://bizflowindia.cloud/hotel-management-software-india",
    excerpt: "Compare BizFlow LodgeFlow for hotel management software in India with rooms, check-ins, billing and reports. Free 14-day trial available.",
    description: "This offer page helps hotels and lodges review LodgeFlow for room booking, guest check-in, housekeeping, billing, occupancy and daily reports.",
    tags: ["hotel-management", "lodgeflow", "room-booking", "guest-checkin"],
  },
  {
    id: "bizflow-inventory-management-software-india-offer",
    title: "BizFlow Inventory Management Software",
    url: "https://bizflowindia.cloud/inventory-management-software-india",
    excerpt: "Compare BizFlow ERP for inventory management software in India with stock, purchases, billing and reports. Free 14-day trial available.",
    description: "This offer page helps businesses review inventory workflows for stock control, purchase records, billing links, reorder visibility and operational reporting.",
    tags: ["inventory-management", "bizflow-erp", "stock-control", "purchase-management"],
  },
  {
    id: "bizflow-pathology-lab-software-india-offer",
    title: "BizFlow Pathology Lab Software",
    url: "https://bizflowindia.cloud/pathology-lab-software-india",
    excerpt: "Compare BizFlow LabFlow for pathology lab software in India with samples, reports, billing and local support. Free 14-day trial available.",
    description: "This offer page helps labs check LabFlow for sample registration, report generation, doctor records, billing and lab workflow tracking.",
    tags: ["pathology-lab", "labflow", "sample-tracking", "reports"],
  },
  {
    id: "bizflow-payment-reminder-software-india-offer",
    title: "BizFlow Payment Reminder Software",
    url: "https://bizflowindia.cloud/payment-reminder-software-india",
    excerpt: "Compare BizFlow Billing for payment reminder software in India with invoices, dues and follow-up workflows. Free 14-day trial available.",
    description: "This offer page is for businesses that need invoice tracking, due reminders, customer follow-ups, payment history and practical collection workflows.",
    tags: ["payment-reminder", "billing", "follow-up", "accounts-receivable"],
  },
  {
    id: "bizflow-restaurant-pos-software-india-offer",
    title: "BizFlow Restaurant POS Software",
    url: "https://bizflowindia.cloud/restaurant-pos-software-india",
    excerpt: "Try BizFlow TableFlow for tables, KOT, menu billing, kitchen workflow, GST invoices and customer communication. Free 14-day trial available.",
    description: "This offer page helps restaurants check TableFlow for table orders, KOT printing, kitchen coordination, billing, GST invoices and restaurant reports.",
    tags: ["restaurant-pos", "tableflow", "kot-printing", "billing"],
  },
  {
    id: "bizflow-retail-billing-software-india-offer",
    title: "BizFlow Retail Billing Software",
    url: "https://bizflowindia.cloud/retail-billing-software-india",
    excerpt: "Try BizFlow BillFlow for POS billing, barcode support, stock tracking, GST invoices and WhatsApp receipts. Free 14-day trial available.",
    description: "This offer page is for retail shops that need fast billing, barcode support, stock tracking, GST invoices, returns and receipt sharing.",
    tags: ["retail-billing", "billflow", "barcode-pos", "gst-billing"],
  },
  {
    id: "bizflow-school-erp-software-india-offer",
    title: "BizFlow School ERP Software",
    url: "https://bizflowindia.cloud/school-erp-software-india",
    excerpt: "Try BizFlow EduFlow for admissions, fees, attendance, exams, communication and school administration. Free 14-day trial available.",
    description: "This offer page helps schools and colleges review EduFlow for student lifecycle, fees, attendance, exams, communication and institute administration.",
    tags: ["school-erp", "eduflow", "education-management", "fees"],
  },
  {
    id: "bizflow-tailoring-management-software-india-offer",
    title: "BizFlow Tailoring Management Software",
    url: "https://bizflowindia.cloud/tailoring-management-software-india",
    excerpt: "Compare BizFlow SilaiFlow for tailoring management software in India with measurements, orders and billing. Free 14-day trial available.",
    description: "This offer page helps tailors and boutiques check SilaiFlow for customer measurements, order tracking, delivery dates, billing and payment follow-up.",
    tags: ["tailoring-management", "silaiflow", "measurements", "boutique-software"],
  },
  {
    id: "bizflow-whatsapp-crm-india-offer",
    title: "BizFlow WhatsApp CRM",
    url: "https://bizflowindia.cloud/whatsapp-crm-india",
    offer: "Free Demo",
    dealType: "Special software deal, free demo offer.",
    excerpt: "Try BizFlow Smart CRM for WhatsApp leads, pipelines, follow-ups and connected customer conversations. Free demo available.",
    description: "This offer page helps sales teams review WhatsApp CRM workflows for lead capture, pipelines, follow-ups, customer history and connected messaging.",
    tags: ["whatsapp-crm", "smart-crm", "lead-tracking", "sales-pipeline"],
  },
];

const STATIC_BLOG_DEALS = BIZFLOW_SOFTWARE_PRODUCTS.map(toStaticBlogDeal);

export const EXPORTFLOW_BLOG_DEAL = STATIC_BLOG_DEALS.find((deal) => deal.slug === "exportflow-15-day-free-demo")!;
export const EDUFLOW_BLOG_DEAL = STATIC_BLOG_DEALS.find((deal) => deal.slug === "eduflow-education-management-software-offer")!;

function toStaticBlogDeal(product: SoftwareDealProduct): BlogPost {
  const offer = product.offer || DEFAULT_OFFER;
  const dealType = product.dealType || DEFAULT_DEAL_TYPE;
  const tags = Array.from(new Set([...product.tags, ...BIZFLOW_DEAL_TAGS]));
  return {
    id: product.id,
    title: `${product.title} Offer: ${offer}`,
    slug: product.id,
    excerpt: product.excerpt,
    content: [
      product.excerpt,
      `Deal type: ${dealType}`,
      product.description,
      `${product.title}: ${product.url}`,
      "Book demo: https://bizflowindia.cloud/",
      "Mobile: 8888567870",
    ].join("\n\n"),
    cover_image: product.image || BIZFLOW_IMAGE,
    category: "Software Deals",
    tags,
    author_name: "BizFlow Team",
    status: "published",
    published_at: PUBLISHED_AT,
    created_at: PUBLISHED_AT,
    updated_at: PUBLISHED_AT,
    meta_description: `${product.title} offer with ${offer.toLowerCase()}. ${product.excerpt}`,
  };
}

export function useBlogPosts(category?: string) {
  return useQuery({
    queryKey: ["blog-posts", category],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts" as any)
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return withStaticBlogDeals(data as unknown as BlogPost[], category);
    },
  });
}

export function useBlogPost(slug?: string) {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const staticDeal = STATIC_BLOG_DEALS.find((deal) => deal.slug === slug);
      if (staticDeal) {
        return staticDeal;
      }

      const { data, error } = await supabase
        .from("blog_posts" as any)
        .select("*")
        .eq("slug", slug!)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data as unknown as BlogPost | null;
    },
    enabled: !!slug,
  });
}

function withStaticBlogDeals(posts: BlogPost[] = [], category?: string): BlogPost[] {
  const matchingStaticDeals = STATIC_BLOG_DEALS.filter((deal) => !category || category === deal.category);
  const staticSlugs = new Set(STATIC_BLOG_DEALS.map((deal) => deal.slug));
  const withoutDuplicate = posts.filter((post) => !staticSlugs.has(post.slug));
  return [...matchingStaticDeals, ...withoutDuplicate];
}

export function useAdminBlogPosts() {
  return useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as BlogPost[];
    },
  });
}
