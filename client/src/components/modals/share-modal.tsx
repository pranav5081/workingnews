import { useState } from "react";
import { X, Facebook, Twitter, Linkedin, Mail, Copy, CheckCircle } from "lucide-react";
import { Article } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article;
}

const ShareModal = ({ isOpen, onClose, article }: ShareModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;
  
  const shareUrl = `${window.location.origin}/article/${article.id}`;
  
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(`Check out this article: ${shareUrl}`)}`
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        setCopied(true);
        toast({
          title: "Link copied",
          description: "Article link copied to clipboard!",
        });
        
        setTimeout(() => {
          setCopied(false);
        }, 3000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast({
          title: "Failed to copy",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-xl font-bold">Share Article</h3>
          <button 
            className="text-neutral-500 hover:text-neutral-700"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-neutral-600">{article.title}</p>
          
          <div className="flex justify-center space-x-4">
            <a 
              href={shareLinks.facebook} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex flex-col items-center"
              title="Share on Facebook"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white mb-1">
                <Facebook size={20} />
              </div>
              <span className="text-xs text-neutral-600">Facebook</span>
            </a>
            <a 
              href={shareLinks.twitter} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex flex-col items-center"
              title="Share on Twitter"
            >
              <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-white mb-1">
                <Twitter size={20} />
              </div>
              <span className="text-xs text-neutral-600">Twitter</span>
            </a>
            <a 
              href={shareLinks.linkedin} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex flex-col items-center"
              title="Share on LinkedIn"
            >
              <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center text-white mb-1">
                <Linkedin size={20} />
              </div>
              <span className="text-xs text-neutral-600">LinkedIn</span>
            </a>
            <a 
              href={shareLinks.email} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex flex-col items-center"
              title="Share via Email"
            >
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white mb-1">
                <Mail size={20} />
              </div>
              <span className="text-xs text-neutral-600">Email</span>
            </a>
          </div>
          
          <div>
            <label htmlFor="shareLink" className="block text-sm font-medium text-neutral-700 mb-1">
              Article Link
            </label>
            <div className="flex">
              <Input 
                id="shareLink" 
                value={shareUrl} 
                readOnly 
                className="flex-grow rounded-r-none"
              />
              <Button 
                onClick={copyToClipboard} 
                className="rounded-l-none"
                disabled={copied}
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
