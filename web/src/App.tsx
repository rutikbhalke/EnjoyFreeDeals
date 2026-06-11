import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminRoute from "@/components/auth/AdminRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import PageSkeleton from "@/components/ui/page-skeleton";
import { ThemeProvider } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import Index from "./pages/Index";

// Lazy-loaded pages
const DealsPage = lazy(() => import("./pages/DealsPage"));
const DealDetailPage = lazy(() => import("./pages/DealDetailPage"));
const StoresPage = lazy(() => import("./pages/StoresPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const SignupPage = lazy(() => import("./pages/auth/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminDeals = lazy(() => import("./pages/admin/AdminDeals"));
const AdminStores = lazy(() => import("./pages/admin/AdminStores"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminWebhookDeals = lazy(() => import("./pages/admin/AdminWebhookDeals"));
const AdminSubmissions = lazy(() => import("./pages/admin/AdminSubmissions"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const SubmitDealPage = lazy(() => import("./pages/SubmitDealPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const SavingsDashboardPage = lazy(() => import("./pages/SavingsDashboardPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PriceHistoryPage = lazy(() => import("./pages/PriceHistoryPage"));
const CouponsPage = lazy(() => import("./pages/CouponsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/deals/:slug" element={<DealDetailPage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/price-history" element={<PriceHistoryPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/submit-deal" element={<SubmitDealPage />} />
          <Route path="/savings" element={<SavingsDashboardPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="deals" element={<AdminDeals />} />
            <Route path="stores" element={<AdminStores />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="webhook-deals" element={<AdminWebhookDeals />} />
            <Route path="submissions" element={<AdminSubmissions />} />
            <Route path="blog" element={<AdminBlog />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageSkeleton />}>
              <AnimatedRoutes />
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
