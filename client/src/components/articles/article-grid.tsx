import { useQuery } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import ArticleCard from "./article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

interface ArticleGridProps {
  category?: string;
}

const ArticleGrid = ({ category }: ArticleGridProps) => {
  const { user } = useAuth();
  
  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles", category],
    queryFn: async () => {
      const url = category && category !== "All" 
        ? `/api/articles?category=${category}`
        : "/api/articles";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json();
    },
  });
  
  const { data: bookmarkedArticleIds, refetch: refetchBookmarks } = useQuery<number[]>({
    queryKey: ["/api/bookmarks"],
    queryFn: async () => {
      const res = await fetch("/api/bookmarks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      const bookmarks = await res.json();
      
      // Handle different bookmark structures appropriately
      if (bookmarks.length === 0) return [];
      
      // Check the structure of the returned bookmarks
      if (bookmarks[0] && bookmarks[0].bookmark && bookmarks[0].article) {
        // Structure: [{ bookmark: {...}, article: {...} }]
        return bookmarks.map((b: any) => b.article.id);
      } else {
        // Fall back to assuming direct bookmark objects with articleId
        return bookmarks.map((b: any) => b.articleId || 0).filter((id: number) => id !== 0);
      }
    },
    enabled: !!user,
    // Refresh the bookmarks list more frequently
    refetchInterval: 3000,
    // Always refresh bookmarks when the component is in view
    refetchOnWindowFocus: true
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
            <Skeleton className="w-full h-48" />
            <div className="p-5">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-4/5 mb-4" />
              <Skeleton className="h-3 w-3/5 mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium text-neutral-600">No articles found</h3>
        <p className="text-neutral-500 mt-2">
          There are no articles in this category yet.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {articles.map((article) => (
        <ArticleCard 
          key={article.id} 
          article={article} 
          isBookmarked={bookmarkedArticleIds?.includes(article.id)}
        />
      ))}
    </div>
  );
};

export default ArticleGrid;
