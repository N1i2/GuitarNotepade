import { LoginForm } from "@/components/forms/login-form";
import { AuthSwitchLink } from "@/components/auth/auth-switch-link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center from-background to-muted p-4">
      <div className="w-full max-w-md space-y-8">
        <LoginForm />
        <AuthSwitchLink variant="login" />
      </div>
    </div>
  );
}
