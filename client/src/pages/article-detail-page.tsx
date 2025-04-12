import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Article } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Bookmark, BookmarkCheck, Share, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ShareModal from "@/components/modals/share-modal";

const ArticleDetailPage = () => {
  const { id } = useParams();
  const articleId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Fetch article details
  const { data: article, isLoading } = useQuery<Article>({
    queryKey: ["/api/articles", articleId],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${articleId}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Article not found");
        }
        throw new Error("Failed to fetch article");
      }
      return res.json();
    },
  });
  
  // Check if article is bookmarked
  const { data: bookmarkStatus, isLoading: checkingBookmark } = useQuery<{bookmarked: boolean}>({
    queryKey: ["/api/bookmarks", articleId],
    queryFn: async () => {
      const res = await fetch(`/api/bookmarks/${articleId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check bookmark status");
      return res.json();
    },
    enabled: !!user,
  });
  
  // Bookmark mutations
  const createBookmarkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bookmarks", { articleId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", articleId] });
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
      await apiRequest("DELETE", `/api/bookmarks/${articleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", articleId] });
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
    if (bookmarkStatus?.bookmarked) {
      deleteBookmarkMutation.mutate();
    } else {
      createBookmarkMutation.mutate();
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-6 w-24 mb-4" />
          </div>
          <Skeleton className="h-10 w-4/5 mb-6" />
          <div className="flex items-center space-x-4 mb-6">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="w-full h-96 rounded-lg mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!article) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
          <p className="text-neutral-600 mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Articles
            </Button>
          </Link>
        </div>
        
        {/* Article Header */}
        <div className="mb-8">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full">
              {article.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center text-sm text-neutral-500 mb-4 gap-y-2">
            <div className="flex items-center mr-4">
              <User className="h-4 w-4 mr-1" />
              <span>By Admin</span>
            </div>
            <div className="flex items-center mr-4">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{new Date(article.createdAt).toLocaleDateString()}</span>
            </div>
            
            <div className="flex ml-auto space-x-3">
              <button 
                className={`flex items-center space-x-1 text-neutral-600 hover:text-primary transition ${
                  bookmarkStatus?.bookmarked ? 'text-primary' : ''
                }`} 
                title={bookmarkStatus?.bookmarked ? "Remove bookmark" : "Bookmark this article"}
                onClick={handleBookmarkToggle}
                disabled={!user || checkingBookmark}
              >
                {bookmarkStatus?.bookmarked ? 
                  <BookmarkCheck className="h-5 w-5" /> : 
                  <Bookmark className="h-5 w-5" />
                }
                <span>{bookmarkStatus?.bookmarked ? "Bookmarked" : "Bookmark"}</span>
              </button>
              
              <button 
                className="flex items-center space-x-1 text-neutral-600 hover:text-primary transition" 
                title="Share this article"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share className="h-5 w-5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Featured Image */}
        {article.featuredImageUrl && (
          <div className="mb-8">
            <img
              src={article.featuredImageUrl}
              alt={article.title}
              className="w-full h-auto rounded-lg object-cover"
            />
          </div>
        )}
        
        {/* Article Content */}
        <div className="prose prose-lg max-w-none mb-8">
          {article.summary && (
            <p className="text-xl text-neutral-600 font-medium mb-6">
              {article.summary}
            </p>
          )}
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
        
        {/* Article Footer */}
        <div className="border-t border-neutral-200 pt-6 mt-8">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <span className="text-sm text-neutral-500">
                Last updated: {new Date(article.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex space-x-3">
              <button 
                className={`text-neutral-600 hover:text-primary transition ${
                  bookmarkStatus?.bookmarked ? 'text-primary' : ''
                }`} 
                title={bookmarkStatus?.bookmarked ? "Remove bookmark" : "Bookmark this article"}
                onClick={handleBookmarkToggle}
                disabled={!user || checkingBookmark}
              >
                {bookmarkStatus?.bookmarked ? 
                  <BookmarkCheck className="h-5 w-5" /> : 
                  <Bookmark className="h-5 w-5" />
                }
              </button>
              <button 
                className="text-neutral-600 hover:text-primary transition" 
                title="Share this article"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        article={article}
      />
    </div>
  );
};

export default ArticleDetailPage;
