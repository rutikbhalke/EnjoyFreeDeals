package com.enjoyfreedeals.app.data.mock

import com.enjoyfreedeals.app.data.model.BlogModel

object MockBlogs {
    private const val BIZFLOW_IMAGE = "https://bizflowindia.cloud/images/bizflow-og-banner.png"
    private const val EDUFLOW_IMAGE = "https://storage.googleapis.com/gpt-engineer-file-uploads/lAaVSYx4RVVmxIS64ld97TLZWug1/social-images/social-1760781174571-clg%20crm.JPG"
    private const val EXPORTFLOW_IMAGE = "https://freedeals1.vercel.app/exportflow-document-hub.png"
    private const val DEFAULT_OFFER = "Free 14-Day Trial"
    private const val DEFAULT_DEAL_TYPE = "Special software deal, free 14-day trial offer."

    private data class SoftwareOffer(
        val id: String,
        val title: String,
        val url: String,
        val excerpt: String,
        val description: String,
        val image: String = BIZFLOW_IMAGE,
        val offer: String = DEFAULT_OFFER,
        val dealType: String = DEFAULT_DEAL_TYPE
    )

    private val softwareOffers = listOf(
        SoftwareOffer(
            id = "accountflow-gst-billing-accounting-software-offer",
            title = "AccountFlow GST Billing and Accounting Software",
            url = "https://bizflowindia.cloud/accountflow",
            excerpt = "Try AccountFlow for GST billing, accounting, inventory, purchase, payment tracking, reports and WhatsApp invoices. Free 14-day trial available.",
            description = "AccountFlow is a desktop GST billing and accounting product for businesses that need inventory, purchase tracking, payment follow-up, reports, WhatsApp invoices and safe updates in one billing workflow."
        ),
        SoftwareOffer(
            id = "academyflow-coaching-academy-management-software-offer",
            title = "AcademyFlow Coaching and Academy Management Software",
            url = "https://bizflowindia.cloud/bizflow/academyflow",
            excerpt = "Try AcademyFlow for student enrollment, fees, batches, attendance and performance tracking. Free 14-day trial available.",
            description = "AcademyFlow helps coaching institutes and academies manage admissions, fee collection, batch schedules, attendance and student performance without juggling separate registers or spreadsheets."
        ),
        SoftwareOffer(
            id = "billflow-gst-retail-pos-billing-software-offer",
            title = "BillFlow GST Retail POS Billing Software",
            url = "https://bizflowindia.cloud/bizflow/billflow",
            excerpt = "Try BillFlow for GST retail billing, barcode POS, inventory, multi-store work and WhatsApp receipts. Free 14-day trial available.",
            description = "BillFlow is built for Indian retail teams that need fast GST invoices, barcode scanning, stock control, multi-store billing and receipt sharing from one POS workflow."
        ),
        SoftwareOffer(
            id = "cateringflow-catering-business-management-software-offer",
            title = "CateringFlow Catering Business Management Software",
            url = "https://bizflowindia.cloud/bizflow/cateringflow",
            excerpt = "Try CateringFlow for catering orders, menus, event schedules, billing and inventory. Free 14-day trial available.",
            description = "CateringFlow supports catering businesses with order planning, menu management, event scheduling, stock tracking, billing and follow-ups for each event."
        ),
        SoftwareOffer(
            id = "chatflow-whatsapp-business-chatbot-software-offer",
            title = "ChatFlow WhatsApp Business API and Chatbot Software",
            url = "https://bizflowindia.cloud/bizflow/chatflow",
            excerpt = "Try ChatFlow for WhatsApp Business API messaging, bulk campaigns, bots and lead capture. Free 14-day trial available.",
            description = "ChatFlow helps teams manage two-way WhatsApp conversations, automated replies, lead capture and campaign workflows from a business-friendly messaging setup."
        ),
        SoftwareOffer(
            id = "contractorflow-construction-contractor-management-software-offer",
            title = "ContractorFlow Construction and Contractor Management Software",
            url = "https://bizflowindia.cloud/bizflow/contractorflow",
            excerpt = "Try ContractorFlow for estimates, project billing, labor tracking, materials and site reports. Free 14-day trial available.",
            description = "ContractorFlow gives contractors one place to manage project estimates, material usage, labor records, billing, payments and practical site reporting."
        ),
        SoftwareOffer(
            id = "dairyflow-dairy-management-software-offer",
            title = "DairyFlow Dairy Management Software",
            url = "https://bizflowindia.cloud/bizflow/dairyflow",
            excerpt = "Try DairyFlow for milk collection, fat/SNF testing, dairy records, payments and reports. Free 14-day trial available.",
            description = "DairyFlow digitizes daily milk collection, fat and SNF testing, supplier records, payment tracking and dairy reports for Indian dairy businesses."
        ),
        SoftwareOffer(
            id = "eduflow-education-management-software-offer",
            title = "EduFlow Education Management Software",
            url = "https://bizflowindia.cloud/bizflow/eduflow",
            image = EDUFLOW_IMAGE,
            excerpt = "Try EduFlow for students, faculty, fees, attendance, hostel, library, transport, exams and placements. Free 14-day trial available.",
            description = "EduFlow is an education management platform for schools, colleges, universities and institutes that need student records, faculty workflows, fee collection, attendance, exams, hostel, library, transport, placements and reports."
        ),
        SoftwareOffer(
            id = "exportflow-15-day-free-demo",
            title = "ExportFlow Software",
            url = "https://bizflowindia.cloud/bizflow/exportflow",
            image = EXPORTFLOW_IMAGE,
            offer = "Free 15-Day Demo",
            dealType = "Free 15-day demo offer.",
            excerpt = "Get a free 15-day ExportFlow demo for export invoices, shipment tracking, payment follow-up and reports. Demo booking: 8888567870.",
            description = "Use the demo to try export documentation, GST export invoices, proforma invoices, multi-currency payment tracking, shipment and freight tracking, customer ledgers, export cost calculations and reports with your real workflow."
        ),
        SoftwareOffer(
            id = "garageflow-garage-workshop-management-software-offer",
            title = "GarageFlow Garage and Workshop Management Software",
            url = "https://bizflowindia.cloud/bizflow/garageflow",
            excerpt = "Try GarageFlow for job cards, service history, spare parts, estimates, billing and reminders. Free 14-day trial available.",
            description = "GarageFlow helps garages and workshops manage vehicle job cards, service history, spare parts, estimates, GST invoices, mechanic tasks, payments and WhatsApp reminders."
        ),
        SoftwareOffer(
            id = "giftflow-gift-shop-hamper-business-software-offer",
            title = "GiftFlow Gift Shop and Hamper Business Software",
            url = "https://bizflowindia.cloud/bizflow/giftflow",
            excerpt = "Try GiftFlow for gift catalog, custom orders, hamper tracking, delivery and billing. Free 14-day trial available.",
            description = "GiftFlow helps gift shops and hamper businesses manage product catalogs, custom orders, delivery tracking, customer records and billing from one place."
        ),
        SoftwareOffer(
            id = "imageflow-photo-studio-management-software-offer",
            title = "ImageFlow Photo Studio Management Software",
            url = "https://bizflowindia.cloud/bizflow/imageflow",
            excerpt = "Try ImageFlow for bookings, order tracking, album workflow, billing and customer management. Free 14-day trial available.",
            description = "ImageFlow supports photo studios with booking records, order tracking, album design workflow, billing, customer details and delivery follow-ups."
        ),
        SoftwareOffer(
            id = "influencerflow-influencer-marketing-platform-offer",
            title = "InfluencerFlow Influencer Marketing Platform",
            url = "https://bizflowindia.cloud/bizflow/influencerflow",
            excerpt = "Try InfluencerFlow for campaign management, content tracking, payments and ROI analytics. Free 14-day trial available.",
            description = "InfluencerFlow helps brands and agencies track influencer campaigns, deliverables, content approvals, payments and campaign performance in one workflow."
        ),
        SoftwareOffer(
            id = "labflow-pathology-lab-management-software-offer",
            title = "LabFlow Pathology Lab Management Software",
            url = "https://bizflowindia.cloud/bizflow/labflow",
            excerpt = "Try LabFlow for sample tracking, report generation, doctor links and lab billing. Free 14-day trial available.",
            description = "LabFlow gives pathology labs a digital workflow for sample registration, tracking, report generation, doctor/customer records and billing."
        ),
        SoftwareOffer(
            id = "laundryflow-laundry-management-software-offer",
            title = "LaundryFlow Laundry Management Software",
            url = "https://bizflowindia.cloud/bizflow/laundryflow",
            excerpt = "Try LaundryFlow for intake, barcode tags, scan stations, billing, WhatsApp updates and multi-shop work. Free 14-day trial available.",
            description = "LaundryFlow helps laundries and dry cleaners manage garment intake, barcode tags, scan stations, billing, customer updates and multi-shop records."
        ),
        SoftwareOffer(
            id = "lodgeflow-hotel-lodge-management-software-offer",
            title = "LodgeFlow Hotel and Lodge Management Software",
            url = "https://bizflowindia.cloud/bizflow/lodgeflow",
            excerpt = "Try LodgeFlow for room booking, guest check-in, housekeeping, billing and hotel reports. Free 14-day trial available.",
            description = "LodgeFlow supports hotels and lodges with room booking, guest check-in/check-out, housekeeping status, billing and practical occupancy reports."
        ),
        SoftwareOffer(
            id = "matrimonyflow-matrimony-business-software-offer",
            title = "MatrimonyFlow Matrimony Business Software",
            url = "https://bizflowindia.cloud/bizflow/matrimonyflow",
            excerpt = "Try MatrimonyFlow for member profiles, matchmaking, communication, payments and CRM. Free 14-day trial available.",
            description = "MatrimonyFlow helps matrimony businesses manage member profiles, matchmaking workflows, communication tools, payments and customer follow-ups."
        ),
        SoftwareOffer(
            id = "mcqflow-online-exam-assessment-platform-offer",
            title = "MCQFlow Online Exam and Assessment Platform",
            url = "https://bizflowindia.cloud/bizflow/mcqflow",
            excerpt = "Try MCQFlow for question banks, online tests, auto-grading, analytics and certificates. Free 14-day trial available.",
            description = "MCQFlow helps schools, academies and coaching teams run online MCQ exams with question banks, auto-grading, result analytics and certificate workflows."
        ),
        SoftwareOffer(
            id = "mlmflow-network-marketing-software-offer",
            title = "MLMFlow MLM and Network Marketing Software",
            url = "https://bizflowindia.cloud/bizflow/mlmflow",
            excerpt = "Try MLMFlow for genealogy trees, commissions, e-wallets, KYC and payouts. Free 14-day trial available.",
            description = "MLMFlow supports network marketing teams with genealogy views, commission calculations, e-wallets, KYC workflows and payout tracking."
        ),
        SoftwareOffer(
            id = "opdflow-clinic-hospital-management-software-offer",
            title = "OPDFlow Clinic and Hospital Management Software",
            url = "https://bizflowindia.cloud/bizflow/opdflow",
            excerpt = "Try OPDFlow for appointments, prescriptions, patient records, billing and clinic reports. Free 14-day trial available.",
            description = "OPDFlow helps clinics and hospitals manage appointments, digital prescriptions, patient records, billing and daily OPD workflows."
        ),
        SoftwareOffer(
            id = "plannerflow-event-planning-management-software-offer",
            title = "PlannerFlow Event Planning and Management Software",
            url = "https://bizflowindia.cloud/bizflow/plannerflow",
            excerpt = "Try PlannerFlow for venues, vendors, budgets, tasks and client communication. Free 14-day trial available.",
            description = "PlannerFlow gives event planners a workspace for venue bookings, vendor coordination, budgeting, task lists, event notes and client updates."
        ),
        SoftwareOffer(
            id = "silaiflow-tailoring-shop-management-software-offer",
            title = "SilaiFlow Tailoring Shop Management Software",
            url = "https://bizflowindia.cloud/bizflow/silaiflow",
            excerpt = "Try SilaiFlow for measurements, tailoring orders, delivery dates, billing and boutique records. Free 14-day trial available.",
            description = "SilaiFlow helps tailors and boutiques store customer measurements, manage stitching orders, track deliveries, create bills and follow up on payments."
        ),
        SoftwareOffer(
            id = "tableflow-restaurant-pos-management-software-offer",
            title = "TableFlow Restaurant POS and Management Software",
            url = "https://bizflowindia.cloud/bizflow/tableflow",
            excerpt = "Try TableFlow for table booking, KOT printing, kitchen display, restaurant billing and reports. Free 14-day trial available.",
            description = "TableFlow helps restaurants and hotels manage tables, KOT printing, kitchen display workflows, billing, orders and daily restaurant reports."
        ),
        SoftwareOffer(
            id = "bizflow-gst-billing-accounting-software-offer",
            title = "BizFlow GST Billing and Accounting Software",
            url = "https://bizflowindia.cloud/products/billing",
            excerpt = "Try BizFlow Billing for GST invoices, e-invoicing support, barcode POS, inventory and reports. Free 14-day trial available.",
            description = "BizFlow Billing gives Indian SMEs GST-compliant invoicing, e-invoicing readiness, barcode POS, inventory management and business reports in one product line."
        ),
        SoftwareOffer(
            id = "bizflow-smart-crm-software-offer",
            title = "BizFlow Smart CRM Software",
            url = "https://bizflowindia.cloud/products/crm",
            offer = "Free Demo",
            dealType = "Special software deal, free demo offer.",
            excerpt = "Try BizFlow Smart CRM for WhatsApp leads, follow-ups, sales pipeline, GST invoicing and customer history. Free demo available.",
            description = "BizFlow Smart CRM helps Indian sales teams capture leads, manage follow-ups, track customer conversations, use WhatsApp-friendly workflows and connect sales activity with billing."
        ),
        SoftwareOffer(
            id = "bizflow-enterprise-erp-software-offer",
            title = "BizFlow Enterprise ERP Software",
            url = "https://bizflowindia.cloud/products/erp",
            offer = "Free Demo",
            dealType = "Special software deal, free demo offer.",
            excerpt = "Try BizFlow ERP for HR, inventory, procurement, finance, manufacturing and multi-industry operations. Free demo available.",
            description = "BizFlow ERP connects business operations such as HR, inventory, procurement, finance, manufacturing, reporting and industry-specific workflows for growing teams."
        ),
        SoftwareOffer(
            id = "promobot-missed-call-whatsapp-marketing-software-offer",
            title = "PromoBot Missed Call and WhatsApp Marketing Software",
            url = "https://bizflowindia.cloud/promobot",
            offer = "Free Trial",
            dealType = "Special software deal, free trial offer.",
            excerpt = "Try PromoBot for missed-call lead capture, bulk WhatsApp campaigns and automated customer follow-up. Free trial available.",
            description = "PromoBot helps businesses capture missed-call leads, run WhatsApp campaign workflows and automate follow-ups for promotions and customer communication."
        ),
        SoftwareOffer(
            id = "retailflow-pos-billing-software-offer",
            title = "RetailFlow POS Billing Software",
            url = "https://bizflowindia.cloud/retailflow",
            excerpt = "Try RetailFlow for desktop POS billing, barcode inventory, hold bills, returns, mixed payments and reminders. Free 14-day trial available.",
            description = "RetailFlow is a desktop POS billing product for retailers that need barcode inventory, hold bills, returns, mixed payments, WhatsApp invoices, reminders, backup and safe updates."
        ),
        SoftwareOffer(
            id = "saarthi-pro-voter-management-app-offer",
            title = "Saarthi Pro Voter Management App",
            url = "https://bizflowindia.cloud/saarthi-pro",
            offer = "Demo Available",
            dealType = "Special software deal, demo available.",
            excerpt = "Try Saarthi Pro for voter data management, constituency mapping and political CRM workflows. Demo available.",
            description = "Saarthi Pro supports voter data management, constituency mapping, political CRM workflows and field coordination for election-focused teams."
        ),
        SoftwareOffer(
            id = "tableflow-offline-restaurant-pos-software-offer",
            title = "TableFlow Offline Restaurant POS Software",
            url = "https://bizflowindia.cloud/tableflow-offline",
            offer = "Demo Available",
            dealType = "Special software deal, demo available.",
            excerpt = "Try TableFlow Offline for Windows restaurant POS, table billing, KOT printing, mobile captain app and backups. Demo available.",
            description = "TableFlow Offline gives restaurants a Windows POS setup with table billing, KOT printing, Mobile KOT Manager, Android captain app, backup/restore and safe update packages."
        )
    )

