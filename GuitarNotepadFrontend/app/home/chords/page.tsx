"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { ChordsService } from "@/lib/api/chords-service";
import { PaginatedChords, Chord } from "@/types/chords";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Music, Grid3x3, Hash, Edit, User, Eye, EyeOff } from "lucide-react";
import { ChordGrid } from "@/components/chords/chord-grid";
import { Pagination } from "@/components/user-management/pagination";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface UniqueChordItem {
  name: string;
  variations: Chord[];
  totalVariations: number;
  sampleFingering: string;
  createdAt: Date;
  canEdit: boolean; 
  userVariations: Chord[]; 
}

export default function ChordsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [allChords, setAllChords] = useState<Chord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [uniqueChordsCount, setUniqueChordsCount] = useState(0);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [showOnlyMyChords, setShowOnlyMyChords] = useState(false);
  const pageSize = 48;

  const uniqueChords = useMemo(() => {
    const chordMap = new Map<string, UniqueChordItem>();
    
    allChords.forEach(chord => {
      if (!chordMap.has(chord.name)) {
        chordMap.set(chord.name, {
          name: chord.name,
          variations: [],
          totalVariations: 0,
          sampleFingering: chord.fingering,
          createdAt: new Date(chord.createdAt),
          canEdit: false,
          userVariations: []
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
    });
    
    let chordsArray = Array.from(chordMap.values());
    
    if (showOnlyMyChords && user) {
      chordsArray = chordsArray.filter(chord => 
        chord.userVariations.length > 0 || chord.canEdit
      );
    }
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      chordsArray = chordsArray.filter(chord => 
        chord.name.toLowerCase().includes(searchLower)
      );
    }
    
    chordsArray.sort((a, b) => a.name.localeCompare(b.name));
    
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = chordsArray.slice(startIndex, startIndex + pageSize);
    
    return {
      items: paginated,
      totalCount: chordsArray.length,
      currentPage,
      totalPages: Math.ceil(chordsArray.length / pageSize),
      hasPreviousPage: currentPage > 1,
      hasNextPage: startIndex + pageSize < chordsArray.length
    };
  }, [allChords, searchTerm, currentPage, showOnlyMyChords, user]);

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
          sortOrder: "asc"
        });
        
        allChordsData = [...allChordsData, ...data.items];
        
        if (data.items.length < loadPageSize || data.currentPage === data.totalPages) {
          hasMore = false;
        } else {
          currentPageNum++;
        }
      }
      
      setAllChords(allChordsData);
      setUniqueChordsCount(new Set(allChordsData.map(chord => chord.name)).size);
    } catch (error: any) {
      console.error("Failed to load chords:", error);
      toast.error("Failed to load chords. Please try again.");
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
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [showOnlyMyChords]);

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
    const chordItem = uniqueChords.items.find(item => item.name === chordName);
    if (chordItem && chordItem.userVariations.length > 0) {
      router.push(`/home/chords/edit/${chordItem.userVariations[0].id}`);
    }
  };

  const getChordItemsForGrid = () => {
    return uniqueChords.items.map(item => ({
      id: item.name,
      name: item.name,
      fingering: item.sampleFingering,
      description: `${item.totalVariations} variation${item.totalVariations !== 1 ? 's' : ''}`,
      createdAt: item.createdAt.toISOString(),
      createdByUserId: "",
      createdByNikName: "",
      variationsCount: item.totalVariations,
      canEdit: item.canEdit,
      userVariationsCount: item.userVariations.length
    }));
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chords Library</h1>
            <p className="text-muted-foreground mt-2">
              Browse and manage guitar chords. Click any chord to see its variations.
            </p>
          </div>
          <div className="hidden md:block">
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Chord Database</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isLoadingAll ? (
                    "Loading chords..."
                  ) : (
                    `${uniqueChordsCount} unique chords`
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search chords (e.g., Am, C, G7)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="showOnlyMyChords" 
                    checked={showOnlyMyChords}
                    onCheckedChange={(checked) => setShowOnlyMyChords(checked as boolean)}
                    disabled={!user}
                  />
                  <Label 
                    htmlFor="showOnlyMyChords" 
                    className={`text-sm font-medium cursor-pointer ${!user ? 'text-muted-foreground' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {showOnlyMyChords ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span>Only my chords</span>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="hidden md:flex">
                    <Hash className="h-3 w-3 mr-1" />
                    {isLoadingAll ? "..." : uniqueChords.totalCount} chords
                  </Badge>
                  <Button onClick={handleCreateNew} variant="default" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Chord
                  </Button>
                </div>
              </div>
            </div>
            
            {user && showOnlyMyChords && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 dark:text-blue-300">
                    Showing only chords that you can edit
                  </span>
                </div>
              </div>
            )}
            
            {!user && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-sm">
                  <EyeOff className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-300">
                    Sign in to use "Only my chords" filter
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
                  {showOnlyMyChords ? "My Chords" : "All Unique Chords"}
                </CardTitle>
                {!isLoadingAll && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({uniqueChords.totalCount} total)
                  </span>
                )}
              </div>
              {!isLoading && uniqueChords.items.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {uniqueChords.totalPages}
                </div>
              )}
            </div>
            <CardDescription>
              {showOnlyMyChords 
                ? "Chords that you can edit. Click edit icon to modify your variations."
                : "Click any chord to explore its different fingerings and variations"}
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
                  {showOnlyMyChords ? "No chords found" : "No chords available"}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm
                    ? `No chords matching "${searchTerm}"`
                    : showOnlyMyChords
                    ? "You haven't created any chords yet. Create your first one!"
                    : "No chords available yet. Create the first one!"}
                </p>
                {(searchTerm || showOnlyMyChords) && (
                  <div className="flex gap-2 justify-center mt-4">
                    {searchTerm && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("");
                        }}
                      >
                        Clear Search
                      </Button>
                    )}
                    {showOnlyMyChords && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowOnlyMyChords(false);
                        }}
                      >
                        Show All Chords
                      </Button>
                    )}
                    <Button
                      variant="default"
                      onClick={handleCreateNew}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Chord
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