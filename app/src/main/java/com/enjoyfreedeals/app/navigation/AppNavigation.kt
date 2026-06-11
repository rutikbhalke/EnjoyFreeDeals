package com.enjoyfreedeals.app.navigation

import android.widget.Toast
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.Article
import androidx.compose.material.icons.outlined.Category
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.enjoyfreedeals.app.data.model.DealModel
import com.enjoyfreedeals.app.ui.about.AboutScreen
import com.enjoyfreedeals.app.ui.auth.LoginScreen
import com.enjoyfreedeals.app.ui.blog.BlogDetailScreen
import com.enjoyfreedeals.app.ui.blog.BlogScreen
import com.enjoyfreedeals.app.ui.category.CategoryDealsScreen
import com.enjoyfreedeals.app.ui.category.CategoryScreen
import com.enjoyfreedeals.app.ui.deals.DealsScreen
import com.enjoyfreedeals.app.ui.deals.PriceAlertScreen
import com.enjoyfreedeals.app.ui.deals.ProductPriceHistoryScreen
import com.enjoyfreedeals.app.ui.deals.shareDeal
import com.enjoyfreedeals.app.ui.details.ProductDetailScreen
import com.enjoyfreedeals.app.ui.home.HomeScreen
import com.enjoyfreedeals.app.ui.notification.NotificationScreen
import com.enjoyfreedeals.app.ui.profile.ProfileScreen
import com.enjoyfreedeals.app.ui.saved.DealCollectionScreen
import com.enjoyfreedeals.app.ui.saved.SavedDealsScreen
import com.enjoyfreedeals.app.ui.saved.SharedDealsScreen
import com.enjoyfreedeals.app.ui.settings.LanguageSettingsScreen
import com.enjoyfreedeals.app.ui.settings.SettingsScreen
import com.enjoyfreedeals.app.ui.splash.SplashScreen
import com.enjoyfreedeals.app.utils.CustomTabsHelper
import com.enjoyfreedeals.app.utils.LocalAppStrings
import com.enjoyfreedeals.app.viewmodel.AuthViewModel
import com.enjoyfreedeals.app.viewmodel.BlogViewModel
import com.enjoyfreedeals.app.viewmodel.CategoryViewModel
import com.enjoyfreedeals.app.viewmodel.DealsViewModel
import com.enjoyfreedeals.app.viewmodel.HomeViewModel
import com.enjoyfreedeals.app.viewmodel.NotificationViewModel
import com.enjoyfreedeals.app.viewmodel.ProductDetailViewModel
import com.enjoyfreedeals.app.viewmodel.ProfileViewModel
import com.enjoyfreedeals.app.viewmodel.SettingsViewModel
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun AppNavigation(
    authViewModel: AuthViewModel,
    homeViewModel: HomeViewModel,
    dealsViewModel: DealsViewModel,
    categoryViewModel: CategoryViewModel,
    blogViewModel: BlogViewModel,
    notificationViewModel: NotificationViewModel,
    profileViewModel: ProfileViewModel,
    settingsViewModel: SettingsViewModel
) {
    val rootNavController = rememberNavController()
    val authState by authViewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        authViewModel.checkSession()
    }

    NavHost(rootNavController, startDestination = Route.Splash) {
        composable(Route.Splash) {
            SplashScreen(authState.isAuthenticated) { loggedIn ->
                rootNavController.navigate(if (loggedIn) Route.Main else Route.Login) {
                    popUpTo(Route.Splash) { inclusive = true }
                }
            }
        }
        composable(Route.Login) {
            LoginScreen(
                state = authState,
                onRequestOtp = authViewModel::requestLoginOtp,
                onVerifyOtp = authViewModel::verifyLoginOtp,
                onSuccess = {
                    rootNavController.navigate(Route.Main) {
                        popUpTo(Route.Login) { inclusive = true }
                    }
                },
                onMessageShown = authViewModel::clearMessage
            )
        }
        composable(Route.Main) {
            MainScaffold(
                homeViewModel = homeViewModel,
                dealsViewModel = dealsViewModel,
                categoryViewModel = categoryViewModel,
                blogViewModel = blogViewModel,
                notificationViewModel = notificationViewModel,
                profileViewModel = profileViewModel,
                settingsViewModel = settingsViewModel,
                onLogout = {
                    authViewModel.logout()
                    rootNavController.navigate(Route.Login) {
                        popUpTo(Route.Main) { inclusive = true }
                    }
                }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainScaffold(
    homeViewModel: HomeViewModel,
    dealsViewModel: DealsViewModel,
    categoryViewModel: CategoryViewModel,
    blogViewModel: BlogViewModel,
    notificationViewModel: NotificationViewModel,
    profileViewModel: ProfileViewModel,
    settingsViewModel: SettingsViewModel,
    onLogout: () -> Unit
) {
    val navController = rememberNavController()
    val backStack by navController.currentBackStackEntryAsState()
    val destination = backStack?.destination
    val context = LocalContext.current
    val homeState by homeViewModel.uiState.collectAsState()
    val dealsState by dealsViewModel.uiState.collectAsState()
    val categoryState by categoryViewModel.uiState.collectAsState()
    val blogState by blogViewModel.uiState.collectAsState()
    val notificationState by notificationViewModel.uiState.collectAsState()
    val profileState by profileViewModel.uiState.collectAsState()
    val settingsState by settingsViewModel.uiState.collectAsState()
    val strings = LocalAppStrings.current
    val currentRoute = destination?.route
    val bottomRoutes = bottomTabs.map { it.route }.toSet()
    val bottomBarDestination = destination?.takeIf { it.route in bottomRoutes }
    val showBottomBar = bottomBarDestination != null
    val nestedTitle = when (currentRoute) {
        Route.CategoryDeals -> categoryState.selectedCategory?.categoryName ?: "Category Deals"
        Route.BlogDetail -> "Article"
        Route.Notifications -> "Notifications"
        Route.SavedDeals -> "Saved Deals"
        Route.SharedDeals -> "Shared Deals"
        Route.PriceAlertsList -> "Price Alerts"
        Route.RecentlyViewed -> "Recently Viewed"
        Route.Settings -> "Settings"
        Route.LanguageSettings -> "Language"
        Route.About -> "About"
        Route.ProductDetail -> "Deal Details"
        Route.ProductPriceHistory -> "Price History"
        Route.PriceAlert -> "Price Alert"
        else -> "EnjoyFreeDeals"
    }

    fun viewDeal(deal: DealModel) {
        CustomTabsHelper.openDealUrl(context, deal.redirectUrl) { message ->
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    fun openDealDetails(deal: DealModel) {
        dealsViewModel.selectDeal(deal)
        navController.navigate(Route.productDetail(deal.dealId))
    }

    fun openPriceAlert(deal: DealModel) {
        dealsViewModel.selectDeal(deal)
        navController.navigate(Route.PriceAlert)
    }

    Scaffold(
        topBar = {
            if (!showBottomBar && currentRoute != null) {
                CenterAlignedTopAppBar(
                    title = {
                        Text(
                            nestedTitle,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                        }
                    }
                )
            }
        },
        bottomBar = {
            if (bottomBarDestination != null) {
                Surface(
                    shadowElevation = 10.dp,
                    shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
                ) {
                    NavigationBar(
                        modifier = Modifier.clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)),
                        containerColor = MaterialTheme.colorScheme.surface
                    ) {
                        bottomTabs.forEach { tab ->
                            val selected = bottomBarDestination.hierarchy.any { it.route == tab.route }
                            val scale by animateFloatAsState(if (selected) 1.16f else 1f, label = "${tab.route}-scale")
                            val label = tab.label(strings)
                            NavigationBarItem(
                                selected = selected,
                                onClick = {
                                    navController.navigate(tab.route) {
                                        popUpTo(Route.Home) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                },
                                icon = {
                                    Icon(
                                        tab.icon,
                                        contentDescription = label,
                                        modifier = Modifier.graphicsLayer {
                                            scaleX = scale
                                            scaleY = scale
                                        }
                                    )
                                },
                                label = { Text(label) }
                            )
                        }
                    }
                }
            }
        }
    ) { padding ->
        Box(Modifier.padding(padding).background(MaterialTheme.colorScheme.background)) {
            NavHost(navController, startDestination = Route.Home) {
                composable(Route.Home) {
                    HomeScreen(
                        state = homeState,
                        onQueryChange = homeViewModel::updateQuery,
                        onNotificationClick = { navController.navigate(Route.Notifications) },
                        onCategoryClick = {
                            categoryViewModel.selectCategory(it)
                            navController.navigate(Route.CategoryDeals)
                        },
                        onViewDeal = ::viewDeal,
                        onSaveDeal = { deal ->
                            if (dealsState.savedDeals.contains(deal.dealId)) dealsViewModel.removeSavedDeal(deal) else dealsViewModel.saveDeal(deal)
                        },
                        onShareDeal = dealsViewModel::shareDeal,
                        onOpenDealDetails = ::openDealDetails,
                        onStorePriceClick = { storePrice ->
                            CustomTabsHelper.openDealUrl(context, storePrice.redirectUrl) { message ->
                                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                            }
                        },
                        onPriceAlertClick = ::openPriceAlert,
                        priceHistory = dealsState.priceHistory,
                        priceDropAlerts = dealsState.priceDropAlerts,
                        savedDeals = dealsState.savedDeals
                    )
                }
                composable(Route.Deals) {
                    DealsScreen(
                        state = dealsState,
                        onSearch = dealsViewModel::updateSearch,
                        onStoreFilter = dealsViewModel::updateStoreFilter,
                        onSort = dealsViewModel::updateSort,
                        onViewDeal = ::viewDeal,
                        onSaveDeal = { deal ->
                            if (dealsState.savedDeals.contains(deal.dealId)) dealsViewModel.removeSavedDeal(deal) else dealsViewModel.saveDeal(deal)
                        },
                        onRemoveSavedDeal = dealsViewModel::removeSavedDeal,
                        onShareDeal = dealsViewModel::shareDeal,
                        onTogglePriceAlert = dealsViewModel::togglePriceDropAlert,
                        onOpenDealDetails = ::openDealDetails,
                        onPriceAlertClick = ::openPriceAlert,
                        onLoadMore = dealsViewModel::loadMoreDeals,
                        onMessageShown = dealsViewModel::clearMessage
                    )
                }
                composable(Route.Category) {
                    CategoryScreen(categoryState) {
                        categoryViewModel.selectCategory(it)
                        navController.navigate(Route.CategoryDeals)
                    }
                }
                composable(Route.CategoryDeals) {
                    CategoryDealsScreen(
                        state = categoryState,
                        onSearch = categoryViewModel::updateCategorySearch,
                        onSort = categoryViewModel::updateSort,
                        onViewDeal = ::viewDeal,
                        onSaveDeal = { deal ->
                            if (dealsState.savedDeals.contains(deal.dealId)) dealsViewModel.removeSavedDeal(deal) else dealsViewModel.saveDeal(deal)
                        },
                        onShareDeal = dealsViewModel::shareDeal,
                        onOpenDealDetails = ::openDealDetails,
                        onPriceAlertClick = ::openPriceAlert,
                        priceHistory = dealsState.priceHistory,
                        priceDropAlerts = dealsState.priceDropAlerts,
                        savedDeals = dealsState.savedDeals
                    )
                }
                composable(Route.Blog) {
                    BlogScreen(blogState) {
                        blogViewModel.selectBlog(it)
                        navController.navigate(Route.BlogDetail)
                    }
                }
                composable(Route.BlogDetail) {
                    BlogDetailScreen(blogState.selectedBlog)
                }
                composable(Route.Notifications) {
                    NotificationScreen(
                        state = notificationState,
                        onMarkAllRead = notificationViewModel::markAllAsRead,
                        onOpenNotification = {
                            notificationViewModel.markAsRead(it)
                            CustomTabsHelper.openDealUrl(context, it.targetUrl) { message ->
                                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                            }
                        }
                    )
                }
                composable(Route.Profile) {
                    ProfileScreen(
                        state = profileState,
                        onNotificationToggle = profileViewModel::updateNotificationPreference,
                        onDarkModeToggle = profileViewModel::updateDarkModePreference,
                        onSavedDeals = { navController.navigate(Route.SavedDeals) },
                        onSharedDeals = { navController.navigate(Route.SharedDeals) },
                        onPriceAlerts = { navController.navigate(Route.PriceAlertsList) },
                        onRecentlyViewed = { navController.navigate(Route.RecentlyViewed) },
                        onSettings = { navController.navigate(Route.Settings) },
                        onLanguage = { navController.navigate(Route.LanguageSettings) },
                        onAbout = { navController.navigate(Route.About) },
                        onLogout = onLogout
                    )
                }
                composable(Route.Settings) {
                    SettingsScreen(
                        state = settingsState,
                        onLanguageClick = { navController.navigate(Route.LanguageSettings) },
                        onDarkModeToggle = {
                            settingsViewModel.setDarkMode(it)
                            profileViewModel.updateDarkModePreference(it)
                        },
                        onNotificationToggle = {
                            settingsViewModel.setNotifications(it)
                            profileViewModel.updateNotificationPreference(it)
                        },
                        onClearSavedDeals = profileViewModel::clearSavedDeals,
                        onAbout = { navController.navigate(Route.About) }
                    )
                }
                composable(Route.LanguageSettings) {
                    LanguageSettingsScreen(
                        selectedLanguageCode = settingsState.settings.languageCode,
                        onSelectLanguage = settingsViewModel::setLanguage
                    )
                }
                composable(Route.SavedDeals) {
                    SavedDealsScreen(
                        deals = profileState.savedDeals,
                        onViewDeal = ::viewDeal,
                        onRemoveSavedDeal = profileViewModel::removeSavedDeal,
                        onShareDeal = dealsViewModel::shareDeal,
                        onOpenDealDetails = ::openDealDetails,
                        onPriceAlertClick = ::openPriceAlert,
                        priceHistory = dealsState.priceHistory,
                        priceDropAlerts = dealsState.priceDropAlerts
                    )
                }
                composable(Route.SharedDeals) {
                    SharedDealsScreen(
                        deals = profileState.sharedDeals,
                        onViewDeal = ::viewDeal,
                        onShareAgain = dealsViewModel::shareDeal,
                        onOpenDealDetails = ::openDealDetails,
                        onPriceAlertClick = ::openPriceAlert,
                        priceHistory = dealsState.priceHistory,
                        priceDropAlerts = dealsState.priceDropAlerts
                    )
                }
                composable(Route.PriceAlertsList) {
                    DealCollectionScreen(
                        title = "Price Alerts",
                        emptyTitle = "No price alerts yet",
                        emptySubtitle = "Tap the alert icon on a deal to track its price.",
                        deals = profileState.priceAlertDeals,
                        onViewDeal = ::viewDeal,
                        onShareDeal = dealsViewModel::shareDeal,
                        onOpenDealDetails = ::openDealDetails,
                        onPriceAlertClick = ::openPriceAlert,
                        priceHistory = dealsState.priceHistory,
                        priceDropAlerts = dealsState.priceDropAlerts,
                        savedDeals = dealsState.savedDeals
                    )
                }
                composable(Route.RecentlyViewed) {
                    DealCollectionScreen(
                        title = "Recently Viewed Deals",
                        emptyTitle = "No recently viewed deals yet",
                        emptySubtitle = "Open a product detail page to see it here.",
                        deals = profileState.recentlyViewedDeals,
                        onViewDeal = ::viewDeal,
                        onShareDeal = dealsViewModel::shareDeal,
                        onOpenDealDetails = ::openDealDetails,
                        onPriceAlertClick = ::openPriceAlert,
                        priceHistory = dealsState.priceHistory,
                        priceDropAlerts = dealsState.priceDropAlerts,
                        savedDeals = dealsState.savedDeals
                    )
                }
                composable(Route.ProductPriceHistory) {
                    val selectedDeal = dealsState.selectedDeal
                    ProductPriceHistoryScreen(
                        deal = selectedDeal,
                        history = selectedDeal?.let { dealsState.priceHistory[it.dealId] }.orEmpty(),
                        isAlertEnabled = selectedDeal?.let { dealsState.priceDropAlerts.contains(it.dealId) } == true,
                        onSetPriceAlert = ::openPriceAlert,
                        onViewDeal = ::viewDeal
                    )
                }
                composable(
                    route = Route.ProductDetail,
                    arguments = listOf(navArgument(Route.DealIdArg) { type = NavType.StringType })
                ) { backStackEntry ->
                    val dealId = backStackEntry.arguments?.getString(Route.DealIdArg).orEmpty()
                    val productDetailViewModel: ProductDetailViewModel = viewModel(key = "product-detail-$dealId")
                    val detailState by productDetailViewModel.uiState.collectAsState()
                    LaunchedEffect(dealId) {
                        if (dealId.isNotBlank()) {
                            productDetailViewModel.load(dealId)
                        }
                    }
                    val selectedDeal = detailState.deal
                        ?: dealsState.selectedDeal?.takeIf { it.dealId == dealId || it.productId == dealId }
                        ?: dealsState.allDeals.firstOrNull { it.dealId == dealId || it.productId == dealId }
                        ?: homeState.deals.firstOrNull { it.dealId == dealId || it.productId == dealId }
                    ProductDetailScreen(
                        deal = selectedDeal,
                        allDeals = dealsState.allDeals.ifEmpty { homeState.deals },
                        onViewDeal = ::viewDeal,
                        onSaveDeal = dealsViewModel::saveDeal,
                        onShareDeal = {
                            shareDeal(context, it)
                            dealsViewModel.shareDeal(it)
                        },
                        onStorePriceClick = { storePrice ->
                            CustomTabsHelper.openDealUrl(context, storePrice.redirectUrl) { message ->
                                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                            }
                        },
                        onSimilarDealClick = ::openDealDetails,
                        priceHistory = detailState.priceHistory.ifEmpty {
                            selectedDeal?.let { dealsState.priceHistory[it.dealId] }.orEmpty()
                        },
                        isPriceAlertEnabled = selectedDeal?.let { dealsState.priceDropAlerts.contains(it.dealId) } == true,
                        onPriceAlertClick = ::openPriceAlert
                    )
                }
                composable(Route.PriceAlert) {
                    val selectedDeal = dealsState.selectedDeal
                    PriceAlertScreen(
                        deal = selectedDeal,
                        history = selectedDeal?.let { dealsState.priceHistory[it.dealId] }.orEmpty(),
                        currentTargetPrice = selectedDeal?.let { dealsState.priceDropTargets[it.dealId] },
                        onSaveAlert = dealsViewModel::savePriceAlert,
                        onRemoveAlert = dealsViewModel::removePriceAlert,
                        onViewDeal = ::viewDeal
                    )
                }
                composable(Route.About) {
                    AboutScreen { url ->
                        CustomTabsHelper.openDealUrl(context, url) { message ->
                            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
        }
    }
}

private object Route {
    const val Splash = "splash"
    const val Login = "login"
    const val Main = "main"
    const val Home = "home"
    const val Deals = "deals"
    const val Category = "category"
    const val CategoryDeals = "category_deals"
    const val Blog = "blog"
    const val BlogDetail = "blog_detail"
    const val Notifications = "notifications"
    const val Profile = "profile"
    const val SavedDeals = "saved_deals"
    const val SharedDeals = "shared_deals"
    const val PriceAlertsList = "price_alerts_list"
    const val RecentlyViewed = "recently_viewed"
    const val Settings = "settings"
    const val LanguageSettings = "language_settings"
    const val About = "about"
    const val DealIdArg = "dealId"
    const val ProductDetail = "product_detail/{$DealIdArg}"
    const val ProductPriceHistory = "product_price_history"
    const val PriceAlert = "price_alert"

    fun productDetail(dealId: String): String = "product_detail/$dealId"
}

private data class BottomTab(val route: String, val label: (com.enjoyfreedeals.app.utils.AppStrings) -> String, val icon: ImageVector)

private val bottomTabs = listOf(
    BottomTab(Route.Home, { it.home }, Icons.Outlined.Home),
    BottomTab(Route.Deals, { it.allDeals }, Icons.Outlined.LocalOffer),
    BottomTab(Route.Category, { it.category }, Icons.Outlined.Category),
    BottomTab(Route.Blog, { it.blog }, Icons.AutoMirrored.Outlined.Article),
    BottomTab(Route.Profile, { it.profile }, Icons.Outlined.Person)
)
