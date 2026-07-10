package com.enjoyfreedeals.app.data.mock

import com.enjoyfreedeals.app.data.model.BlogModel

object MockBlogs {
    val blogs = listOf(
        BlogModel(
            blogId = "exportflow-15-day-free-demo",
            title = "ExportFlow Export Management Software Deal: 15-Day Free Demo",
            image = "https://storage.googleapis.com/gpt-engineer-file-uploads/6PFzlUjLQ0ZD0L2f3zOhWk0VaY42/social-images/social-1759382293023-export.JPG",
            shortDescription = "Try ExportFlow for export invoices, shipment tracking, payments and reports with a free 15-day demo. Contact BizFlow India at 8888567870.",
            fullContent = listOf(
                "Try ExportFlow for export invoices, shipment tracking, payments and reports with a free 15-day demo. Contact BizFlow India at 8888567870.",
                "ExportFlow is an export management software deal for exporters who want GST invoices, proforma invoices, multi-currency payment tracking, shipment and freight tracking, customer ledgers, export cost calculations, and compliance reports in one workflow.",
                "Deal highlight: get a free 15-day demo before choosing a plan. Use the demo to test invoice creation, shipment tracking, payment follow-up, and export reports with your real workflow.",
                "Product link: https://exportflow.mywebz.in/",
                "Contact/demo: https://bizflowindia.cloud/",
                "Mobile: 8888567870",
                "This is listed as a software demo deal so buyers can evaluate the workflow before paying, not as a regular advertisement."
            ).joinToString("\n\n"),
            author = "BizFlow Team"
        ),
        blog("best-deals-online", "How to Find Best Deals Online", "Learn the simple checklist for spotting genuine discounts before checkout."),
        blog("amazon-sale-tips", "Top 10 Amazon Sale Tips", "Wishlist tracking, bank offers, lightning deals and coupon stacking made easy."),
        blog("flipkart-tricks", "Best Flipkart Shopping Tricks", "A practical guide to exchange bonuses, super coins and sale timing."),
        blog("coupon-codes", "How to Use Coupon Codes", "Avoid expired coupons and combine valid promo codes with cashback offers."),
        blog("cashback-guide", "Cashback and Bank Offer Guide", "Understand card offers, wallet cashback and EMI discounts before paying."),
        blog("meesho-guide", "Meesho Shopping Guide", "Find reliable sellers, compare prices and buy budget-friendly products."),
        blog("myntra-fashion", "Myntra Fashion Sale Tips", "Build a sale wishlist and use coupons on top fashion picks.")
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
