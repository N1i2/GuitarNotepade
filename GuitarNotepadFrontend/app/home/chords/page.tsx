"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { ChordsService } from "@/lib/api/chords-service";
import { Chord } from "@/types/chords";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Music,
  Grid3x3,
  Hash,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChordGrid } from "@/components/chords/chord-grid";
import { Pagination } from "@/components/user-management/pagination";

interface UniqueChordItem {
  name: string;
  variations: Chord[];
  totalVariations: number;
  sampleFingering: string;
  createdAt: Date;
  maxUpdatedAt: Date;
  canEdit: boolean;
  userVariations: Chord[];
}

interface ChordGridItem {
  id: string;
  name: string;
  fingering: string;
  description: string;
  createdAt: string;
  createdByUserId: string;
  createdByNikName: string;
  variationsCount: number;
  canEdit: boolean;
  userVariationsCount: number;
}

function normalizeFingering(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

export default function ChordsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();
  const isGuest = user?.role === "Guest";

  const [allChords, setAllChords] = useState<Chord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fingeringTerm, setFingeringTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [uniqueChordsCount, setUniqueChordsCount] = useState(0);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [showOnlyMyChords, setShowOnlyMyChords] = useState(false);
  const [sortField, setSortField] = useState<"name" | "createdAt" | "updatedAt">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const pageSize = 16;

  const uniqueChords = useMemo(() => {
    const chordMap = new Map<string, UniqueChordItem>();

    allChords.forEach((chord) => {
      if (!chordMap.has(chord.name)) {
        const created = new Date(chord.createdAt);
        chordMap.set(chord.name, {
          name: chord.name,
          variations: [],
          totalVariations: 0,
          sampleFingering: chord.fingering,
          createdAt: created,
          maxUpdatedAt: created,
          canEdit: false,
          userVariations: [],
        });
      }
      const item = chordMap.get(chord.name)!;
      item.variations.push(chord);
      item.totalVariations = item.variations.length;

      const isUserChord = user && chord.createdByUserId === user.id;
      if (isUserChord) {
        item.userVariations.push(chord);
        item.canEdit = true;
      }

      if (user?.role === "Admin") {
        item.canEdit = true;
      }

      const chordDate = new Date(chord.createdAt);
      if (chordDate < item.createdAt) {
        item.createdAt = chordDate;
      }
      const updatedSrc = chord.updatedAt || chord.createdAt;
      const updated = new Date(updatedSrc);
      if (updated > item.maxUpdatedAt) {
        item.maxUpdatedAt = updated;
      }
    });

    let chordsArray = Array.from(chordMap.values());

    if (showOnlyMyChords && user) {
      chordsArray = chordsArray.filter(
        (chord) => chord.userVariations.length > 0 || chord.canEdit,
      );
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      chordsArray = chordsArray.filter((chord) =>
        chord.name.toLowerCase().includes(searchLower),
      );
    }

    if (fingeringTerm.trim()) {
      const ft = normalizeFingering(fingeringTerm);
      chordsArray = chordsArray.filter(
        (chord) =>
          normalizeFingering(chord.sampleFingering).includes(ft) ||
          chord.variations.some((v) =>
            normalizeFingering(v.fingering).includes(ft),
          ),
      );
    }

    const dir = sortOrder === "asc" ? 1 : -1;
    chordsArray.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === "createdAt") {
        cmp = a.createdAt.getTime() - b.createdAt.getTime();
      } else {
        cmp = a.maxUpdatedAt.getTime() - b.maxUpdatedAt.getTime();
      }
      return cmp * dir;
    });

    const startIndex = (currentPage - 1) * pageSize;
    const paginated = chordsArray.slice(startIndex, startIndex + pageSize);

    return {
      items: paginated,
      totalCount: chordsArray.length,
      currentPage,
      totalPages: Math.ceil(chordsArray.length / pageSize),
      hasPreviousPage: currentPage > 1,
      hasNextPage: startIndex + pageSize < chordsArray.length,
    };
  }, [
    allChords,
    searchTerm,
    fingeringTerm,
    currentPage,
    showOnlyMyChords,
    user,
    sortField,
    sortOrder,
  ]);

  const loadAllChords = async () => {
    setIsLoadingAll(true);
    try {
      let allChordsData: Chord[] = [];
      let currentPageNum = 1;
      let hasMore = true;
      const loadPageSize = 100;

      while (hasMore) {
        const data = await ChordsService.getAllChords({
          page: currentPageNum,
          pageSize: loadPageSize,
          sortBy: "name",
          sortOrder: "asc",
        });

        allChordsData = [...allChordsData, ...data.items];

        if (
          data.items.length < loadPageSize ||
          data.currentPage === data.totalPages
        ) {
          hasMore = false;
        } else {
          currentPageNum++;
        }
      }

      setAllChords(allChordsData);
      setUniqueChordsCount(
        new Set(allChordsData.map((chord) => chord.name)).size,
      );
    } catch {
      toast.error(t("chordsPage.loadError"));
    } finally {
      setIsLoadingAll(false);
    }
  };

  useEffect(() => {
    loadAllChords();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, fingeringTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [showOnlyMyChords, sortField, sortOrder]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleChordClick = (chordName: string) => {
    router.push(`/home/chords/${encodeURIComponent(chordName)}`);
  };

  const handleCreateNew = () => {
    router.push("/home/chords/create");
  };

  const handleEditChord = (chordName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chordItem = uniqueChords.items.find(
      (item) => item.name === chordName,
    );
    if (chordItem && chordItem.userVariations.length > 0) {
      router.push(`/home/chords/edit/${chordItem.userVariations[0].id}`);
    }
  };

  const getChordItemsForGrid = (): ChordGridItem[] => {
    return uniqueChords.items.map((item) => ({
      id: item.name,
      name: item.name,
      fingering: item.sampleFingering,
      description:
        item.totalVariations === 1
          ? t("chordsPage.variationOne")
          : t("chordsPage.variationMany").replace(
              "{n}",
              String(item.totalVariations),
            ),
      createdAt: item.createdAt.toISOString(),
      createdByUserId: "",
      createdByNikName: "",
      variationsCount: item.totalVariations,
      canEdit: item.canEdit,
      userVariationsCount: item.userVariations.length,
    }));
  };

  const pageTitle =
    uniqueChords.totalPages > 1
      ? t("common.pageOf")
          .replace("{current}", String(currentPage))
          .replace("{total}", String(uniqueChords.totalPages))
      : "";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("chordsPage.title")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("chordsPage.subtitle")}
            </p>
          </div>
          <div className="hidden md:block">
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {t("chordsPage.dbTitle")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isLoadingAll
                    ? t("chordsPage.loadingChords")
                    : t("chordsPage.uniqueCount").replace(
                        "{n}",
                        String(uniqueChordsCount),
                      )}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("chordsPage.searchNamePlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("chordsPage.searchFingeringPlaceholder")}
                    value={fingeringTerm}
                    onChange={(e) => setFingeringTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {t("common.sortBy")}
                    </Label>
                    <Select
                      value={sortField}
                      onValueChange={(v) =>
                        setSortField(v as "name" | "createdAt" | "updatedAt")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">
                          {t("chordsPage.sortFieldName")}
                        </SelectItem>
                        <SelectItem value="createdAt">
                          {t("chordsPage.sortFieldCreated")}
                        </SelectItem>
                        <SelectItem value="updatedAt">
                          {t("chordsPage.sortFieldUpdated")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {t("common.sortOrder")}
                    </Label>
                    <Select
                      value={sortOrder}
                      onValueChange={(v) => setSortOrder(v as "asc" | "desc")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">
                          {t("common.ascending")}
                        </SelectItem>
                        <SelectItem value="desc">
                          {t("common.descending")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showOnlyMyChords"
                      checked={showOnlyMyChords}
                      onCheckedChange={(checked) =>
                        setShowOnlyMyChords(checked as boolean)
                      }
                      disabled={isGuest}
                    />
                    <Label
                      htmlFor="showOnlyMyChords"
                      className={`text-sm font-medium cursor-pointer ${!user ? "text-muted-foreground" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        {showOnlyMyChords ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span>{t("chordsPage.onlyMine")}</span>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="hidden md:flex">
                      <Hash className="h-3 w-3 mr-1" />
                      {isLoadingAll
                        ? "…"
                        : t("chordsPage.countBadge").replace(
                            "{n}",
                            String(uniqueChords.totalCount),
                          )}
                    </Badge>
                    {!isGuest && (
                      <Button
                        onClick={handleCreateNew}
                        variant="default"
                        className="w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t("chordsPage.createNew")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {user && showOnlyMyChords && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 dark:text-blue-300">
                    {t("chordsPage.mineHint")}
                  </span>
                </div>
              </div>
            )}

            {isGuest && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-sm">
                  <EyeOff className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-300">
                    {t("chordsPage.signInFilter")}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5" />
                <CardTitle>
                  {showOnlyMyChords
                    ? t("chordsPage.gridMineTitle")
                    : t("chordsPage.gridAllTitle")}
                </CardTitle>
                {!isLoadingAll && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (
                    {t("chordsPage.totalLabel").replace(
                      "{n}",
                      String(uniqueChords.totalCount),
                    )}
                    )
                  </span>
                )}
              </div>
              {!isLoadingAll && uniqueChords.items.length > 0 && pageTitle && (
                <div className="text-sm text-muted-foreground">{pageTitle}</div>
              )}
            </div>
            <CardDescription>
              {showOnlyMyChords
                ? t("chordsPage.gridDescMine")
                : t("chordsPage.gridDescAll")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAll ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : uniqueChords.items.length > 0 ? (
              <>
                <ChordGrid
                  chords={getChordItemsForGrid()}
                  onChordClick={handleChordClick}
                  onEditClick={handleEditChord}
                  showVariationCount={true}
                  showOnlyMyChords={showOnlyMyChords}
                />
                {uniqueChords.totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={uniqueChords.currentPage}
                      totalPages={uniqueChords.totalPages}
                      onPageChange={handlePageChange}
                      hasPreviousPage={uniqueChords.hasPreviousPage}
                      hasNextPage={uniqueChords.hasNextPage}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">
                  {showOnlyMyChords
                    ? t("chordsPage.emptyMine")
                    : t("chordsPage.emptyAll")}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm || fingeringTerm
                    ? t("chordsPage.emptySearch").replace(
                        "{term}",
                        searchTerm || fingeringTerm,
                      )
                    : showOnlyMyChords
                      ? t("chordsPage.emptyMineHint")
                      : t("chordsPage.emptyAllHint")}
                </p>
                {(searchTerm || fingeringTerm || showOnlyMyChords) && (
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {searchTerm && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("");
                        }}
                      >
                        {t("chordsPage.clearSearch")}
                      </Button>
                    )}
                    {fingeringTerm && (
                      <Button
                        variant="outline"
                        onClick={() => setFingeringTerm("")}
                      >
                        {t("chordsPage.clearFingering")}
                      </Button>
                    )}
                    {showOnlyMyChords && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowOnlyMyChords(false);
                        }}
                      >
                        {t("chordsPage.showAll")}
                      </Button>
                    )}
                    <Button variant="default" onClick={handleCreateNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t("chordsPage.createNew")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
