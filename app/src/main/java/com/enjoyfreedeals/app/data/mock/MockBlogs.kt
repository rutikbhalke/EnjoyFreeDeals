package com.enjoyfreedeals.app.data.mock

import com.enjoyfreedeals.app.data.model.BlogModel

object MockBlogs {
    val blogs = listOf(
        BlogModel(
            blogId = "exportflow-15-day-free-demo",
            title = "ExportFlow Software Offer: Free 15-Day Demo",
            image = "https://storage.googleapis.com/gpt-engineer-file-uploads/6PFzlUjLQ0ZD0L2f3zOhWk0VaY42/social-images/social-1759382293023-export.JPG",
            shortDescription = "Get a free 15-day ExportFlow demo for export invoices, shipment tracking, payment follow-up and reports. Demo booking: 8888567870.",
            fullContent = listOf(
                "Get a free 15-day ExportFlow demo for export invoices, shipment tracking, payment follow-up and reports. Demo booking: 8888567870.",
                "Offer: free 15-day demo access for ExportFlow export management software.",
                "Use the demo to try GST export invoices, proforma invoices, multi-currency payment tracking, shipment and freight tracking, customer ledgers, export cost calculations, and reports with your real workflow.",
                "ExportFlow: https://exportflow.mywebz.in/",
                "Book demo: https://bizflowindia.cloud/",
                "Mobile: 8888567870"
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
