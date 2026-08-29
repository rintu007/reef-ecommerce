import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, DollarSign, Package, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { LISTING_TYPE_ICONS } from "@/lib/categories";

export default function ListingsTab({ userEmail }) {
  const queryClient = useQueryClient();
  const [deleteListingId, setDeleteListingId] = useState(null);
  const [quantityEdit, setQuantityEdit] = useState({});

  const { data: myListings = [] } = useQuery({
    queryKey: ["my-listings", userEmail],
    queryFn: () => base44.entities.Listing.filter({ seller_email: userEmail }, "-created_date", 100),
    enabled: !!userEmail,
  });

  const deleteMutation = useMutation({
    mutationFn: (listingId) => base44.functions.invoke("deleteListing", { listingId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      toast.success("Listing deleted");
      setDeleteListingId(null);
    },
    onError: () => toast.error("Failed to delete listing"),
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ listingId, quantity }) =>
      base44.asServiceRole.entities.Listing.update(listingId, { quantity: parseInt(quantity) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      toast.success("Quantity updated");
      setQuantityEdit({});
    },
    onError: () => toast.error("Failed to update quantity"),
  });

  const activeListings = myListings.filter((l) => l.status === "active");
  const soldListings = myListings.filter((l) => l.status === "sold");

  const ListingRow = ({ listing }) => (
    <div key={listing.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{listing.title}</h3>
          <div className="flex gap-1 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">
              {LISTING_TYPE_ICONS[listing.listing_type]} {listing.category}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {listing.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "{listing.title}" from the marketplace.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteMutation.mutate(listing.id)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Price</span>
          <p className="font-semibold flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> {listing.price}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Quantity</span>
          <div className="flex gap-1 mt-0.5">
            {quantityEdit[listing.id] !== undefined ? (
              <>
                <Input
                  type="number"
                  min="0"
                  value={quantityEdit[listing.id]}
                  onChange={(e) => setQuantityEdit({ ...quantityEdit, [listing.id]: e.target.value })}
                  className="h-6 text-xs w-12 px-1"
                />
                <Button
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => updateQuantityMutation.mutate({ listingId: listing.id, quantity: quantityEdit[listing.id] })}
                  disabled={updateQuantityMutation.isPending}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <span className="font-semibold">{listing.quantity || 1}</span>
                <button
                  onClick={() => setQuantityEdit({ ...quantityEdit, [listing.id]: listing.quantity || 1 })}
                  className="text-primary hover:underline text-[10px]"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Created</span>
          <p className="font-semibold">
            {new Date(listing.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );

  if (myListings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">You haven't listed anything yet</p>
        <Link to="/sell">
          <Button className="mt-3 rounded-xl">Create Listing</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
        <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
        <span>To edit listings, go to your <Link to="/seller-dashboard" className="text-primary font-medium hover:underline">Seller Dashboard</Link>.</span>
      </div>
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="active">Active ({activeListings.length})</TabsTrigger>
          <TabsTrigger value="sold">Sold ({soldListings.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-2 mt-4">
          {activeListings.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No active listings</p>
          ) : (
            activeListings.map((listing) => <ListingRow key={listing.id} listing={listing} />)
          )}
        </TabsContent>
        <TabsContent value="sold" className="space-y-2 mt-4">
          {soldListings.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No sold listings</p>
          ) : (
            soldListings.map((listing) => <ListingRow key={listing.id} listing={listing} />)
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}