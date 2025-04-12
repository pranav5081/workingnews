import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ARTICLE_CATEGORIES } from "@shared/schema";

const ArticleCategories = () => {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const currentCategory = params.get("category") || "All";
  
  const handleCategoryChange = (category: string) => {
    if (category === "All") {
      setLocation("/");
    } else {
      setLocation(`/?category=${category}`);
    }
  };
  
  return (
    <div className="mb-6 border-b border-neutral-200">
      <div className="flex overflow-x-auto">
        {ARTICLE_CATEGORIES.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 font-semibold ${
              currentCategory === category
                ? "text-primary border-b-2 border-primary"
                : "text-neutral-600 hover:text-primary"
            }`}
            onClick={() => handleCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArticleCategories;