    val blogs = softwareOffers.map { it.toBlog() } + listOf(
        blog("best-deals-online", "How to Find Best Deals Online", "Learn the simple checklist for spotting genuine discounts before checkout."),
        blog("amazon-sale-tips", "Top 10 Amazon Sale Tips", "Wishlist tracking, bank offers, lightning deals and coupon stacking made easy."),
        blog("flipkart-tricks", "Best Flipkart Shopping Tricks", "A practical guide to exchange bonuses, super coins and sale timing."),
        blog("coupon-codes", "How to Use Coupon Codes", "Avoid expired coupons and combine valid promo codes with cashback offers."),
        blog("cashback-guide", "Cashback and Bank Offer Guide", "Understand card offers, wallet cashback and EMI discounts before paying."),
        blog("meesho-guide", "Meesho Shopping Guide", "Find reliable sellers, compare prices and buy budget-friendly products."),
        blog("myntra-fashion", "Myntra Fashion Sale Tips", "Build a sale wishlist and use coupons on top fashion picks.")
    )

    private fun SoftwareOffer.toBlog() = BlogModel(
        blogId = id,
        title = "$title Offer: $offer",
        image = image,
        shortDescription = excerpt,
        fullContent = listOf(
            excerpt,
            "Deal type: $dealType",
            description,
            "$title: $url",
            "Book demo: https://bizflowindia.cloud/",
            "Mobile: 8888567870"
        ).joinToString("\n\n"),
        author = "BizFlow Team"
    )

    private fun blog(id: String, title: String, short: String) = BlogModel(
        blogId = id,
        title = title,
        image = "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=900&q=80",
        shortDescription = short,
        fullContent = "$short\n\nEnjoyFreeDeals recommends comparing prices, checking coupon validity, and using trusted affiliate or official store links. Never share OTPs or payment details outside the official checkout page.",
        author = "BizFlow Team"
    )
}
