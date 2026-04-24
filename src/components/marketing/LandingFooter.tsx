import { Link } from "react-router-dom";
import logo from "@/assets/business-desk-pro-logo.png";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <img src={logo} alt="Business Desk Pro" className="h-7 w-auto" />
          <span className="text-sm">Business Desk Pro</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
          <Link to="/auth" className="hover:text-white">Sign in</Link>
        </nav>

        <div className="text-xs text-white/40">
          © {new Date().getFullYear()} Business Desk Pro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
