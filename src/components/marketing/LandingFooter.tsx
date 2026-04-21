import { Link } from "react-router-dom";
import { PiggyBank } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-700">
            <PiggyBank className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="text-sm">FinTrack Pro</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
          <Link to="/auth" className="hover:text-white">Sign in</Link>
        </nav>

        <div className="text-xs text-white/40">
          © {new Date().getFullYear()} FinTrack Pro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
