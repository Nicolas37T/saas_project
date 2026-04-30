"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-white border-b sticky top-0 z-50 dark:bg-slate-950 dark:border-slate-800">
      <Link href="/" className="flex items-center justify-center gap-2">
        <Image src="/logo.png" alt="TRZ Corp. Dental" width={150} height={40} className="h-8 w-auto object-contain" />
      </Link>

      {/* Desktop Navigation */}
      <nav className="ml-auto hidden md:flex gap-4 sm:gap-6 items-center">
        <Link href="/#features" className="text-sm font-medium hover:underline underline-offset-4">
          Características
        </Link>
        <Link href="/#pricing" className="text-sm font-medium hover:underline underline-offset-4">
          Precios
        </Link>
        <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
          Iniciar sesión
        </Link>
        <ThemeToggle />
      </nav>

      {/* Mobile Navigation Toggle */}
      <div className="ml-auto flex items-center gap-4 md:hidden">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={toggleMobileMenu} aria-label="Toggle Menu">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white dark:bg-slate-950 border-b dark:border-slate-800 shadow-lg p-4 flex flex-col gap-4 md:hidden">
          <Link 
            href="/#features" 
            className="text-sm font-medium p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Características
          </Link>
          <Link 
            href="/#pricing" 
            className="text-sm font-medium p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Precios
          </Link>
          <Link 
            href="/login" 
            className="text-sm font-medium p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Iniciar sesión
          </Link>
        </div>
      )}
    </header>
  );
}
