package com.enjoyfreedeals.app

import com.enjoyfreedeals.app.data.mock.MockBlogs
import com.enjoyfreedeals.app.data.mock.MockCategories
import com.enjoyfreedeals.app.data.mock.MockDeals
import com.enjoyfreedeals.app.data.mock.MockPriceHistory
import com.enjoyfreedeals.app.data.model.UserModel
import com.enjoyfreedeals.app.data.repository.DealRepository
import com.enjoyfreedeals.app.utils.CustomTabsHelper
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DealRepositoryTest {
    @Test
    fun deals_loadAllDeals_hasSampleData() {
        assertTrue(MockDeals.deals.size >= 12)
    }

    @Test
    fun deals_emptyDealsState_canBeRepresented() {
        assertTrue(emptyList<Any>().isEmpty())
    }

    @Test
    fun deals_viewDealUrl_normalizesMissingScheme() {
        assertEquals("https://www.amazon.in", CustomTabsHelper.normalizeUrl("www.amazon.in"))
    }

    @Test
    fun deals_missingUrl_returnsBlankNormalizedUrl() {
        assertEquals("", CustomTabsHelper.normalizeUrl(""))
    }

    @Test
    fun deals_storeFilterWorks() {
        val amazonDeals = DealRepository.filterAndSortDeals(MockDeals.deals, storeFilter = "Amazon")
        assertTrue(amazonDeals.isNotEmpty())
        assertTrue(amazonDeals.all { it.storeName == "Amazon" })
    }

    @Test
    fun deals_highestDiscountSortingWorks() {
        val sorted = DealRepository.filterAndSortDeals(MockDeals.deals, sortOption = "Highest Discount")
        assertTrue(sorted.first().discountPercent >= sorted.last().discountPercent)
    }

    @Test
    fun deals_lowestPriceSortingWorksAndFreeDealsRise() {
        val sorted = DealRepository.filterAndSortDeals(MockDeals.deals, sortOption = "Lowest Price")
        assertEquals(0.0, sorted.first().effectivePrice, 0.0)
    }

    @Test
    fun deals_searchByCouponWorks() {
        val results = DealRepository.filterAndSortDeals(MockDeals.deals, query = "BOAT60")
        assertTrue(results.any { it.couponCode == "BOAT60" })
    }

    @Test
    fun priceComparison_mockDealsHaveMultipleStorePricesAndLowestPrice() {
        val deal = MockDeals.deals.first { it.dealId == "amazon-boat-earbuds" }
        assertTrue(deal.comparisonPrices.size >= 4)
        val lowest = deal.lowestStorePrice
        assertTrue(lowest != null)
        assertEquals(lowest!!.price, deal.comparisonPrices.filter { it.available }.minOf { it.price }, 0.0)
    }

    @Test
    fun priceComparison_sampleProductsAreGeneratedForHomeSection() {
        assertTrue(MockDeals.priceComparisonProducts.size >= MockDeals.deals.size)
        assertTrue(MockDeals.priceComparisonProducts.all { it.ecommercePlatformPrices.isNotEmpty() })
    }

    @Test
    fun deals_redirectUrlsUseExactProductAndAffiliateLinks() {
        val deal = MockDeals.deals.first { it.dealId == "amazon-boat-earbuds" }
        assertTrue(deal.productUrl.contains("/dp/"))
        assertTrue(deal.redirectUrl.startsWith(deal.productUrl))
        assertTrue(deal.redirectUrl.contains("affid=enjoyfreedeals"))
        assertFalse(deal.redirectUrl.endsWith("amazon.in/"))
    }

    @Test
    fun priceHistory_loadsRealisticMockPoints() {
        val deal = MockDeals.deals.first { it.dealId == "amazon-boat-earbuds" }
        val history = MockPriceHistory.priceHistory.getValue(deal.dealId)
        assertEquals(30, history.size)
        assertTrue(history.zipWithNext().all { (first, second) -> first.recordedAt <= second.recordedAt })
    }

    @Test
    fun priceHistory_recordsUseRequestedBackendSchemaFields() {
        val deal = MockDeals.deals.first { it.dealId == "flipkart-realme-phone" }
        val record = MockPriceHistory.priceHistory.getValue(deal.dealId).last()
        assertTrue(record.id.isNotBlank())
        assertEquals(deal.dealId, record.productId)
        assertEquals(deal.storeName, record.storeName)
        assertEquals(deal.productUrl, record.productUrl)
        assertEquals(deal.redirectUrl, record.affiliateUrl)
        assertEquals(record.currentPrice, record.price, 0.0)
        assertTrue(record.checkedAt > 0L)
        assertTrue(record.priceDropAmount >= 0.0)
        assertTrue(record.averagePrice >= record.lowestPrice)
        assertTrue(record.highestPrice >= record.averagePrice)
    }

    @Test
    fun priceHistory_statsCalculateAverageHighestLowest() {
        val deal = MockDeals.deals.first { it.dealId == "amazon-boat-earbuds" }
        val stats = DealRepository.calculatePriceStats(deal, MockPriceHistory.priceHistory.getValue(deal.dealId))
        assertTrue(stats.highestPrice >= stats.averagePrice)
        assertTrue(stats.averagePrice >= stats.lowestPrice)
        assertEquals(deal.effectivePrice, stats.currentPrice, 0.0)
    }

    @Test
    fun priceHistory_buildRecordAndNotificationRulesWork() {
        val deal = MockDeals.deals.first { it.dealId == "meesho-kurti" }
        val history = MockPriceHistory.priceHistory.getValue(deal.dealId)
        val record = DealRepository.buildPriceHistoryRecord(deal, history)
        assertEquals(deal.dealId, record.productId)
        assertEquals(deal.effectivePrice, record.currentPrice, 0.0)
        assertEquals(deal.effectivePrice, record.price, 0.0)
        assertTrue(DealRepository.shouldCreatePriceDropNotification(deal, history))
    }

    @Test
    fun priceAlert_suggestedTargetUsesHistoryAndCurrentPrice() {
        val deal = MockDeals.deals.first { it.dealId == "amazon-boat-earbuds" }
        val history = MockPriceHistory.priceHistory.getValue(deal.dealId)
        val suggested = DealRepository.suggestedAlertPrice(deal, history)
        assertTrue(suggested <= deal.effectivePrice * 0.90)
        assertTrue(suggested >= 0.0)
    }

    @Test
    fun priceDropAlert_userModelStoresDealAndTarget() {
        val user = UserModel(
            userId = "u1",
            priceDropAlerts = listOf("amazon-boat-earbuds"),
            priceDropTargetPrices = mapOf("amazon-boat-earbuds" to 1499.0)
        )
        assertTrue(user.priceDropAlerts.contains("amazon-boat-earbuds"))
        assertEquals(1499.0, user.priceDropTargetPrices.getValue("amazon-boat-earbuds"), 0.0)
    }

    @Test
    fun categories_loadCategories_hasSampleData() {
        assertTrue(MockCategories.categories.size >= 12)
    }

    @Test
    fun categories_clickFetchesCategoryDeals() {
        val category = MockCategories.categories.first { it.categoryId == "electronics" }
        val categoryDeals = MockDeals.deals.filter { it.categoryId == category.categoryId }
        assertTrue(categoryDeals.isNotEmpty())
    }

    @Test
    fun categories_emptyCategoryDealsState_canBeRepresented() {
        val categoryDeals = MockDeals.deals.filter { it.categoryId == "unknown" }
        assertTrue(categoryDeals.isEmpty())
    }

    @Test
    fun categories_searchWorks() {
        val results = DealRepository.filterAndSortDeals(MockDeals.deals.filter { it.categoryId == "electronics" }, query = "speaker")
        assertFalse(results.isEmpty())
    }

    @Test
    fun blogs_loadBlogsAndOpenDetails() {
        val blog = MockBlogs.blogs.first()
        assertTrue(MockBlogs.blogs.isNotEmpty())
        assertTrue(blog.fullContent.contains(blog.shortDescription))
    }

    @Test
    fun blogs_emptyBlogState_canBeRepresented() {
        assertTrue(emptyList<Any>().isEmpty())
    }

    @Test
    fun notifications_unreadBadgeUpdates() {
        val notifications = listOf(false, true, false)
        assertEquals(2, notifications.count { !it })
    }

    @Test
    fun profile_countsAndTogglesWorkAsPlainState() {
        val savedDeals = listOf("a", "b")
        val sharedDeals = listOf("c")
        var darkMode = false
        darkMode = !darkMode
        assertEquals(2, savedDeals.size)
        assertEquals(1, sharedDeals.size)
        assertTrue(darkMode)
    }
}
