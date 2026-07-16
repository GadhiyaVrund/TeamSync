import { Link } from "wouter";
import { CheckSquare } from "lucide-react";

export function Navbar({ onLoginClick, onGetStartedClick, isAuthOpen }) {
  return (
    <nav className={`sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm transition-all duration-200 ${isAuthOpen ? "blur-sm pointer-events-none select-none" : ""}`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-8">
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <CheckSquare className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">TeamSync</span>
        </Link>
        <div className="hidden md:flex gap-8 text-sm font-medium">
          <a href="#features" className="text-foreground/70 hover:text-foreground transition-colors">Features</a>
          <a href="#benefits" className="text-foreground/70 hover:text-foreground transition-colors">Benefits</a>
          <a href="#how-it-works" className="text-foreground/70 hover:text-foreground transition-colors">How it Works</a>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onLoginClick}
            className="text-sm font-medium hover:text-primary transition-colors px-4 py-2 cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={onGetStartedClick}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
