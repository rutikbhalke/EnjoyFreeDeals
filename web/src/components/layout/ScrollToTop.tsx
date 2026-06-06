import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                key="scroll-top"
                initial={{ opacity: 0, y: 16, scale: 1 }}
                animate={{ opacity: 1, y: 0, scale: [1, 1.15, 1] }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.4, scale: { duration: 0.6, ease: "easeInOut" } }}
                aria-label="Back to top"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="fixed bottom-20 right-6 md:bottom-6 z-50 h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_16px_hsl(142_63%_27%/0.3)] flex items-center justify-center cursor-pointer"
              >
                <ArrowUp className="h-4 w-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="left" className="hidden md:block">
              Back to top
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </AnimatePresence>
  );
}
