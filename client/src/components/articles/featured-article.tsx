import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Share, Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import ShareModal from "@/components/modals/share-modal";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedArticleProps {
  article: Article;
}

const FeaturedArticle = ({ article }: FeaturedArticleProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const { data: isBookmarked, isLoading: checkingBookmark } = useQuery<{bookmarked: boolean}>({
    queryKey: ["/api/bookmarks", article.id],
    queryFn: async () => {
      const res = await fetch(`/api/bookmarks/${article.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check bookmark status");
      return res.json();
    },
    enabled: !!user,
  });
  
  const createBookmarkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bookmarks", { articleId: article.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", article.id] });
      toast({
        title: "Article bookmarked",
        description: "This article has been added to your bookmarks.",
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
  
  const deleteBookmarkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/bookmarks/${article.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", article.id] });
      toast({
        title: "Bookmark removed",
        description: "This article has been removed from your bookmarks.",
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
  
  const handleBookmarkToggle = () => {
    if (isBookmarked?.bookmarked) {
      deleteBookmarkMutation.mutate();
    } else {
      createBookmarkMutation.mutate();
    }
  };
  
  return (
    <>
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            <div className="md:w-2/3">
              {article.featuredImageUrl ? (
                <img 
                  src={article.featuredImageUrl} 
                  alt={article.title}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>
            <div className="md:w-1/3 p-6">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">
                {article.category}
              </span>
              <Link href={`/article/${article.id}`}>
                <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4 hover:text-primary transition-colors">
                  {article.title}
                </h2>
              </Link>
              <p className="text-neutral-600 mb-4">{article.summary}</p>
              <div className="flex items-center text-sm text-neutral-500 mb-4">
                <span>By Admin</span>
                <span className="mx-2">•</span>
                <span>{new Date(article.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex space-x-3">
                <button 
                  className={`text-neutral-500 hover:text-primary transition ${isBookmarked?.bookmarked ? 'text-primary' : ''}`} 
                  title={isBookmarked?.bookmarked ? "Remove bookmark" : "Bookmark this article"}
                  onClick={handleBookmarkToggle}
                  disabled={!user || checkingBookmark}
                >
                  {checkingBookmark ? (
                    <Skeleton className="h-5 w-5" />
                  ) : isBookmarked?.bookmarked ? (
                    <BookmarkCheck size={20} />
                  ) : (
                    <Bookmark size={20} />
                  )}
                </button>
                <button 
                  className="text-neutral-500 hover:text-primary transition" 
                  title="Share this article"
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <Share size={20} />
                </button>
                <Link href={`/article/${article.id}`} className="ml-auto text-primary font-semibold hover:underline">
                  Read More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        article={article}
      />
    </>
  );
};

export default FeaturedArticle;
