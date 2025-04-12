import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Article } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, Loader2, SearchIcon, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ArticleCard from "@/components/articles/article-card";

type BookmarkWithArticle = {
  bookmark: {
    id: number;
    userId: number;
    articleId: number;
    createdAt: Date;
  };
  article: Article;
};

const BookmarksPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch bookmarks
  const { data: bookmarks, isLoading } = useQuery<BookmarkWithArticle[]>({
    queryKey: ["/api/bookmarks"],
    queryFn: async () => {
      const res = await fetch("/api/bookmarks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      return res.json();
    },
    // Make bookmarks list more responsive
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0 // Consider data always stale to force refresh
  });
  
  // Clear all bookmarks mutation
  const clearAllBookmarksMutation = useMutation({
    mutationFn: async () => {
      if (!bookmarks || bookmarks.length === 0) return;
      
      const promises = bookmarks.map(b => 
        apiRequest("DELETE", `/api/bookmarks/${b.article.id}`)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "All bookmarks cleared",
        description: "All your bookmarks have been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter bookmarks based on search term
  const filteredBookmarks = bookmarks?.filter(b => {
    if (!b || !b.article) return false;
    
    const titleMatch = b.article.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const categoryMatch = b.article.category?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    return titleMatch || categoryMatch;
  });
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-serif font-bold">Your Bookmarks</h1>
          </div>
          
          {bookmarks && bookmarks.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => clearAllBookmarksMutation.mutate()}
              disabled={clearAllBookmarksMutation.isPending}
              className="text-neutral-600 hover:text-destructive hover:border-destructive"
            >
              {clearAllBookmarksMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              Clear All
            </Button>
          )}
        </div>
        
        {/* Search */}
        {bookmarks && bookmarks.length > 0 && (
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input 
              placeholder="Search your bookmarks..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
        
        {/* Bookmarks List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookmarks && bookmarks.length > 0 ? (
          <>
            {filteredBookmarks && filteredBookmarks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookmarks.map((item) => (
                  <ArticleCard 
                    key={item.bookmark.id} 
                    article={item.article} 
                    isBookmarked={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-neutral-50 rounded-lg">
                <p className="text-neutral-600 mb-2">No matching bookmarks found.</p>
                <button 
                  onClick={() => setSearchTerm("")}
                  className="text-primary hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-neutral-50 rounded-lg">
            <Bookmark className="h-16 w-16 text-neutral-300 mb-4" />
            <h3 className="text-xl font-medium text-neutral-700 mb-2">No bookmarks yet</h3>
            <p className="text-neutral-500 mb-6 text-center max-w-md">
              You haven't bookmarked any articles yet. Browse through articles and click the bookmark icon to save them here.
            </p>
            <Link href="/">
              <Button>
                Browse Articles
              </Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
};

export default BookmarksPage;
