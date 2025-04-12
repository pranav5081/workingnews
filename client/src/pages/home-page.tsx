import { useQuery } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import ArticleGrid from "@/components/articles/article-grid";
import ArticleCategories from "@/components/articles/article-categories";
import FeaturedArticle from "@/components/articles/featured-article";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "wouter";

const HomePage = () => {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const category = params.get("category") || "All";
  
  const { data: featuredArticle, isLoading: loadingFeatured } = useQuery<Article>({
    queryKey: ["/api/articles/featured"],
    queryFn: async () => {
      const res = await fetch("/api/articles", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch articles");
      const articles = await res.json();
      
      // Return the first article as featured
      return articles[0] || null;
    },
  });
  
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Featured Article */}
      {loadingFeatured ? (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:w-2/3">
                <Skeleton className="w-full h-72" />
              </div>
              <div className="md:w-1/3 p-6">
                <Skeleton className="h-5 w-20 mb-4" />
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-8 w-4/5 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-4 w-3/5 mb-4" />
                <div className="flex space-x-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-20 ml-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : featuredArticle ? (
        <FeaturedArticle article={featuredArticle} />
      ) : null}
      
      {/* News Categories Tabs */}
      <ArticleCategories />
      
      {/* Articles Grid */}
      <ArticleGrid category={category} />
    </main>
  );
};

export default HomePage;
