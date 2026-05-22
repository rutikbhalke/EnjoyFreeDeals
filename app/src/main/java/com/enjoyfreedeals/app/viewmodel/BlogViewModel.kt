package com.enjoyfreedeals.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.enjoyfreedeals.app.data.model.BlogModel
import com.enjoyfreedeals.app.data.repository.BlogRepository
import com.enjoyfreedeals.app.utils.friendlyMessage
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class BlogUiState(
    val blogs: List<BlogModel> = emptyList(),
    val selectedBlog: BlogModel? = null,
    val isLoading: Boolean = true,
    val errorMessage: String? = null
)

class BlogViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = BlogRepository(application.applicationContext)
    private val _uiState = MutableStateFlow(BlogUiState())
    val uiState: StateFlow<BlogUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            repository.getPublishedBlogs()
                .catch { error ->
                    _uiState.update {
                        it.copy(isLoading = false, errorMessage = error.friendlyMessage("Could not load blogs."))
                    }
                }
                .collect { blogs ->
                    _uiState.update { it.copy(blogs = blogs, isLoading = false, errorMessage = null) }
                }
        }
    }

    fun selectBlog(blog: BlogModel) {
        _uiState.update { it.copy(selectedBlog = blog) }
    }
}
