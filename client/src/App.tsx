import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { AuthCallbackPage } from "@/pages/auth/AuthCallbackPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ProductsListPage } from "@/pages/products/ProductsListPage";
import { NewProductPage } from "@/pages/products/NewProductPage";
import { ProductDetailPage } from "@/pages/products/ProductDetailPage";
import { ImportProductsPage } from "@/pages/products/ImportProductsPage";
import { GeneratePage } from "@/pages/generate/GeneratePage";
import { BulkGeneratePage } from "@/pages/generate/BulkGeneratePage";
import { JobProgressPage } from "@/pages/generate/JobProgressPage";
import { GenerationDetailPage } from "@/pages/results/GenerationDetailPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
<<<<<<< HEAD
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
=======
        <ErrorBoundary>
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<LandingPage />} />
>>>>>>> parent of 1ed44b9 (Phase 6 complete)

          {/* OAuth callback */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected dashboard routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsListPage />} />
              <Route path="/products/new" element={<NewProductPage />} />
              <Route path="/products/import" element={<ImportProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="/generate/bulk" element={<BulkGeneratePage />} />
              <Route path="/generate/jobs/:jobId" element={<JobProgressPage />} />
              <Route path="/results/:id" element={<GenerationDetailPage />} />
              <Route path="/settings" element={<DashboardPage />} />
            </Route>
          </Route>

<<<<<<< HEAD
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
=======
            {/* OAuth callback */}
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Protected dashboard routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/products" element={<ProductsListPage />} />
                <Route path="/products/new" element={<NewProductPage />} />
                <Route path="/products/import" element={<ImportProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/generate" element={<GeneratePage />} />
                <Route path="/generate/bulk" element={<BulkGeneratePage />} />
                <Route path="/generate/jobs/:jobId" element={<JobProgressPage />} />
                <Route path="/results/:id" element={<GenerationDetailPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings/billing" element={<BillingPage />} />
                <Route path="/settings/brand-voice" element={<BrandVoicePage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ErrorBoundary>
>>>>>>> parent of 1ed44b9 (Phase 6 complete)
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
