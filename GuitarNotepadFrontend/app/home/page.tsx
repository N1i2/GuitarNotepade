"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, FileMusic, FileText, Hand, ListMusic } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();

  const isGuest = user?.role === "Guest";

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <div className="space-y-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.accessDenied")}</CardTitle>
            <CardDescription>{t("dashboard.accessDeniedDesc")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hand className="h-5 w-5" />
                {t("dashboard.chordsTitle")}
              </CardTitle>
              <CardDescription>{t("dashboard.chordsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("dashboard.chordsBody")}
              </p>
              <Button asChild className="w-full">
                <Link href="/home/chords">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {t("dashboard.chordsCta")}
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListMusic className="h-5 w-5" />
                {t("dashboard.patternsTitle")}
              </CardTitle>
              <CardDescription>{t("dashboard.patternsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("dashboard.patternsBody")}
              </p>
              <Button asChild className="w-full">
                <Link href="/home/patterns">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {t("dashboard.patternsCta")}
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileMusic className="h-5 w-5" />
                {t("dashboard.songsTitle")}
              </CardTitle>
              <CardDescription>{t("dashboard.songsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("dashboard.songsBody")}
              </p>
              <Button asChild className="w-full">
                <Link href="/home/songs">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {t("dashboard.songsCta")}
                </Link>
              </Button>
            </CardContent>
          </Card>
          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("dashboard.albumsTitle")}
                </CardTitle>
                <CardDescription>{t("dashboard.albumsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("dashboard.albumsBody")}
                </p>
                <Button asChild className="w-full">
                  <Link href="/home/albums">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {t("dashboard.albumsCta")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("dashboard.usersTitle")}
                </CardTitle>
                <CardDescription>{t("dashboard.usersDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("dashboard.usersBody")}
                </p>
                <Button asChild className="w-full">
                  <Link href="/home/users">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {t("dashboard.usersCta")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("dashboard.subscriptionsTitle")}
                </CardTitle>
                <CardDescription>
                  {t("dashboard.subscriptionsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("dashboard.subscriptionsBody")}
                </p>
                <Button asChild className="w-full">
                  <Link href="/home/subscriptions">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {t("dashboard.subscriptionsCta")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("dashboard.premiumTitle")}
                </CardTitle>
                <CardDescription>{t("dashboard.premiumDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("dashboard.premiumBody")}
                </p>
                <Button asChild className="w-full">
                  <Link href="/home/premium">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {t("dashboard.premiumCta")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("dashboard.messagesTitle")}
                </CardTitle>
                <CardDescription>{t("dashboard.messagesDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("dashboard.messagesBody")}
                </p>
                <Button asChild className="w-full">
                  <Link href="/home/messages">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {t("dashboard.messagesCta")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
