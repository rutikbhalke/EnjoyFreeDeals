import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import SEO from "@/components/SEO";

const NotFound = () => {
  return (
    <MainLayout>
      <SEO title="Page Not Found" noIndex />
      <div className="flex flex-1 flex-col items-center justify-center py-24 px-4 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-6">
          <Search className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-display text-5xl font-bold mb-3">404</h1>
        <p className="text-lg text-muted-foreground mb-2">Page not found</p>
        <p className="text-sm text-muted-foreground mb-8 max-w-md">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/deals">Browse Deals</Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
