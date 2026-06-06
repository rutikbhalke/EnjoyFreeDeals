import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import { toast } from "@/hooks/use-toast";

interface Props {
  dealId: string;
  currentPrice: number | null;
}

export default function WatchDealButton({ dealId, currentPrice }: Props) {
  const { user } = useAuth();
  const { isWatching, addToWatchlist, removeFromWatchlist } = useWatchlist(dealId);
  const [targetPrice, setTargetPrice] = useState("");
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const handleWatch = () => {
    const price = targetPrice ? parseFloat(targetPrice) : undefined;
    addToWatchlist.mutate(price, {
      onSuccess: () => {
        toast({ title: "Watching!", description: price ? `We'll notify you when it drops below ₹${price}` : "We'll notify you on any price drop." });
        setOpen(false);
        setTargetPrice("");
      },
      onError: () => toast({ title: "Error", description: "Could not add to watchlist.", variant: "destructive" }),
    });
  };

  const handleUnwatch = () => {
    removeFromWatchlist.mutate(undefined, {
      onSuccess: () => toast({ title: "Removed", description: "Deal removed from your watchlist." }),
    });
  };

  if (isWatching) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleUnwatch}>
        <EyeOff className="h-4 w-4" />
        Watching
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Eye className="h-4 w-4" />
          Watch Price
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="end">
        <p className="text-sm font-medium">Set a target price (optional)</p>
        <Input
          type="number"
          placeholder={currentPrice ? `Current: ₹${currentPrice}` : "Target price"}
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
        />
        <Button size="sm" className="w-full" onClick={handleWatch} disabled={addToWatchlist.isPending}>
          {addToWatchlist.isPending ? "Adding..." : "Watch This Deal"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
