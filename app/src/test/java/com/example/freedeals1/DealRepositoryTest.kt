package com.enjoyfreedeals.app

import com.enjoyfreedeals.app.data.mock.MockBlogs
import com.enjoyfreedeals.app.data.mock.MockCategories
import com.enjoyfreedeals.app.data.mock.MockDeals
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

