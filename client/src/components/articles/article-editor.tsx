import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Article, insertArticleSchema, ARTICLE_CATEGORIES, ARTICLE_STATUSES } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";

interface ArticleEditorProps {
  article?: Article;
  onClose: () => void;
}

// Extend the schema with client-side validation
const articleFormSchema = insertArticleSchema.extend({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }),
  category: z.string().refine(val => ARTICLE_CATEGORIES.includes(val), { 
    message: "Please select a valid category" 
  }),
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;

const ArticleEditor = ({ article, onClose }: ArticleEditorProps) => {
  const { toast } = useToast();
  const [contentPreview, setContentPreview] = useState("");
  const isEditing = !!article;
  
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: article || {
      title: "",
      content: "",
      summary: "",
      authorId: 0, // Will be set by the server
      category: "",
      featuredImageUrl: "",
      status: "draft",
    },
  });
  
  useEffect(() => {
    // Update the preview whenever content changes
    const content = form.watch("content");
    setContentPreview(content);
  }, [form.watch("content")]);
  
  const createArticleMutation = useMutation({
    mutationFn: async (values: ArticleFormValues) => {
      const res = await apiRequest("POST", "/api/admin/articles", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Article created",
        description: "Your article has been created successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateArticleMutation = useMutation({
    mutationFn: async (values: ArticleFormValues) => {
      const res = await apiRequest("PUT", `/api/admin/articles/${article?.id}`, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Article updated",
        description: "Your article has been updated successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: ArticleFormValues) => {
    if (isEditing) {
      updateArticleMutation.mutate(values);
    } else {
      createArticleMutation.mutate(values);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold">
          {isEditing ? "Edit Article" : "Create New Article"}
        </h2>
        <Button variant="outline" size="sm" onClick={onClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Article Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter article title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    >
                      <option value="">Select a category</option>
                      {ARTICLE_CATEGORIES.filter(cat => cat !== "All").map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    >
                      {ARTICLE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Summary</FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Brief summary of the article"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <div className="border border-input rounded-md">
                  <div className="bg-muted/50 border-b border-input p-2 flex space-x-1">
                    <button
                      type="button"
                      className="p-1 hover:bg-muted rounded"
                      onClick={() => {
                        const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = textarea.value;
                        const before = text.substring(0, start);
                        const selection = text.substring(start, end);
                        const after = text.substring(end);
                        
                        const newText = before + '<strong>' + selection + '</strong>' + after;
                        field.onChange(newText);
                        
                        // Set cursor position after insertion
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(start + 8, start + 8 + selection.length);
                        }, 0);
                      }}
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      type="button"
                      className="p-1 hover:bg-muted rounded"
                      onClick={() => {
                        const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = textarea.value;
                        const before = text.substring(0, start);
                        const selection = text.substring(start, end);
                        const after = text.substring(end);
                        
                        const newText = before + '<em>' + selection + '</em>' + after;
                        field.onChange(newText);
                        
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(start + 4, start + 4 + selection.length);
                        }, 0);
                      }}
                    >
                      <em>I</em>
                    </button>
                    <button
                      type="button"
                      className="p-1 hover:bg-muted rounded"
                      onClick={() => {
                        const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
                        const start = textarea.selectionStart;
                        const text = textarea.value;
                        const before = text.substring(0, start);
                        const after = text.substring(start);
                        
                        const newText = before + '<p></p>' + after;
                        field.onChange(newText);
                        
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(start + 3, start + 3);
                        }, 0);
                      }}
                    >
                      P
                    </button>
                  </div>
                  <FormControl>
                    <textarea
                      id="content-editor"
                      className="flex min-h-[300px] w-full rounded-md border-0 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-0"
                      placeholder="Write your article content here..."
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="featuredImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Featured Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="Enter image URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => {
                const values = form.getValues();
                values.status = "draft";
                if (isEditing) {
                  updateArticleMutation.mutate(values);
                } else {
                  createArticleMutation.mutate(values);
                }
              }}
            >
              Save Draft
            </Button>
            <Button 
              type="submit"
              disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
            >
              {isEditing ? "Update" : "Publish"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ArticleEditor;
