import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import MobileSelect from "@/components/ui/MobileSelect";
import { toast } from "sonner";
import {
  Shield, ShieldOff, Tag, Search, User, ChevronDown, ChevronUp,
  Mail, Gift, Calendar, ListChecks, Ban, Trash2, ShieldCheck, Clock,
  ShoppingBag, TrendingUp, AlertCircle, MessageSquare, Send, Package, Eye
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

function UserStatsRow({ email, expanded }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-user-stats", email],
    queryFn: async () => {
      const res = await base44.functions.invoke("adminUserActions", { action: "get_stats", user_email: email });
      return res.data;
    },
    enabled: expanded,
    staleTime: 1000 * 60 * 2,
  });

  if (!expanded) return null;
  if (isLoading) return <p className="text-xs text-muted-foreground py-2">Loading stats...</p>;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-2 py-1">
      <div className="bg-background rounded-lg p-2.5 flex items-center gap-2">
        <ShoppingBag className="w-3.5 h-3.5 text-primary shrink-0" />
        <div>
          <p className="text-[10px] text-muted-foreground">Purchases</p>
          <p className="text-sm font-bold">{stats.totalPurchases}</p>
          <p className="text-[10px] text-muted-foreground">${stats.totalSpent?.toFixed(2)} spent</p>
        </div>
      </div>
      <div className="bg-background rounded-lg p-2.5 flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <div>
          <p className="text-[10px] text-muted-foreground">Sales</p>
          <p className="text-sm font-bold">{stats.totalSales}</p>
          <p className="text-[10px] text-muted-foreground">${stats.totalRevenue?.toFixed(2)} earned</p>
        </div>
      </div>
      <div className="bg-background rounded-lg p-2.5 flex items-center gap-2">
        <ListChecks className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <div>
          <p className="text-[10px] text-muted-foreground">Listings</p>
          <p className="text-sm font-bold">{stats.activeListings} active</p>
          <p className="text-[10px] text-muted-foreground">{stats.totalListings} total</p>
        </div>
      </div>
      <div className="bg-background rounded-lg p-2.5 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <div>
          <p className="text-[10px] text-muted-foreground">Last Active</p>
          <p className="text-xs font-semibold leading-tight">
            {stats.lastActive
              ? formatDistanceToNow(new Date(stats.lastActive), { addSuffix: true })
              : "No activity"}
          </p>
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, onRoleChange, onBlock, onDelete, adminEmail }) {
  const [expanded, setExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const isBlocked = user.role === "blocked";

  const { data: activeListings = [] } = useQuery({
    queryKey: ["admin-user-listings", user.email],
    queryFn: () => base44.entities.Listing.filter({ seller_email: user.email, status: "active" }, "-created_date", 10),
    enabled: expanded,
    staleTime: 1000 * 60 * 2,
  });

  const { data: userSub } = useQuery({
    queryKey: ["admin-user-sub", user.email],
    queryFn: () => base44.entities.UserSubscription.filter({ user_email: user.email }, "-created_date", 1).then(r => r[0]),
    enabled: expanded,
  });

  const handleSendMessage = async () => {
    if (!messageText.trim() || !adminEmail) return;
    setSending(true);
    const convId = [adminEmail, user.email].sort().join("_");
    await base44.entities.Message.create({
      conversation_id: convId,
      sender_email: adminEmail,
      receiver_email: user.email,
      content: messageText.trim(),
      read: false,
    });
    toast.success("Message sent!");
    setMessageText("");
    setShowMessage(false);
    setSending(false);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setApplying(true);
    try {
      const res = await base44.functions.invoke("applyPromoCode", { code: promoCode.trim().toUpperCase(), user_email: user.email });
      if (res.data?.success) {
        toast.success(`Promo applied to ${user.email}`);
        setPromoCode("");
      } else {
        toast.error(res.data?.error || "Failed to apply promo");
      }
    } catch {
      toast.error("Error applying promo");
    }
    setApplying(false);
  };

  return (
    <div className={`bg-card border rounded-xl overflow-hidden ${isBlocked ? "border-destructive/40 opacity-75" : "border-border"}`}>
      {/* User header row */}
      <div className="p-3 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isBlocked ? "bg-destructive/10" : "bg-primary/10"}`}>
          {isBlocked ? <Ban className="w-4 h-4 text-destructive" /> : <User className="w-4 h-4 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{user.full_name || "Unknown"}</p>
          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant={isBlocked ? "destructive" : user.role === "admin" ? "default" : "secondary"}
            className="text-[10px] capitalize"
          >
            {user.role || "user"}
          </Badge>
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-border bg-muted/30 p-4 space-y-4">

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              Joined {user.created_date ? format(new Date(user.created_date), "MMM d, yyyy") : "—"}
            </div>
            <div className="flex items-center gap-1.5">
              <ListChecks className="w-3 h-3" />
              Plan: <span className="font-semibold text-foreground capitalize ml-1">{userSub?.plan_slug || "free"}</span>
            </div>
          </div>

          {/* Stats */}
          <div>
            <Label className="text-xs font-semibold mb-2 block">Activity Stats</Label>
            <UserStatsRow email={user.email} expanded={expanded} />
          </div>

          {/* Role control */}
          {!isBlocked && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Role</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={user.role === "admin" ? "default" : "outline"}
                  className="text-xs h-8 rounded-lg flex-1"
                  onClick={() => onRoleChange(user.id, "admin")}
                >
                  <Shield className="w-3.5 h-3.5 mr-1" /> Admin
                </Button>
                <Button
                  size="sm"
                  variant={user.role === "user" || !user.role ? "default" : "outline"}
                  className="text-xs h-8 rounded-lg flex-1"
                  onClick={() => onRoleChange(user.id, "user")}
                >
                  <ShieldOff className="w-3.5 h-3.5 mr-1" /> User
                </Button>
              </div>
            </div>
          )}

          {/* Apply Promo */}
          {!isBlocked && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1"><Gift className="w-3 h-3" /> Apply Promo Code</Label>
              <div className="flex gap-2">
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="e.g. REEF2024"
                  className="rounded-lg h-8 text-xs font-mono flex-1"
                />
                <Button size="sm" className="h-8 rounded-lg text-xs" onClick={handleApplyPromo} disabled={applying || !promoCode.trim()}>
                  <Tag className="w-3 h-3 mr-1" /> {applying ? "..." : "Apply"}
                </Button>
              </div>
            </div>
          )}

          {/* Actions: Block / Unblock / Delete */}
          <div className="space-y-2 pt-1 border-t border-border">
            <Label className="text-xs font-semibold text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Moderation</Label>
            <div className="flex gap-2">
              {isBlocked ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 rounded-lg flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  onClick={() => onBlock(user.id, false)}
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Unblock
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 rounded-lg flex-1 border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => onBlock(user.id, true)}
                >
                  <Ban className="w-3.5 h-3.5 mr-1" /> Block User
                </Button>
              )}

              {!confirmDelete ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 rounded-lg border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              ) : (
                <div className="flex gap-1 flex-1">
                  <Button
                    size="sm"
                    className="text-xs h-8 rounded-lg flex-1 bg-destructive hover:bg-destructive/90"
                    onClick={() => { onDelete(user.id, user.email); setConfirmDelete(false); }}
                  >
                    Confirm Delete
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-8 rounded-lg" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Active Listings */}
          {activeListings.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1"><Package className="w-3 h-3" /> Active Listings ({activeListings.length})</Label>
              <div className="space-y-1.5">
                {activeListings.map(l => (
                  <a key={l.id} href={`/listing/${l.id}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-background rounded-lg p-2 hover:bg-muted/50 transition-colors">
                    {l.photos?.[0] && <img src={l.photos[0]} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{l.title}</p>
                      <p className="text-[10px] text-muted-foreground">${l.price?.toFixed(2)} &middot; {l.views || 0} views</p>
                    </div>
                    <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Message User */}
          <div className="space-y-1.5">
            <button
              onClick={() => setShowMessage(!showMessage)}
              className="flex items-center gap-2 text-xs text-primary font-medium"
            >
              <MessageSquare className="w-3.5 h-3.5" /> {showMessage ? "Cancel" : "Send In-App Message"}
            </button>
            {showMessage && (
              <div className="space-y-2">
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="rounded-lg text-sm"
                  rows={3}
                />
                <Button size="sm" className="h-8 text-xs rounded-lg gap-1.5 w-full" onClick={handleSendMessage} disabled={sending || !messageText.trim()}>
                  <Send className="w-3 h-3" /> {sending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            )}
          </div>

          {/* Email shortcut */}
          <a href={`mailto:${user.email}`} className="flex items-center gap-2 text-xs text-primary font-medium">
            <Mail className="w-3.5 h-3.5" /> Email this user
          </a>
        </div>
      )}
    </div>
  );
}

export default function UserManagementTab() {
  const queryClient = useQueryClient();
  const [adminEmail, setAdminEmail] = useState(null);
  useState(() => { base44.auth.me().then(me => setAdminEmail(me.email)).catch(() => {}); });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => base44.entities.User.list("-created_date", 5000),
  });

  const handleRoleChange = async (userId, newRole) => {
    await base44.entities.User.update(userId, { role: newRole });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    toast.success(`Role updated to ${newRole}`);
  };

  const handleBlock = async (userId, block) => {
    const res = await base44.functions.invoke("adminUserActions", {
      action: block ? "block" : "unblock",
      user_id: userId,
    });
    if (res.data?.success) {
      toast.success(block ? "User blocked" : "User unblocked");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } else {
      toast.error("Action failed");
    }
  };

  const handleDelete = async (userId, userEmail) => {
    const res = await base44.functions.invoke("adminUserActions", {
      action: "delete_account",
      user_id: userId,
      user_email: userEmail,
    });
    if (res.data?.success) {
      toast.success("Account deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } else {
      toast.error("Delete failed");
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter || (!u.role && roleFilter === "user");
    return matchSearch && matchRole;
  });

  const adminCount = users.filter((u) => u.role === "admin").length;
  const blockedCount = users.filter((u) => u.role === "blocked").length;
  const userCount = users.length - adminCount - blockedCount;

  return (
    <div className="space-y-4 mt-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: users.length, color: "text-foreground" },
          { label: "Users", value: userCount, color: "text-primary" },
          { label: "Admins", value: adminCount, color: "text-amber-500" },
          { label: "Blocked", value: blockedCount, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm rounded-xl"
          />
        </div>
        <MobileSelect
          value={roleFilter}
          onValueChange={setRoleFilter}
          placeholder="Role"
          options={[
            { value: "all", label: "All Roles" },
            { value: "user", label: "Users" },
            { value: "admin", label: "Admins" },
            { value: "blocked", label: "Blocked" },
          ]}
        />
      </div>

      {/* User list */}
      {isLoading ? (
        <p className="text-center py-10 text-muted-foreground text-sm">Loading users...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground text-sm">No users found</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              onRoleChange={handleRoleChange}
              onBlock={handleBlock}
              onDelete={handleDelete}
              adminEmail={adminEmail}
            />
          ))}
        </div>
      )}
    </div>
  );
}