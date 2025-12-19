"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { PatternsService } from "@/lib/api/patterns-service";
import { Pattern } from "@/types/patterns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Grid3x3, Hash, User, Eye, EyeOff, ListMusic } from "lucide-react";
import { Pagination } from "@/components/user-management/pagination";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PatternsGrid } from "@/components/patterns/pattern-grid";

interface FilteredPatternsResult {
  items: Pattern[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface ApiError {
  status?: number;
  message?: string;
}

export default function PatternsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [allPatterns, setAllPatterns] = useState<Pattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [patternsCount, setPatternsCount] = useState(0);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [showOnlyMyPatterns, setShowOnlyMyPatterns] = useState(false);
  const [fingerStyleFilter, setFingerStyleFilter] = useState<boolean | null>(null);
  const pageSize = 16;

  const filteredPatterns = useMemo((): FilteredPatternsResult => {
    let filtered = allPatterns;
    
    if (fingerStyleFilter !== null) {
      filtered = filtered.filter(pattern => pattern.isFingerStyle === fingerStyleFilter);
    }
    
    if (showOnlyMyPatterns && user) {
      filtered = filtered.filter(pattern => 
        pattern.createdByUserId === user.id
      );
    }
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(pattern => 
        pattern.name.toLowerCase().includes(searchLower) ||
        (pattern.description && pattern.description.toLowerCase().includes(searchLower))
      );
    }
    
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);
    
    return {
      items: paginated,
      totalCount: filtered.length,
      currentPage,
      totalPages: Math.ceil(filtered.length / pageSize),
      hasPreviousPage: currentPage > 1,
      hasNextPage: startIndex + pageSize < filtered.length
    };
  }, [allPatterns, searchTerm, currentPage, showOnlyMyPatterns, fingerStyleFilter, user]);

  const loadAllPatterns = async () => {
    setIsLoadingAll(true);
    try {
      let allPatternsData: Pattern[] = [];
      let currentPageNum = 1;
      let hasMore = true;
      const loadPageSize = 100;

      while (hasMore) {
        const data = await PatternsService.getAllPatterns({
          page: currentPageNum,
          pageSize: loadPageSize,
          sortBy: "name",
          sortOrder: "asc"
        });

        allPatternsData = [...allPatternsData, ...data.items];
        
        if (data.items.length < loadPageSize || data.currentPage === data.totalPages) {
          hasMore = false;
        } else {
          currentPageNum++;
        }
      }
      
      setAllPatterns(allPatternsData);
      setPatternsCount(allPatternsData.length);
    } catch (error: unknown) {
      console.error("Failed to load patterns:", error);
      toast.error("Failed to load patterns. Please try again.");
    } finally {
      setIsLoadingAll(false);
    }
  };

  useEffect(() => {
    loadAllPatterns();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); 
    }, 300); 

    return () => clearTimeout(timer);
  }, [searchTerm, showOnlyMyPatterns, fingerStyleFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePatternClick = (name: string) => {
    router.push(`/home/patterns/${name}`);
  };

  const handleCreateNew = () => {
    router.push("/home/patterns/create");
  };

  const handleEditPattern = (patternId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    router.push(`/home/patterns/edit/${patternId}`);
  };

  const getFilterBadgeText = () => {
    if (fingerStyleFilter === true) return "FingerStyle";
    if (fingerStyleFilter === false) return "Strumming";
    return "All Types";
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patterns Library</h1>
            <p className="text-muted-foreground mt-2">
              Browse and manage guitar playing patterns (strumming and fingerstyle).
            </p>
          </div>
          <div className="hidden md:block">
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <ListMusic className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Patterns Database</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isLoadingAll ? (
                    "Loading patterns..."
                  ) : (
                    `${patternsCount} total patterns`
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
                    placeholder="Search patterns (e.g., Basic Strum, Travis Picking)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          {getFilterBadgeText()}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Pattern Type</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setFingerStyleFilter(null)}>
                          All Types
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFingerStyleFilter(true)}>
                          FingerStyle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFingerStyleFilter(false)}>
                          Strumming
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="showOnlyMyPatterns" 
                      checked={showOnlyMyPatterns}
                      onCheckedChange={(checked: boolean) => setShowOnlyMyPatterns(checked)}
                      disabled={!user}
                    />
                    <Label 
                      htmlFor="showOnlyMyPatterns" 
                      className={`text-sm font-medium cursor-pointer ${!user ? 'text-muted-foreground' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {showOnlyMyPatterns ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span>Only my patterns</span>
                      </div>
                    </Label>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="hidden md:flex">
                    <Hash className="h-3 w-3 mr-1" />
                    {isLoadingAll ? "..." : filteredPatterns.totalCount} patterns
                  </Badge>
                  <Button onClick={handleCreateNew} variant="default" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Pattern
                  </Button>
                </div>
              </div>
            </div>
            
            {(fingerStyleFilter !== null || showOnlyMyPatterns) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {fingerStyleFilter !== null && (
                  <Badge 
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => setFingerStyleFilter(null)}
                  >
                    Type: {fingerStyleFilter ? "FingerStyle" : "Strumming"}
                    <span className="ml-1 text-xs">×</span>
                  </Badge>
                )}
                
                {showOnlyMyPatterns && user && (
                  <Badge 
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => setShowOnlyMyPatterns(false)}
                  >
                    My Patterns
                    <span className="ml-1 text-xs">×</span>
                  </Badge>
                )}
              </div>
            )}
            
            {user && showOnlyMyPatterns && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 dark:text-blue-300">
                    Showing only patterns that you can edit
                  </span>
                </div>
              </div>
            )}
            
            {!user && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-sm">
                  <EyeOff className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-300">
                    Sign in to use "Only my patterns" filter
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
                  {showOnlyMyPatterns ? "My Patterns" : "All Patterns"}
                </CardTitle>
                {!isLoadingAll && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({filteredPatterns.totalCount} total)
                  </span>
                )}
              </div>
              {!isLoading && filteredPatterns.items.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {filteredPatterns.totalPages}
                </div>
              )}
            </div>
            <CardDescription>
              {showOnlyMyPatterns 
                ? "Patterns that you created. Click edit icon to modify."
                : "Click any pattern to see its details and notation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAll ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : filteredPatterns.items.length > 0 ? (
              <>
                <PatternsGrid
                  patterns={filteredPatterns.items} 
                  onPatternClick={handlePatternClick}
                  onEditClick={handleEditPattern}
                  showOnlyMyPatterns={showOnlyMyPatterns}
                  currentUserId={user?.id}
                />
                {filteredPatterns.totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={filteredPatterns.currentPage}
                      totalPages={filteredPatterns.totalPages}
                      onPageChange={handlePageChange}
                      hasPreviousPage={filteredPatterns.hasPreviousPage}
                      hasNextPage={filteredPatterns.hasNextPage}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <ListMusic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">
                  {showOnlyMyPatterns ? "No patterns found" : "No patterns available"}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm
                    ? `No patterns matching "${searchTerm}"`
                    : showOnlyMyPatterns
                    ? "You haven't created any patterns yet. Create your first one!"
                    : "No patterns available yet. Create the first one!"}
                </p>
                {(searchTerm || showOnlyMyPatterns || fingerStyleFilter !== null) && (
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
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
                    {(showOnlyMyPatterns || fingerStyleFilter !== null) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowOnlyMyPatterns(false);
                          setFingerStyleFilter(null);
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                    <Button
                      variant="default"
                      onClick={handleCreateNew}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Pattern
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