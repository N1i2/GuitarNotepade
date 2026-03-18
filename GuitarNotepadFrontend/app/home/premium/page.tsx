"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { PaymentsService } from "@/lib/api/payments-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, CreditCard, Star } from "lucide-react";

export default function PremiumPage() {
  const { user, refreshUser, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      toast.warning("Access denied", {
        description: "Please log in to access Premium features.",
      });
    }
  }, [authLoading, user, router, toast]);

  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPremium = user?.hasPremium;

  const canSubmit = useMemo(() => {
    return (
      cardNumber.trim().length >= 12 &&
      cardHolder.trim().length > 0 &&
      expiry.trim().length >= 4 &&
      cvc.trim().length >= 3
    );
  }, [cardNumber, cardHolder, expiry, cvc]);

  const handleUpgrade = async () => {
    if (!user) return;
    if (!canSubmit) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = btoa(
        `${cardNumber}|${cardHolder}|${expiry}|${cvc}|${crypto.randomUUID()}`,
      );
      const result = await PaymentsService.upgradeToPremium("card", token);
      if (result.success) {
        toast.success(result.message || "Premium activated!");
        await refreshUser();
      } else {
        toast.error(result.message || "Failed to upgrade to premium");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upgrade to premium");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Premium</h1>
            <p className="text-muted-foreground mt-2">
              Unlock unlimited content creation, subscriptions, and full album
              management.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium">
              {isPremium ? "Premium member" : "Free user"}
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isPremium ? "You are already premium" : "Upgrade to Premium"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isPremium ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  You have premium access and can create unlimited content and
                  subscriptions.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Enter your card details to simulate a payment. This is a
                      demo flow; no real transactions are performed.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardHolder">Cardholder Name</Label>
                      <Input
                        id="cardHolder"
                        placeholder="Your Name"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                      <Input
                        id="expiry"
                        placeholder="12/34"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input
                        id="cvc"
                        placeholder="123"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full md:w-auto"
                      onClick={handleUpgrade}
                      disabled={!canSubmit || isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Pay & Upgrade"}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      After upgrading, your account can create unlimited songs,
                      chords, patterns, albums and subscriptions.
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
