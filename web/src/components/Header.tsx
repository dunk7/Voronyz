"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatCentsAsCurrency } from "@/lib/money";
import { getProductThumbnail } from "@/lib/productImages";

type SearchProductResult = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  images?: unknown;
  thumbnail?: string;
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const [hide, setHide] = useState(false);
  // const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null); // Removed user state
  const [cartCount, setCartCount] = useState(0);
  const [cartCountLoaded, setCartCountLoaded] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProductResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const [routeLoading, setRouteLoading] = useState(false);
  const routeKeyRef = useRef<string | null>(null);

  // Load cart count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cartDataStr = localStorage.getItem("cart");
        if (cartDataStr) {
          const parsed = JSON.parse(cartDataStr);
          let items: Array<{quantity: number}> = [];
          if (Array.isArray(parsed)) {
            // Legacy array format
            items = parsed;
          } else {
            // New object format
            items = parsed.items || [];
          }
          const count = items.reduce((sum, item) => sum + (item?.quantity || 0), 0);
          setCartCount(count);
        } else {
          setCartCount(0);
        }
      } catch (error) {
        console.error("Failed to parse cart data:", error);
        setCartCount(0);
      }
    };

    updateCartCount();
    setCartCountLoaded(true);

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cart") {
        updateCartCount();
        setCartCountLoaded(true);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Listen for custom cart updates in same tab
    const handleCartUpdated = () => {
      updateCartCount();
      setCartCountLoaded(true);
    };
    window.addEventListener("cartUpdated", handleCartUpdated);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, []);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams?.toString() ?? "";
  const currentRouteKey = `${pathname}${searchString ? `?${searchString}` : ""}`;

  useEffect(() => {
    // Clear any route-loading overlay once navigation completes.
    if (routeKeyRef.current !== null && routeKeyRef.current !== currentRouteKey) {
      setRouteLoading(false);
    }
    routeKeyRef.current = currentRouteKey;
  }, [currentRouteKey]);

  const navigateWithLoading = (href: string) => {
    // If we're already at the destination (including query params), Next won't navigate,
    // so don't show an indefinite loading overlay.
    if (href === currentRouteKey) {
      setRouteLoading(false);
      return;
    }
    setRouteLoading(true);
    router.push(href);
  };

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHide(y > lastY && y > 24);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Allow body scroll even when mobile menu is open (no scroll lock)
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.products || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const debouncedSearch = (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => performSearch(query), 300);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedResultIndex(-1);
    debouncedSearch(query);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0 && selectedResultIndex >= 0) {
      const selectedProduct = searchResults[selectedResultIndex];
      navigateWithLoading(`/products/${selectedProduct.slug}`);
      setSearchQuery("");
      setSearchResults([]);
      setSearchFocused(false);
      searchInputRef.current?.blur();
    } else if (searchQuery.trim()) {
      navigateWithLoading(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchResults([]);
      setSearchFocused(false);
      searchInputRef.current?.blur();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!searchResults.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedResultIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedResultIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedResultIndex >= 0) {
          const selectedProduct = searchResults[selectedResultIndex];
          navigateWithLoading(`/products/${selectedProduct.slug}`);
          setSearchQuery("");
          setSearchResults([]);
          setSearchFocused(false);
          searchInputRef.current?.blur();
        }
        break;
      case "Escape":
        setSearchResults([]);
        setSearchFocused(false);
        searchInputRef.current?.blur();
        break;
    }
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
  };

  const handleSearchBlur = () => {
    // Delay hiding to allow clicks on results
    setTimeout(() => {
      setSearchFocused(false);
      setSelectedResultIndex(-1);
    }, 150);
  };

  const handleResultClick = (productSlug: string) => {
    navigateWithLoading(`/products/${productSlug}`);
    setSearchQuery("");
    setSearchResults([]);
    setSearchFocused(false);
    searchInputRef.current?.blur();
  };
  return (
    <>
      {routeLoading && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-neutral-900/90 border border-white/15 rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-3 text-white">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25"/>
              <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span className="text-sm">Loading…</span>
          </div>
        </div>
      )}
      <header className={`sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/70 bg-neutral-950/80 border-b border-white/10 transition-transform duration-300 ${hide ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="container flex h-20 items-center gap-4">
          {/* Left cluster: brand + nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Voronyz" width={40} height={40} />
              <span className="text-lg sm:text-xl font-semibold tracking-[0.2em] text-white">VORONYZ</span>
            </Link>
            <nav className="hidden md:flex items-center gap-2 ml-2">
              <Link
                href="/products"
                className={`relative uppercase tracking-[0.24em] text-[12px] sm:text-[13px] rounded-full px-5 py-2.5 ring-1 ring-transparent transition hover:ring-white/15 hover:text-white hover:bg-white/[.06] ${pathname?.startsWith("/products") ? "text-white" : "text-white/70"}`}
              >
                <span>All Footwear</span>
                <span className={`pointer-events-none absolute left-5 right-5 -bottom-[2px] h-[2px] rounded-full bg-white/70 transition-opacity ${pathname?.startsWith("/products") ? "opacity-100" : "opacity-0"}`} aria-hidden />
              </Link>
              <Link
                href="/about"
                className={`relative uppercase tracking-[0.24em] text-[12px] sm:text-[13px] rounded-full px-5 py-2.5 ring-1 ring-transparent transition hover:ring-white/15 hover:text-white hover:bg-white/[.06] ${pathname === "/about" ? "text-white" : "text-white/70"}`}
              >
                <span>About</span>
                <span className={`pointer-events-none absolute left-5 right-5 -bottom-[2px] h-[2px] rounded-full bg-white/70 transition-opacity ${pathname === "/about" ? "opacity-100" : "opacity-0"}`} aria-hidden />
              </Link>
            </nav>
          </div>

          {/* Middle: search */}
          <div className="hidden md:block flex-1">
            <div className="relative max-w-xl ml-2">
              <form
                onSubmit={handleSearchSubmit}
                className="relative"
                role="search"
              >
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/60" aria-hidden>
                  {searchLoading ? (
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25"/>
                      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </span>
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="w-full rounded-full bg-white/[.06] ring-1 ring-white/10 focus:ring-2 focus:ring-white/25 focus:bg-white/[.12] pl-10 pr-5 py-2.5 text-sm text-white placeholder:text-white/50 transition-all duration-200 hover:bg-white/[.08] hover:ring-white/15"
                  aria-label="Search products"
                  autoComplete="off"
                />
              </form>

              {/* Search Results Dropdown */}
              {searchFocused && (searchQuery.trim() || searchResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl z-50 max-h-96 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((product, index) => {
                        const cover = getProductThumbnail({ slug: product.slug, images: product.images });
                        return (
                          <button
                            key={product.id}
                            onClick={() => handleResultClick(product.slug)}
                            className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-all duration-150 flex items-center gap-3 group ${
                              index === selectedResultIndex ? "bg-white/10" : ""
                            }`}
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/10 group-hover:ring-white/20 transition-colors bg-neutral-700">
                              <Image
                                src={cover}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                priority={index < 3}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate group-hover:text-white/95">{product.name}</div>
                              <div className="text-xs text-white/70 truncate group-hover:text-white/80">{product.description}</div>
                            </div>
                            <div className="text-sm font-semibold text-white group-hover:text-white/95 transition-colors">
                              {formatCentsAsCurrency(product.priceCents, product.currency)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : searchQuery.trim() && !searchLoading ? (
                    <div className="px-4 py-8 text-center text-white/60">
                      <div className="text-sm mb-2">No products found for &quot;{searchQuery}&quot;</div>
                      <button
                        onClick={() => {
                          router.push(`/products?q=${encodeURIComponent(searchQuery)}`);
                          setSearchQuery("");
                          setSearchResults([]);
                          setSearchFocused(false);
                          searchInputRef.current?.blur();
                        }}
                        className="text-xs text-white/80 hover:text-white underline transition-colors"
                      >
                        View all products →
                      </button>
                    </div>
                  ) : searchLoading ? (
                    <div className="px-4 py-8 text-center text-white/60">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25"/>
                          <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span className="text-sm">Searching...</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="ml-auto flex items-center gap-3">
            <Link href="/cart" className="relative">
              <Button variant="secondary" size="md" className="ring-white/20 text-white hover:bg-white/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M3 3h2l.4 2M7 13h9l3-8H6.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="19" r="1.5" fill="currentColor"/>
                  <circle cx="17" cy="19" r="1.5" fill="currentColor"/>
                </svg>
              </Button>
              {cartCountLoaded && cartCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white text-black px-1 text-xs font-medium">{cartCount}</span>
              )}
            </Link>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden relative w-10 h-10 rounded-full ring-1 ring-white/15 text-white hover:bg-white/10 hover:ring-white/25 active:scale-95 transition-all duration-200 flex items-center justify-center"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <div className="w-[18px] h-[14px] relative flex flex-col justify-between">
                <span
                  className={`absolute top-0 left-0 right-0 h-[2px] rounded-full bg-white origin-center transition-all duration-300 ease-[cubic-bezier(0.77,0,0.18,1)] ${
                    open ? 'top-1/2 -translate-y-1/2 rotate-45' : ''
                  }`}
                />
                <span
                  className={`absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.77,0,0.18,1)] ${
                    open ? 'opacity-0 scale-x-0' : ''
                  }`}
                />
                <span
                  className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-white origin-center transition-all duration-300 ease-[cubic-bezier(0.77,0,0.18,1)] ${
                    open ? 'bottom-1/2 translate-y-1/2 -rotate-45' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        {/* Menu Content */}
        <div className={`absolute top-20 left-0 right-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
        }`}>
          <div className="bg-neutral-950/90 backdrop-blur-xl border-b border-white/10 shadow-2xl text-white">
            <div className="container py-6">
              <nav className="flex flex-col gap-1">
                <Link
                  href="/products"
                  className={`flex items-center gap-3 py-3.5 px-4 rounded-xl uppercase tracking-[0.2em] text-[15px] font-medium transition-all duration-200 ${
                    pathname?.startsWith("/products")
                      ? "text-white bg-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/[.06]"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {pathname?.startsWith("/products") && (
                    <span className="w-1 h-5 rounded-full bg-white/80 flex-shrink-0" />
                  )}
                  All Footwear
                </Link>
                <Link
                  href="/about"
                  className={`flex items-center gap-3 py-3.5 px-4 rounded-xl uppercase tracking-[0.2em] text-[15px] font-medium transition-all duration-200 ${
                    pathname === "/about"
                      ? "text-white bg-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/[.06]"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {pathname === "/about" && (
                    <span className="w-1 h-5 rounded-full bg-white/80 flex-shrink-0" />
                  )}
                  About
                </Link>
                <div className="my-2 h-px bg-white/10" />
                <Link
                  href="/cart"
                  className={`flex items-center gap-3 py-3.5 px-4 rounded-xl uppercase tracking-[0.2em] text-[15px] font-medium transition-all duration-200 ${
                    pathname === "/cart"
                      ? "text-white bg-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/[.06]"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M3 3h2l.4 2M7 13h9l3-8H6.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="19" r="1.5" fill="currentColor"/>
                    <circle cx="17" cy="19" r="1.5" fill="currentColor"/>
                  </svg>
                  <span>Cart</span>
                  {cartCountLoaded && cartCount > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white text-black px-1.5 text-xs font-semibold">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



