package com.enjoyfreedeals.app.ui.blog

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.enjoyfreedeals.app.data.model.BlogModel
import com.enjoyfreedeals.app.ui.components.BlogCard
import com.enjoyfreedeals.app.ui.components.EmptyState
import com.enjoyfreedeals.app.ui.components.PremiumBackground
import com.enjoyfreedeals.app.ui.components.SectionTitle
import com.enjoyfreedeals.app.ui.components.formatDate
import com.enjoyfreedeals.app.viewmodel.BlogUiState

@Composable
fun BlogScreen(
    state: BlogUiState,
    onReadMore: (BlogModel) -> Unit
) {
    PremiumBackground {
        LazyColumn(
            contentPadding = PaddingValues(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                SectionTitle("Blog", "Shopping tips, offer guides and coupon tricks")
            }
            if (state.isLoading) {
                item { EmptyState("Loading blogs.", "Fetching the latest shopping guides.") }
            } else if (state.errorMessage != null) {
                item { EmptyState("Blogs unavailable.", state.errorMessage) }
            } else if (state.blogs.isEmpty()) {
                item { EmptyState("No blogs found right now.", "Fresh shopping guides will appear here.") }
            } else {
                items(state.blogs, key = { it.blogId }) { blog ->
                    BlogCard(blog, onReadMore)
                }
            }
        }
    }
}

@Composable
fun BlogDetailScreen(blog: BlogModel?) {
    PremiumBackground {
        LazyColumn(contentPadding = PaddingValues(18.dp)) {
            item {
                if (blog == null) {
                    EmptyState("Blog not found.", "Please select another article.")
                } else {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(26.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column {
                            AsyncImage(
                                model = blog.image,
                                contentDescription = blog.title,
                                modifier = Modifier.fillMaxWidth().height(220.dp),
                                contentScale = ContentScale.Crop
                            )
                            Column(Modifier.padding(18.dp)) {
                                Text(blog.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                                Spacer(Modifier.height(6.dp))
                                Text("${blog.author} - ${formatDate(blog.createdAt)}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(Modifier.height(16.dp))
                                Text(blog.fullContent, style = MaterialTheme.typography.bodyLarge)
                            }
                        }
                    }
                }
            }
        }
    }
}
