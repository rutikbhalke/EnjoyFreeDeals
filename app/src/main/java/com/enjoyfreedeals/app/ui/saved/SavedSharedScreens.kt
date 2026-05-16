package com.enjoyfreedeals.app.ui.saved

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.ui.components.DealCard
import com.enjoyfreedeals.app.ui.components.EmptyState
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.SectionTitle

@Composable
fun SavedDealsScreen(
    deals: List<DealModel>,
    onViewDeal: (DealModel) -> Unit,
    onRemoveSavedDeal: (DealModel) -> Unit,
    onShareDeal: (DealModel) -> Unit
) {
    val context = LocalContext.current
    PremiumBackground {
        LazyColumn(contentPadding = PaddingValues(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item { SectionTitle("Saved Deals", "Deals you bookmarked for later") }
            if (deals.isEmpty()) {
                item { EmptyState("You have not saved any deals yet.", "Tap the heart on a deal to save it.") }
            } else {
                items(deals, key = { it.dealId }) { deal ->
                    DealCard(
                        deal = deal,
                        isSaved = true,
                        onViewDeal = onViewDeal,
                        onSaveDeal = onRemoveSavedDeal,
                        onShareDeal = {
                            shareDealAgain(context, it)
                            onShareDeal(it)
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun SharedDealsScreen(
    deals: List<DealModel>,
    onViewDeal: (DealModel) -> Unit,
    onShareAgain: (DealModel) -> Unit
) {
    val context = LocalContext.current
    PremiumBackground {
        LazyColumn(contentPadding = PaddingValues(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item { SectionTitle("Shared Deals", "Deals you have already shared") }
            if (deals.isEmpty()) {
                item { EmptyState("You have not shared any deals yet.", "Share a deal with friends to see it here.") }
            } else {
                items(deals, key = { it.dealId }) { deal ->
                    DealCard(
                        deal = deal,
                        isSaved = false,
                        onViewDeal = onViewDeal,
                        onSaveDeal = {},
                        onShareDeal = {
                            shareDealAgain(context, it)
                            onShareAgain(it)
                        }
                    )
                }
            }
        }
    }
}

private fun shareDealAgain(context: Context, deal: DealModel) {
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_SUBJECT, deal.title)
        putExtra(Intent.EXTRA_TEXT, "${deal.title}\n${deal.dealUrl}")
    }
    context.startActivity(Intent.createChooser(intent, "Share deal"))
}
