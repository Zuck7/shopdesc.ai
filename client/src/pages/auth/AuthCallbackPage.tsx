import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    api
      .get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        login(token, res.data);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        navigate("/login", { replace: true });
      });
  }, [searchParams, login, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing in...</p>
    </div>
  );
}
