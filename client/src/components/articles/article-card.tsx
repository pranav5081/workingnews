import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Share, Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import ShareModal from "@/components/modals/share-modal";

interface ArticleCardProps {
  article: Article;
  isBookmarked?: boolean;
}

const ArticleCard = ({ article, isBookmarked = false }: ArticleCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [, navigate] = useLocation();
  
  // Update internal state when prop changes
  useEffect(() => {
    setBookmarked(isBookmarked);
  }, [isBookmarked]);
  
  const createBookmarkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bookmarks", { articleId: article.id });
      return await res.json();
    },
    onSuccess: () => {
      setBookmarked(true);
      // Invalidate all bookmark-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/bookmarks/${article.id}`] });
      
      // Force an immediate refresh
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/bookmarks"] });
      }, 100);
      
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
      setBookmarked(false);
      // Invalidate all bookmark-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/bookmarks/${article.id}`] });
      
      // Force an immediate refresh
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/bookmarks"] });
      }, 100);
      
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
    try {
      if (bookmarked) {
        deleteBookmarkMutation.mutate();
      } else {
        createBookmarkMutation.mutate();
        
        // Ask user if they want to view bookmarks immediately
        const currentLocation = window.location.pathname;
        if (currentLocation !== '/bookmarks') {
          setTimeout(() => {
            const goToBookmarks = window.confirm("Article bookmarked. Would you like to view your bookmarks now?");
            if (goToBookmarks) {
              navigate("/bookmarks");
            }
          }, 200); // Short delay to allow the bookmark to be saved
        }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <article className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1">
        {article.featuredImageUrl && (
          <Link href={`/article/${article.id}`}>
            <img 
              src={article.featuredImageUrl} 
              alt={article.title} 
              className="w-full h-48 object-cover"
            />
          </Link>
        )}
        <div className="p-5">
          <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-3">
            {article.category}
          </span>
          <Link href={`/article/${article.id}`}>
            <h3 className="text-xl font-serif font-bold mb-2 hover:text-primary transition-colors">
              {article.title}
            </h3>
          </Link>
          <p className="text-neutral-600 text-sm mb-4">{article.summary}</p>
          <div className="flex items-center text-xs text-neutral-500 mb-3">
            <span>By Admin</span>
            <span className="mx-2">•</span>
            <span>{new Date(article.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <button 
                className={`text-neutral-500 hover:text-primary transition ${bookmarked ? 'text-primary' : ''}`} 
                title={bookmarked ? "Remove bookmark" : "Bookmark this article"}
                onClick={handleBookmarkToggle}
                disabled={!user}
              >
                {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
              <button 
                className="text-neutral-500 hover:text-primary transition" 
                title="Share this article"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share size={18} />
              </button>
            </div>
            <Link href={`/article/${article.id}`} className="text-primary text-sm font-semibold hover:underline">
              Read More
            </Link>
          </div>
        </div>
      </article>
      
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        article={article}
      />
    </>
  );
};

export default ArticleCard;
