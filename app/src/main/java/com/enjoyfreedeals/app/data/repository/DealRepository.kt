package com.enjoyfreedeals.app.data.repository

import android.content.Context
import com.enjoyfreedeals.app.data.mock.MockDeals
import com.enjoyfreedeals.app.data.mock.MockPriceHistory
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.data.model.PriceAlertModel
import com.enjoyfreedeals.app.data.model.PricePointModel
import com.enjoyfreedeals.app.data.model.PriceStatsModel
import com.enjoyfreedeals.app.utils.Constants
import com.google.firebase.FirebaseApp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.tasks.await
import kotlin.math.abs

class DealRepository(private val context: Context) {
    private val userRepository = UserRepository(context)
    private val firebaseEnabled: Boolean
        get() = FirebaseApp.getApps(context).isNotEmpty()

    private val firestore: FirebaseFirestore?
        get() = if (firebaseEnabled) FirebaseFirestore.getInstance() else null

    fun getAllActiveDeals(): Flow<List<DealModel>> {
        val db = firestore ?: return flowOf(MockDeals.deals.filter { it.isActive })
        return callbackFlow {
            val listener = db.collection(Constants.DEALS)
                .whereEqualTo("isActive", true)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        trySend(MockDeals.deals)
                        return@addSnapshotListener
                    }
                    val deals = snapshot?.documents?.mapNotNull { it.toDealModel() }
                        .orEmpty()
                    trySend(deals.ifEmpty { MockDeals.deals })
                }
            awaitClose { listener.remove() }
        }
    }

    fun getDealsByCategory(categoryId: String): Flow<List<DealModel>> {
        val db = firestore ?: return flowOf(MockDeals.deals.filter { it.categoryId == categoryId && it.isActive })
        return callbackFlow {
            val listener = db.collection(Constants.DEALS)
                .whereEqualTo("categoryId", categoryId)
                .whereEqualTo("isActive", true)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        trySend(MockDeals.deals.filter { it.categoryId == categoryId })
                        return@addSnapshotListener
                    }
                    trySend(snapshot?.documents?.mapNotNull { it.toDealModel() }.orEmpty())
                }
            awaitClose { listener.remove() }
        }
    }

    fun getPriceHistory(dealId: String): Flow<List<PricePointModel>> {
        val mock = MockPriceHistory.priceHistory[dealId].orEmpty()
        val db = firestore ?: return flowOf(mock)
        return callbackFlow {
            val listener = db.collection(Constants.PRICE_HISTORY)
                .whereEqualTo("product_id", dealId)
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        trySend(mock)
                        return@addSnapshotListener
                    }
                    val history = snapshot?.documents
                        ?.mapNotNull { it.toObject(PricePointModel::class.java) }
                        ?.sortedBy { it.recordedAt }
                        .orEmpty()
                    trySend(history.ifEmpty { mock })
                }
            awaitClose { listener.remove() }
        }
    }

    suspend fun trackLivePriceIfChanged(deal: DealModel): PriceStatsModel {
        val db = firestore ?: return calculatePriceStats(
            deal = deal,
            history = MockPriceHistory.priceHistory[deal.dealId].orEmpty()
        )
        val snapshot = db.collection(Constants.PRICE_HISTORY)
            .whereEqualTo("product_id", deal.dealId)
            .get()
            .await()
        val history = snapshot.documents
            .mapNotNull { it.toObject(PricePointModel::class.java) }
            .sortedBy { it.recordedAt }
        val lastPrice = history.maxByOrNull { it.recordedAt }?.price
        val priceChanged = lastPrice == null || abs(lastPrice - deal.effectivePrice) >= 0.01
        val record = buildPriceHistoryRecord(deal, history)
        val mergedHistory = if (priceChanged) history + record else history
        val stats = calculatePriceStats(deal, mergedHistory)

        updateProductPriceDocuments(db, deal, stats)

        if (priceChanged) {
            db.collection(Constants.PRICE_HISTORY).document(record.id)
                .set(record.copy(lowestPrice = stats.lowestPrice, highestPrice = stats.highestPrice, averagePrice = stats.averagePrice))
                .await()
        }

        checkActivePriceAlerts(db, deal, stats)
        if (priceChanged && shouldCreatePriceDropNotification(deal, history)) {
            createPriceInsightNotification(deal, stats)
        }
        return stats
    }

    fun getSavedDeals(): Flow<List<DealModel>> = userRepository.getSavedDeals()

    fun getSharedDeals(): Flow<List<DealModel>> = userRepository.getSharedDeals()

    suspend fun saveDeal(dealId: String) {
        userRepository.addSavedDeal(dealId)
        incrementDealCounter(dealId, "savedCount")
    }

    suspend fun removeSavedDeal(dealId: String) {
        userRepository.removeSavedDeal(dealId)
    }

    suspend fun shareDeal(dealId: String) {
        userRepository.addSharedDeal(dealId)
        incrementDealCounter(dealId, "shareCount")
    }

    suspend fun enablePriceDropAlert(deal: DealModel, targetPrice: Double) {
        val userId = userRepository.getCurrentUserId() ?: return
        userRepository.addPriceDropAlert(deal.dealId, targetPrice)
        if (firebaseEnabled) {
            val now = System.currentTimeMillis()
            val alertId = "$userId-${deal.dealId}"
            val alert = PriceAlertModel(
                id = alertId,
                userId = userId,
                productId = deal.dealId,
                targetPrice = targetPrice,
                currentPriceWhenCreated = deal.effectivePrice,
                alertStatus = "active",
                notificationSent = false,
                createdAt = now,
                updatedAt = now
            )
            firestore?.collection(Constants.PRICE_ALERTS)?.document(alertId)?.set(alert)?.await()
        }
    }

    suspend fun disablePriceDropAlert(dealId: String) {
        val userId = userRepository.getCurrentUserId()
        userRepository.removePriceDropAlert(dealId)
        if (firebaseEnabled && userId != null) {
            firestore?.collection(Constants.PRICE_ALERTS)?.document("$userId-$dealId")
                ?.set(
                    mapOf(
                        "alert_status" to "removed",
                        "alertStatus" to "removed",
                        "updated_at" to System.currentTimeMillis(),
                        "updatedAt" to System.currentTimeMillis()
                    ),
                    SetOptions.merge()
                )
                ?.await()
        }
    }

    suspend fun createPriceDropNotificationIfNeeded(
        deal: DealModel,
        history: List<PricePointModel>,
        targetPrice: Double
    ): Boolean {
        val currentPrice = deal.effectivePrice
        val previousPrice = history.dropLast(1).lastOrNull()?.price ?: history.lastOrNull()?.price ?: deal.originalPrice
        val dropped = shouldCreatePriceDropNotification(deal, history, targetPrice) || currentPrice < previousPrice
        if (!dropped) return false

        if (firebaseEnabled) {
            val userId = userRepository.getCurrentUserId().orEmpty()
            val notificationId = "price-drop-${deal.dealId}-$userId"
            val notification = priceInsightNotificationText(deal, calculatePriceStats(deal, history))
            val payload = mapOf(
                "notificationId" to notificationId,
                "title" to notification.first,
                "message" to notification.second,
                "image" to deal.productImage,
                "dealId" to deal.dealId,
                "targetUrl" to deal.redirectUrl,
                "notificationType" to "PRICE_DROP",
                "isRead" to false,
                "userId" to userId,
                "createdAt" to System.currentTimeMillis()
            )
            firestore?.collection(Constants.NOTIFICATIONS)?.document(notificationId)?.set(payload)?.await()
        }
        return true
    }

    suspend fun incrementDealCounter(dealId: String, field: String) {
        if (firebaseEnabled) {
            firestore?.collection(Constants.DEALS)?.document(dealId)
                ?.update(field, FieldValue.increment(1))
                ?.await()
        }
    }

    companion object {
        fun buildPriceHistoryRecord(
            deal: DealModel,
            history: List<PricePointModel> = emptyList(),
            checkedAt: Long = System.currentTimeMillis()
        ): PricePointModel {
            val previousPrice = history.maxByOrNull { it.recordedAt }?.price ?: deal.effectivePrice
            val provisional = PricePointModel(
                id = "${deal.dealId}-$checkedAt",
                productId = deal.dealId,
                storeName = deal.storeName,
                productUrl = deal.productUrl,
                affiliateUrl = deal.redirectUrl,
                priceAmount = deal.effectivePrice,
                currentPrice = deal.effectivePrice,
                originalPrice = deal.originalPrice,
                discountPercentage = deal.discountPercent,
                priceDropAmount = (previousPrice - deal.effectivePrice).coerceAtLeast(0.0),
                checkedAt = checkedAt,
                priceCheckedAt = checkedAt,
                createdAt = checkedAt,
                updatedAt = checkedAt,
                source = "firebase"
            )
            val stats = calculatePriceStats(deal, history + provisional)
            return provisional.copy(
                lowestPrice = stats.lowestPrice,
                highestPrice = stats.highestPrice,
                averagePrice = stats.averagePrice
            )
        }

        fun suggestedAlertPrice(deal: DealModel, history: List<PricePointModel>): Double {
            val stats = calculatePriceStats(deal, history)
            val tenPercentLower = deal.effectivePrice * 0.90
            val nearLowest = if (stats.lowestPrice > 0.0) stats.lowestPrice * 1.02 else tenPercentLower
            val belowAverage = if (stats.averagePrice > 0.0) stats.averagePrice * 0.92 else tenPercentLower
            return minOf(tenPercentLower, nearLowest, belowAverage).coerceAtLeast(0.0)
        }

        fun shouldCreatePriceDropNotification(
            deal: DealModel,
            history: List<PricePointModel>,
            targetPrice: Double? = null
        ): Boolean {
            val prices = history.map { it.price }.filter { it >= 0.0 }
            val previousLowest = prices.minOrNull()
            val stats = calculatePriceStats(deal, history)
            val hitsTarget = targetPrice?.let { deal.effectivePrice <= it } ?: false
            val reachesNewLowest = previousLowest != null && deal.effectivePrice < previousLowest
            val belowAverage = stats.averagePrice > 0.0 && deal.effectivePrice < stats.averagePrice
            val deepDiscount = deal.discountPercent > 50
            return hitsTarget || reachesNewLowest || belowAverage || deepDiscount
        }

        fun calculatePriceStats(
            deal: DealModel,
            history: List<PricePointModel>
        ): PriceStatsModel {
            val prices = history.map { it.price }.filter { it >= 0.0 }.ifEmpty { listOf(deal.effectivePrice) }
            val current = deal.effectivePrice
            val average = prices.average()
            val highest = prices.maxOrNull() ?: current
            val lowest = prices.minOrNull() ?: current
            val dropPercent = if (average > 0.0 && current < average) {
                (((average - current) / average) * 100).toInt()
            } else {
                0
            }
            return PriceStatsModel(
                currentPrice = current,
                averagePrice = average,
                highestPrice = highest,
                lowestPrice = lowest,
                dropFromAveragePercent = dropPercent,
                isLowestPriceNow = current <= lowest
            )
        }

        fun filterAndSortDeals(
            deals: List<DealModel>,
            query: String = "",
            storeFilter: String = "All",
            sortOption: String = "Newest Deals"
        ): List<DealModel> {
            val filtered = deals.filter { deal ->
                val matchesStore = storeFilter == "All" || deal.storeName.equals(storeFilter, ignoreCase = true)
                val q = query.trim()
                val matchesQuery = q.isBlank() ||
                    deal.title.contains(q, ignoreCase = true) ||
                    deal.storeName.contains(q, ignoreCase = true) ||
                    deal.categoryName.contains(q, ignoreCase = true) ||
                    deal.dealType.contains(q, ignoreCase = true) ||
                    deal.couponCode.contains(q, ignoreCase = true)
                matchesStore && matchesQuery
            }

            return when (sortOption) {
                "Highest Discount" -> filtered.sortedByDescending { it.discountPercent }
                "Lowest Price" -> filtered.sortedBy { it.effectivePrice }
                "Popular Deals" -> filtered.sortedByDescending { it.savedCount + it.shareCount }
                "Free Deals" -> filtered.sortedWith(compareByDescending<DealModel> { it.isFreeDeal }.thenBy { it.effectivePrice })
                "Expiring Soon" -> filtered.sortedBy { it.expiryDate }
                "Latest Deals" -> filtered.sortedByDescending { it.createdAt }
                else -> filtered.sortedByDescending { it.createdAt }
            }
        }
    }

    private suspend fun createPriceInsightNotification(deal: DealModel, stats: PriceStatsModel) {
        if (!firebaseEnabled) return
        val userId = userRepository.getCurrentUserId().orEmpty()
        val notificationId = "price-insight-${deal.dealId}-${System.currentTimeMillis()}"
        val notification = priceInsightNotificationText(deal, stats)
        val payload = mapOf(
            "notificationId" to notificationId,
            "title" to notification.first,
            "message" to notification.second,
            "image" to deal.productImage,
            "dealId" to deal.dealId,
            "targetUrl" to deal.redirectUrl,
            "notificationType" to "PRICE_DROP",
            "isRead" to false,
            "userId" to userId,
            "createdAt" to System.currentTimeMillis()
        )
        firestore?.collection(Constants.NOTIFICATIONS)?.document(notificationId)?.set(payload)?.await()
    }

    private fun priceInsightNotificationText(deal: DealModel, stats: PriceStatsModel): Pair<String, String> =
        when {
            stats.isLowestPriceNow -> "Lowest Price Alert!" to "${deal.title} is now at its lowest price ever on ${deal.storeName}."
            stats.dropFromAveragePercent > 0 -> "Price Drop Alert!" to "${deal.title} dropped below average price. Current price is Rs.${stats.currentPrice.toInt()}."
            deal.discountPercent > 50 -> "Big Discount Alert!" to "${deal.title} is now ${deal.discountPercent}% off on ${deal.storeName}."
            else -> "Price Alert!" to "${deal.title} is now Rs.${stats.currentPrice.toInt()}."
        }

    private suspend fun updateProductPriceDocuments(
        db: FirebaseFirestore,
        deal: DealModel,
        stats: PriceStatsModel
    ) {
        val now = System.currentTimeMillis()
        val productPayload = mapOf(
            "id" to deal.dealId,
            "dealId" to deal.dealId,
            "title" to deal.title,
            "description" to deal.description,
            "image_url" to deal.productImage,
            "productImage" to deal.productImage,
            "store_name" to deal.storeName,
            "storeName" to deal.storeName,
            "category" to deal.categoryName,
            "categoryName" to deal.categoryName,
            "categoryId" to deal.categoryId,
            "product_url" to deal.productUrl,
            "productUrl" to deal.productUrl,
            "affiliate_url" to deal.redirectUrl,
            "affiliateUrl" to deal.redirectUrl,
            "current_price" to stats.currentPrice,
            "currentPrice" to stats.currentPrice,
            "original_price" to deal.originalPrice,
            "originalPrice" to deal.originalPrice,
            "discount_percentage" to deal.discountPercent,
            "discountPercent" to deal.discountPercent,
            "lowest_price" to stats.lowestPrice,
            "lowestPrice" to stats.lowestPrice,
            "highest_price" to stats.highestPrice,
            "highestPrice" to stats.highestPrice,
            "average_price" to stats.averagePrice,
            "averagePrice" to stats.averagePrice,
            "last_checked_at" to now,
            "price_checked_at" to now,
            "is_hot_deal" to (deal.isHotDeal || stats.isLowestPriceNow || deal.discountPercent > 50),
            "isHotDeal" to (deal.isHotDeal || stats.isLowestPriceNow || deal.discountPercent > 50),
            "updated_at" to now,
            "updatedAt" to now
        )
        db.collection(Constants.PRODUCTS).document(deal.dealId).set(productPayload, SetOptions.merge()).await()
        db.collection(Constants.DEALS).document(deal.dealId).set(productPayload, SetOptions.merge()).await()
    }

    private suspend fun checkActivePriceAlerts(
        db: FirebaseFirestore,
        deal: DealModel,
        stats: PriceStatsModel
    ) {
        val alerts = db.collection(Constants.PRICE_ALERTS)
            .whereEqualTo("product_id", deal.dealId)
            .whereEqualTo("alert_status", "active")
            .whereEqualTo("notification_sent", false)
            .get()
            .await()
        alerts.documents.forEach { document ->
            val targetPrice = when (val raw = document.get("target_price")) {
                is Number -> raw.toDouble()
                is String -> raw.toDoubleOrNull() ?: return@forEach
                else -> return@forEach
            }
            if (stats.currentPrice <= targetPrice) {
                val userId = (document.get("user_id") as? String).orEmpty()
                val notificationId = "target-price-${deal.dealId}-$userId-${System.currentTimeMillis()}"
                val payload = mapOf(
                    "notificationId" to notificationId,
                    "title" to "Price Alert!",
                    "message" to "${deal.title} is now Rs.${stats.currentPrice.toInt()}. Your target price has been reached.",
                    "image" to deal.productImage,
                    "dealId" to deal.dealId,
                    "targetUrl" to deal.redirectUrl,
                    "notificationType" to "PRICE_DROP",
                    "isRead" to false,
                    "userId" to userId,
                    "createdAt" to System.currentTimeMillis()
                )
                db.collection(Constants.NOTIFICATIONS).document(notificationId).set(payload).await()
                document.reference.set(
                    mapOf(
                        "alert_status" to "triggered",
                        "alertStatus" to "triggered",
                        "notification_sent" to true,
                        "notificationSent" to true,
                        "updated_at" to System.currentTimeMillis(),
                        "updatedAt" to System.currentTimeMillis()
                    ),
                    SetOptions.merge()
                ).await()
            }
        }
    }

    private fun DocumentSnapshot.toDealModel(): DealModel? {
        val data = data ?: return toObject(DealModel::class.java)
        val fallback = toObject(DealModel::class.java) ?: DealModel(dealId = id)

        fun string(vararg keys: String, default: String = ""): String {
            val value = keys.firstNotNullOfOrNull { key -> data[key] as? String }
            return value ?: default
        }

        fun double(vararg keys: String, default: Double = 0.0): Double {
            val value = keys.firstNotNullOfOrNull { key ->
                when (val raw = data[key]) {
                    is Number -> raw.toDouble()
                    is String -> raw.toDoubleOrNull()
                    else -> null
                }
            }
            return value ?: default
        }

        fun int(vararg keys: String, default: Int = 0): Int {
            val value = keys.firstNotNullOfOrNull { key ->
                when (val raw = data[key]) {
                    is Number -> raw.toInt()
                    is String -> raw.toIntOrNull()
                    else -> null
                }
            }
            return value ?: default
        }

        fun long(vararg keys: String, default: Long = System.currentTimeMillis()): Long {
            val value = keys.firstNotNullOfOrNull { key ->
                when (val raw = data[key]) {
                    is Number -> raw.toLong()
                    is String -> raw.toLongOrNull()
                    else -> null
                }
            }
            return value ?: default
        }

        fun bool(vararg keys: String, default: Boolean = false): Boolean {
            val value = keys.firstNotNullOfOrNull { key -> data[key] as? Boolean }
            return value ?: default
        }

        val dealId = string("dealId", "deal_id", "id", default = fallback.dealId.ifBlank { id })
        val productUrl = string("productUrl", "product_url", "dealUrl", "deal_url", default = fallback.productUrl.ifBlank { fallback.dealUrl })
        val affiliateUrl = string("affiliateUrl", "affiliate_url", default = fallback.affiliateUrl)
        val currentPrice = double("currentPrice", "current_price", "discountedPrice", "discounted_price", default = fallback.effectivePrice)
        val originalPrice = double("originalPrice", "original_price", default = fallback.originalPrice.coerceAtLeast(currentPrice))

        return fallback.copy(
            dealId = dealId,
            title = string("title", default = fallback.title),
            description = string("description", default = fallback.description),
            productImage = string("productImage", "image_url", "product_image", default = fallback.productImage),
            originalPrice = originalPrice,
            discountedPrice = double("discountedPrice", "discounted_price", "current_price", default = currentPrice),
            discountPercent = int("discountPercent", "discount_percentage", default = fallback.discountPercent),
            storeName = string("storeName", "store_name", default = fallback.storeName),
            storeLogo = string("storeLogo", "store_logo", default = fallback.storeLogo),
            categoryId = string("categoryId", "category_id", "category", default = fallback.categoryId),
            categoryName = string("categoryName", "category_name", "category", default = fallback.categoryName),
            dealType = string("dealType", "deal_type", default = fallback.dealType),
            dealUrl = string("dealUrl", "deal_url", default = affiliateUrl.ifBlank { productUrl }),
            productUrl = productUrl,
            affiliateUrl = affiliateUrl,
            couponCode = string("couponCode", "coupon_code", default = fallback.couponCode),
            isHotDeal = bool("isHotDeal", "is_hot_deal", default = fallback.isHotDeal),
            isFreeDeal = bool("isFreeDeal", "is_free_deal", default = fallback.isFreeDeal),
            isActive = bool("isActive", "is_active", default = fallback.isActive),
            isFeatured = bool("isFeatured", "is_featured", default = fallback.isFeatured),
            shareCount = int("shareCount", "share_count", default = fallback.shareCount),
            savedCount = int("savedCount", "saved_count", default = fallback.savedCount),
            currentPrice = currentPrice,
            lowestPrice = double("lowestPrice", "lowest_price", default = fallback.lowestPrice.takeIf { it > 0.0 } ?: currentPrice),
            highestPrice = double("highestPrice", "highest_price", default = fallback.highestPrice.takeIf { it > 0.0 } ?: originalPrice),
            averagePrice = double("averagePrice", "average_price", default = fallback.averagePrice.takeIf { it > 0.0 } ?: currentPrice),
            priceCheckedAt = long("priceCheckedAt", "price_checked_at", default = fallback.priceCheckedAt),
            createdAt = long("createdAt", "created_at", default = fallback.createdAt),
            updatedAt = long("updatedAt", "updated_at", default = fallback.updatedAt),
            expiryDate = long("expiryDate", "expiry_date", default = fallback.expiryDate)
        )
    }
}
