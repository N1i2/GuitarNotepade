import { RegisterForm } from "@/components/forms/register-form";
import { AuthSwitchLink } from "@/components/auth/auth-switch-link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center from-background to-muted p-4">
      <div className="w-full max-w-md space-y-8">
        <RegisterForm />
        <AuthSwitchLink variant="register" />
      </div>
    </div>
  );
}
