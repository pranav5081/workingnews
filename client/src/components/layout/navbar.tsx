import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X, Newspaper, ChevronDown, BookmarkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ARTICLE_CATEGORIES } from "@shared/schema";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Newspaper className="text-primary mr-2 h-6 w-6" />
            <span className="text-2xl font-serif font-bold text-primary">NewsHub</span>
          </Link>
          
          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex space-x-6">
            <Link 
              href="/" 
              className={`${location === "/" ? "text-primary font-semibold" : "text-neutral-700"} hover:text-primary transition`}
            >
              Home
            </Link>
            
            {user && ARTICLE_CATEGORIES.filter(cat => cat !== "All").slice(0, 4).map((category) => (
              <Link 
                key={category}
                href={`/?category=${category}`} 
                className="text-neutral-700 hover:text-primary transition"
              >
                {category}
              </Link>
            ))}
          </div>
          
          {/* Auth/User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Guest View */}
            {!user && (
              <div className="flex space-x-2">
                <Link href="/auth">
                  <Button variant="outline">Log In</Button>
                </Link>
                <Link href="/auth">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
            
            {/* Authenticated User View */}
            {user && (
              <div className="flex items-center space-x-3">
                <Link href="/bookmarks" className="text-neutral-700 hover:text-primary" title="Bookmarks">
                  <BookmarkIcon size={18} />
                </Link>
                <div className="relative" ref={dropdownRef}>
                  <button 
                    className="flex items-center space-x-1" 
                    onClick={toggleDropdown}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                      {user.firstName?.[0] || user.username[0]}
                    </div>
                    <span className="text-sm font-medium">{user.firstName || user.username}</span>
                    <ChevronDown className="text-neutral-500 h-4 w-4" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-10">
                      <Link 
                        href="/bookmarks" 
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        My Bookmarks
                      </Link>
                      {user.isAdmin && (
                        <Link 
                          href="/admin" 
                          className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button 
                        onClick={() => {
                          handleLogout();
                          setDropdownOpen(false);
                        }} 
                        className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-neutral-700 focus:outline-none" 
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 space-y-3 border-t border-neutral-200">
            <Link 
              href="/" 
              className="block text-neutral-700 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            
            {ARTICLE_CATEGORIES.filter(cat => cat !== "All").slice(0, 5).map((category) => (
              <Link 
                key={category}
                href={`/?category=${category}`} 
                className="block text-neutral-700 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {category}
              </Link>
            ))}
            
            {/* Mobile Auth Buttons */}
            {!user && (
              <div className="pt-3 border-t border-neutral-200 flex flex-col space-y-2">
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Log In</Button>
                </Link>
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
            
            {/* Mobile User Nav */}
            {user && (
              <div className="pt-3 border-t border-neutral-200 space-y-2">
                <Link 
                  href="/bookmarks" 
                  className="block text-neutral-700 hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Bookmarks
                </Link>
                {user.isAdmin && (
                  <Link 
                    href="/admin" 
                    className="block text-neutral-700 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }} 
                  className="block text-neutral-700 hover:text-primary"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
