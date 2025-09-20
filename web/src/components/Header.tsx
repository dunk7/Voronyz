"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { usePathname } from "next/navigation";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [hide, setHide] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartCountLoaded, setCartCountLoaded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Load cart count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      const cartData = localStorage.getItem("cart");
      if (cartData) {
        try {
          const cart = JSON.parse(cartData);
          const count = cart.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 0), 0);
          setCartCount(count);
        } catch (error) {
          console.error("Failed to parse cart data:", error);
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
      setCartCountLoaded(true);
    };

    updateCartCount();
    // Listen for storage changes
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);
  const pathname = usePathname();

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

  // Track viewport size to avoid rendering desktop-only auth buttons on mobile during SSR/hydration
  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)'); // md breakpoint
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      // Support both initial set (MediaQueryList) and change events
      // @ts-expect-error - handle both types
      setIsDesktop((e.matches !== undefined ? e.matches : e.currentTarget?.matches) ?? mediaQuery.matches);
    };
    // Initial
    setIsDesktop(mediaQuery.matches);
    // Subscribe
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange as (ev: MediaQueryListEvent) => void);
    } else {
      // @ts-expect-error - Safari
      mediaQuery.addListener(handleChange);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange as (ev: MediaQueryListEvent) => void);
      } else {
        // @ts-expect-error - Safari
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Allow body scroll even when mobile menu is open (no scroll lock)
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);
  return (
    <>
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
                href="/files"
                className={`relative uppercase tracking-[0.24em] text-[12px] sm:text-[13px] rounded-full px-5 py-2.5 ring-1 ring-transparent transition hover:ring-white/15 hover:text-white hover:bg-white/[.06] ${pathname === "/files" ? "text-white" : "text-white/70"}`}
              >
                <span>Files</span>
                <span className={`pointer-events-none absolute left-5 right-5 -bottom-[2px] h-[2px] rounded-full bg-white/70 transition-opacity ${pathname === "/files" ? "opacity-100" : "opacity-0"}`} aria-hidden />
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
            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative max-w-xl ml-2"
              role="search"
            >
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/60" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search"
                className="w-full rounded-full bg-white/[.06] ring-1 ring-white/10 focus:ring-2 focus:ring-white/25 focus:bg-white/[.12] pl-10 pr-5 py-2.5 text-sm text-white placeholder:text-white/50 transition"
                aria-label="Search"
              />
            </form>
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
            {isDesktop && (
              user ? (
                <Button
                  onClick={() => {
                    // Mock sign out - just show demo user is signed out
                    setUser(null);
                  }}
                  variant="secondary"
                  size="md"
                  className="ring-white/20 text-white hover:bg-white/10"
                  aria-label="Sign out"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 19.25c1.8-2.5 4.2-3.75 7-3.75s5.2 1.25 7 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </Button>
              ) : (
                <Link href="/sign-in" aria-label="Sign in">
                  <Button variant="secondary" size="md" className="ring-white/20 text-white hover:bg-white/10" aria-label="Sign in">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M5 19.25c1.8-2.5 4.2-3.75 7-3.75s5.2 1.25 7 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </Button>
                </Link>
              )
            )}
            <button
              className="md:hidden rounded-full p-3 ring-1 ring-white/15 text-white hover:bg-white/10 hover:ring-white/25 transition-all duration-200 group active:scale-95"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center gap-1">
                {/* Hamburger lines */}
                <span
                  className={`block h-0.5 w-5 bg-current transform transition-all duration-300 ease-in-out ${
                    open ? 'rotate-45 translate-y-1.5' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-current transform transition-all duration-300 ease-in-out ${
                    open ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-current transform transition-all duration-300 ease-in-out ${
                    open ? '-rotate-45 -translate-y-1.5' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ease-in-out ${
          open ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setOpen(false)}
        />

        {/* Menu Content */}
        <div className={`absolute top-20 left-0 right-0 transform transition-transform duration-100 ease-out ${
          open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <div className="bg-neutral-900/70 border-b border-white/30">
            <div className="container py-8">
            <nav className="grid gap-2">
              <Link
                href="/products"
                className="py-4 px-4 rounded-lg uppercase tracking-[0.22em] text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 text-lg font-medium"
                onClick={() => setOpen(false)}
              >
                All Footwear
              </Link>
              <Link
                href="/files"
                className="py-4 px-4 rounded-lg uppercase tracking-[0.22em] text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 text-lg font-medium"
                onClick={() => setOpen(false)}
              >
                Files
              </Link>
              <Link
                href="/about"
                className="py-4 px-4 rounded-lg uppercase tracking-[0.22em] text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 text-lg font-medium"
                onClick={() => setOpen(false)}
              >
                About
              </Link>
              <Link
                href="/cart"
                className="py-4 px-4 rounded-lg uppercase tracking-[0.22em] text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 text-lg font-medium flex items-center gap-3"
                onClick={() => setOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M3 3h2l.4 2M7 13h9l3-8H6.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="19" r="1.5" fill="currentColor"/>
                  <circle cx="17" cy="19" r="1.5" fill="currentColor"/>
                </svg>
                <span>Cart {cartCountLoaded ? `(${cartCount})` : ""}</span>
              </Link>
            </nav>

            <div className="border-t border-white/10 mt-6 pt-6">
              {user ? (
                <button
                  onClick={() => {
                    setUser(null);
                    setOpen(false);
                  }}
                  className="py-4 px-4 rounded-lg uppercase tracking-[0.22em] text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 text-lg font-medium flex items-center gap-3 w-full text-left"
                  aria-label="Sign out"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 19.25c1.8-2.5 4.2-3.75 7-3.75s5.2 1.25 7 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false);
                    window.location.href = '/sign-in';
                  }}
                  className="py-4 px-4 rounded-lg uppercase tracking-[0.22em] text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 text-lg font-medium flex items-center gap-3 w-full text-left"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 19.25c1.8-2.5 4.2-3.75 7-3.75s5.2 1.25 7 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}


