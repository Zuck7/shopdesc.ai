import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">ShopDesc.ai</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered product descriptions for e-commerce
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
