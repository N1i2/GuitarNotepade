import Link from "next/link"
import { LoginForm } from "@/components/forms/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center from-background to-muted p-4">
      
      <div className="w-full max-w-md space-y-8">
        <LoginForm />
        <div className="text-center">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}