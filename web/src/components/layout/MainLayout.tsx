import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import MobileBottomNav from "./MobileBottomNav";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 animate-fade-in pb-16 md:pb-0">{children}</main>
      <Footer />
      <ScrollToTop />
      <MobileBottomNav />
    </div>
  );
}
