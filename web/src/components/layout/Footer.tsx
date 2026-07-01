import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";

export default function Footer() {
  const { isAdmin } = useAuth();

  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="container py-12 px-5">
        <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
          <div>
            <Link to="/" className="mb-3 inline-block">
              <img src={logo} alt="EnjoyFreeDeals" className="h-8" />
            </Link>
            <p className="text-sm text-muted-foreground">
              India's smartest free deals & cashback platform. Save more on every purchase.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/deals" className="hover:text-foreground transition-colors">All Deals</Link></li>
              <li><Link to="/stores" className="hover:text-foreground transition-colors">Stores</Link></li>
              <li><Link to="/categories" className="hover:text-foreground transition-colors">Categories</Link></li>
              <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link to="/submit-deal" className="hover:text-foreground transition-colors">Submit a Deal</Link></li>
              <li><Link to="/savings" className="hover:text-foreground transition-colors">Savings Dashboard</Link></li>
              {isAdmin && (
                <li><Link to="/admin" className="hover:text-foreground transition-colors flex items-center gap-1"><Shield className="h-3 w-3" />Admin Panel</Link></li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3">About</h4>
            <p className="text-sm text-muted-foreground">
              EnjoyFreeDeals helps you discover the best deals, coupons, and cashback offers from top Indian stores.
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} EnjoyFreeDeals. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
