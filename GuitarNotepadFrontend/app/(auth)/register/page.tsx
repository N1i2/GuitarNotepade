import Link from "next/link"
import { RegisterForm } from "@/components/forms/register-form"
import { Button } from "@/components/ui/button"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center from-background to-muted p-4">
      
      <div className="w-full max-w-md space-y-8">
        <RegisterForm />
        
        <div className="text-center">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link href='/login' className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}