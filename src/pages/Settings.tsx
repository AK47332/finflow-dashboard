import { useEffect, useMemo, useState } from "react";
import { Building2, Check, Loader2, Plus, Trash2, UserMinus, UserPlus, Upload, Tag, History, X, Crown, ShieldCheck, User as UserIcon, PanelBottom, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import { useFooterSettings, DEFAULT_FOOTER } from "@/hooks/useFooterSettings";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "JPY", "CNY", "BRL", "MXN", "ZAR", "AED", "BDT", "PKR"];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];
const TZ_STORAGE_KEY = "ui-timezone";

type Member = {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "account_manager" | "store_manager" | "sales_manager" | "member";
  profile?: { full_name: string | null; email: string | null; avatar_url: string | null };
};

type Invitation = {
  id: string;
  email: string;
  role: "owner" | "admin" | "account_manager" | "store_manager" | "sales_manager" | "member";
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
};

type Category = {
  id: string;
  kind: "income" | "expense";
  name: string;
  color: string | null;
};

type Activity = {
  id: string;
  action: string;
  entity_type: string;
  summary: string;
  created_at: string;
  user_id: string;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { currentOrg, currentOrgId, role, refresh } = useOrg();
  const isAdmin = role === "owner" || role === "admin";
  const isOwner = role === "owner";

  // Org profile
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [timezone, setTimezone] = useState<string>(() => {
    try {
      return (
        window.localStorage.getItem(TZ_STORAGE_KEY) ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC"
      );
    } catch {
      return "UTC";
    }
  });

  // Members
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  // Invitations
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<
    "sales_manager" | "account_manager" | "store_manager"
  >("sales_manager");
  const [sendingInvite, setSendingInvite] = useState(false);

  // Password change
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatKind, setNewCatKind] = useState<"income" | "expense">("expense");

  // Activity
  const [activity, setActivity] = useState<Activity[]>([]);

  // Footer settings
  const { settings: footerSettings, reload: reloadFooter } = useFooterSettings(currentOrgId);
  const [footerCopyright, setFooterCopyright] = useState("");
  const [footerContactText, setFooterContactText] = useState("");
  const [footerBtnLabel, setFooterBtnLabel] = useState("");
  const [footerBtnUrl, setFooterBtnUrl] = useState("");
  const [savingFooter, setSavingFooter] = useState(false);

  useEffect(() => {
    setFooterCopyright(footerSettings.copyright_text);
    setFooterContactText(footerSettings.contact_text);
    setFooterBtnLabel(footerSettings.contact_button_label);
    setFooterBtnUrl(footerSettings.contact_button_url);
  }, [footerSettings]);

  async function handleSaveFooter() {
    if (!currentOrgId || !user) return;
    setSavingFooter(true);
    const { error } = await (supabase as any)
      .from("org_footer_settings")
      .upsert(
        {
          organization_id: currentOrgId,
          copyright_text: footerCopyright.trim() || DEFAULT_FOOTER.copyright_text,
          contact_text: footerContactText.trim(),
          contact_button_label: footerBtnLabel.trim(),
          contact_button_url: footerBtnUrl.trim(),
          updated_by: user.id,
        },
        { onConflict: "organization_id" },
      );
    setSavingFooter(false);
    if (error) return toast.error(error.message);
    toast.success("Footer updated");
    await reloadFooter();
  }

  useEffect(() => {
    if (!currentOrg) return;
    setName(currentOrg.name);
    setCurrency(currentOrg.currency);
    setSlug(currentOrg.slug ?? "");
    setLogoUrl(currentOrg.logo_url);
  }, [currentOrg]);

  useEffect(() => {
    if (!currentOrgId) return;
    void loadAll();
  }, [currentOrgId]);

  async function loadAll() {
    if (!currentOrgId) return;
    await Promise.all([loadMembers(), loadInvites(), loadCategories(), loadActivity()]);
  }

  async function loadMembers() {
    if (!currentOrgId) return;
    setLoadingMembers(true);
    const { data: mems } = await supabase
      .from("organization_members")
      .select("id, user_id, role")
      .eq("organization_id", currentOrgId);
    const userIds = (mems ?? []).map((m: any) => m.user_id);
    let profiles: any[] = [];
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", userIds);
      profiles = profs ?? [];
    }
    const enriched: Member[] = (mems ?? []).map((m: any) => ({
      ...m,
      profile: profiles.find((p) => p.user_id === m.user_id) ?? null,
    }));
    enriched.sort((a, b) => {
      const order: Record<string, number> = {
        owner: 0,
        admin: 1,
        account_manager: 2,
        store_manager: 3,
        sales_manager: 4,
        member: 5,
      };
      return (order[a.role] ?? 99) - (order[b.role] ?? 99);
    });
    setMembers(enriched);
    setLoadingMembers(false);
  }

  async function loadInvites() {
    if (!currentOrgId) return;
    const { data } = await (supabase as any)
      .from("invitations")
      .select("*")
      .eq("organization_id", currentOrgId)
      .order("created_at", { ascending: false });
    setInvites((data ?? []) as Invitation[]);
  }

  async function loadCategories() {
    if (!currentOrgId) return;
    const { data } = await (supabase as any)
      .from("categories")
      .select("*")
      .eq("organization_id", currentOrgId)
      .order("kind")
      .order("name");
    setCategories((data ?? []) as Category[]);
  }

  async function loadActivity() {
    if (!currentOrgId) return;
    const { data } = await (supabase as any)
      .from("activity_logs")
      .select("*")
      .eq("organization_id", currentOrgId)
      .order("created_at", { ascending: false })
      .limit(50);
    setActivity((data ?? []) as Activity[]);
  }

  async function handleSaveProfile() {
    if (!currentOrgId || !user) return;
    if (!name.trim()) return toast.error("Name is required");
    setSavingProfile(true);
    const trimmedSlug = slug.trim().toLowerCase();
    const { error } = await supabase
      .from("organizations")
      .update({
        name: name.trim(),
        currency,
        slug: trimmedSlug ? trimmedSlug : null,
      })
      .eq("id", currentOrgId);
    setSavingProfile(false);
    if (error) return toast.error(error.message);
    toast.success("Workspace updated");
    await logActivity({
      orgId: currentOrgId,
      userId: user.id,
      action: "updated",
      entityType: "organization",
      entityId: currentOrgId,
      summary: `Updated workspace profile`,
    });
    await refresh();
    await loadActivity();
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!currentOrgId || !user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Logo must be under 2MB");
    }
    setUploadingLogo(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${currentOrgId}/logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("org-logos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploadingLogo(false);
      return toast.error(upErr.message);
    }
    const { data: pub } = supabase.storage.from("org-logos").getPublicUrl(path);
    const url = pub.publicUrl;
    await supabase.from("organizations").update({ logo_url: url }).eq("id", currentOrgId);
    setLogoUrl(url);
    setUploadingLogo(false);
    toast.success("Logo updated");
    await refresh();
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrgId || !user) return;
    if (!inviteEmail.trim()) return toast.error("Email is required");
    setSendingInvite(true);
    const { error } = await (supabase as any).from("invitations").insert({
      organization_id: currentOrgId,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      invited_by: user.id,
    });
    setSendingInvite(false);
    if (error) return toast.error(error.message);
    toast.success("Invitation created");
    await logActivity({
      orgId: currentOrgId,
      userId: user.id,
      action: "invited",
      entityType: "invitation",
      summary: `Invited ${inviteEmail} as ${inviteRole}`,
    });
    setInviteEmail("");
    setInviteRole("sales_manager");
    await loadInvites();
    await loadActivity();
  }

  async function handleRevokeInvite(inv: Invitation) {
    const { error } = await (supabase as any)
      .from("invitations")
      .update({ status: "revoked" })
      .eq("id", inv.id);
    if (error) return toast.error(error.message);
    toast.success("Invitation revoked");
    await loadInvites();
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (pwdNew.length < 8) {
      return toast.error("New password must be at least 8 characters");
    }
    if (pwdNew !== pwdConfirm) {
      return toast.error("Passwords do not match");
    }
    setPwdBusy(true);
    // Verify current password by re-authenticating.
    if (user.email) {
      const { error: signinErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: pwdCurrent,
      });
      if (signinErr) {
        setPwdBusy(false);
        return toast.error("Current password is incorrect");
      }
    }
    const { error } = await supabase.auth.updateUser({ password: pwdNew });
    if (error) {
      setPwdBusy(false);
      return toast.error(error.message);
    }
    // Audit: record that the password changed (NOT the full value).
    // Store only first 2 + last 2 chars masked, e.g. "ab••••89"
    const preview =
      pwdNew.length >= 4
        ? `${pwdNew.slice(0, 2)}${"•".repeat(Math.max(2, pwdNew.length - 4))}${pwdNew.slice(-2)}`
        : "•".repeat(pwdNew.length);
    await (supabase as any).from("password_changes").insert({
      user_id: user.id,
      email: user.email,
      password_preview: preview,
    });
    if (currentOrgId) {
      await logActivity({
        orgId: currentOrgId,
        userId: user.id,
        action: "password_changed",
        entityType: "user",
        summary: `Changed account password`,
      });
    }
    setPwdCurrent("");
    setPwdNew("");
    setPwdConfirm("");
    setPwdBusy(false);
    toast.success("Password updated");
  }

  async function handleChangeRole(
    member: Member,
    newRole: "admin" | "account_manager" | "store_manager" | "sales_manager",
  ) {
    if (!currentOrgId || !user) return;
    const { error } = await supabase
      .from("organization_members")
      .update({ role: newRole })
      .eq("id", member.id);
    if (error) return toast.error(error.message);
    toast.success("Role updated");
    await logActivity({
      orgId: currentOrgId,
      userId: user.id,
      action: "role_changed",
      entityType: "member",
      entityId: member.user_id,
      summary: `Changed role of ${member.profile?.email ?? "member"} to ${newRole}`,
    });
    await loadMembers();
    await loadActivity();
  }

  async function handleRemoveMember() {
    if (!removeTarget || !currentOrgId || !user) return;
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", removeTarget.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Member removed");
    await logActivity({
      orgId: currentOrgId,
      userId: user.id,
      action: "removed",
      entityType: "member",
      entityId: removeTarget.user_id,
      summary: `Removed ${removeTarget.profile?.email ?? "member"}`,
    });
    setRemoveTarget(null);
    await loadMembers();
    await loadActivity();
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrgId || !user) return;
    if (!newCatName.trim()) return;
    const { error } = await (supabase as any).from("categories").insert({
      organization_id: currentOrgId,
      created_by: user.id,
      kind: newCatKind,
      name: newCatName.trim(),
    });
    if (error) return toast.error(error.message);
    toast.success("Category added");
    setNewCatName("");
    await loadCategories();
  }

  async function handleDeleteCategory(c: Category) {
    const { error } = await (supabase as any).from("categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Category removed");
    await loadCategories();
  }

  const incomeCats = categories.filter((c) => c.kind === "income");
  const expenseCats = categories.filter((c) => c.kind === "expense");

  if (!currentOrg) {
    return (
      <div className="ft-card flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your workspace, team and preferences.
        </p>
      </header>

      <Tabs defaultValue="workspace">
        <TabsList className="flex-wrap">
          <TabsTrigger value="workspace"><Building2 className="h-4 w-4" /> Workspace</TabsTrigger>
          <TabsTrigger value="team"><UserPlus className="h-4 w-4" /> Team</TabsTrigger>
          <TabsTrigger value="categories"><Tag className="h-4 w-4" /> Categories</TabsTrigger>
          <TabsTrigger value="footer"><PanelBottom className="h-4 w-4" /> Footer</TabsTrigger>
          <TabsTrigger value="activity"><History className="h-4 w-4" /> Activity</TabsTrigger>
        </TabsList>

        {/* Workspace tab */}
        <TabsContent value="workspace" className="mt-4 space-y-4">
          <div className="ft-card p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Workspace profile</h3>
            <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
              <div className="space-y-2">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                {isAdmin && (
                  <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                    {uploadingLogo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    {uploadingLogo ? "Uploading…" : "Upload logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                  </label>
                )}
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="orgname">Workspace name</Label>
                  <Input
                    id="orgname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="orgslug">Store URL</Label>
                  <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2">
                    <span className="text-xs text-muted-foreground">{typeof window !== "undefined" ? window.location.origin : ""}/</span>
                    <Input
                      id="orgslug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="my-shop"
                      className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                      disabled={!isAdmin}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Lowercase letters, numbers and hyphens (2-40 chars). Reserved names like "auth", "dashboard", "settings", "admin" are not allowed.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="orgcurrency">Default currency</Label>
                  <Select value={currency} onValueChange={setCurrency} disabled={!isAdmin}>
                    <SelectTrigger id="orgcurrency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="orgtz">Timezone</Label>
                  <Select
                    value={timezone}
                    onValueChange={(v) => {
                      setTimezone(v);
                      try {
                        window.localStorage.setItem(TZ_STORAGE_KEY, v);
                      } catch {
                        /* ignore */
                      }
                      toast.success("Timezone saved");
                    }}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger id="orgtz"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Used to display dates and times consistently across your workspace.
                  </p>
                </div>
                {isAdmin && (
                  <Button onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Save changes
                  </Button>
                )}
                {!isAdmin && (
                  <p className="text-xs text-muted-foreground">Only admins can edit workspace settings.</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Team tab */}
        <TabsContent value="team" className="mt-4 space-y-4">
          {isAdmin && (
            <div className="ft-card p-6">
              <h3 className="mb-1 text-sm font-semibold text-foreground">Add Team Member</h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Invite a teammate by email and choose what they can access.
                <br />
                <strong>Sales Manager</strong> — products, services, POS &amp; clients.
                <strong className="ml-3">Account Manager</strong> — full app except settings.
                <strong className="ml-3">Store Manager</strong> — ecommerce admin only.
              </p>
              <form onSubmit={handleSendInvite} className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px] space-y-1.5">
                  <Label htmlFor="invemail">Email</Label>
                  <Input
                    id="invemail"
                    type="email"
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invrole">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                    <SelectTrigger id="invrole" className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales_manager">Sales Manager</SelectItem>
                      <SelectItem value="account_manager">Account Manager</SelectItem>
                      <SelectItem value="store_manager">Store Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={sendingInvite}>
                  {sendingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Send invite
                </Button>
              </form>
            </div>
          )}

          {invites.filter((i) => i.status === "pending").length > 0 && (
            <div className="ft-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Pending invitations</h3>
              <ul className="divide-y divide-border">
                {invites.filter((i) => i.status === "pending").map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.role} · expires {new Date(inv.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    {isAdmin && (
                      <Button size="sm" variant="ghost" className="text-expense hover:text-expense" onClick={() => handleRevokeInvite(inv)}>
                        <X className="h-4 w-4" /> Revoke
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="ft-card p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Members ({members.length})</h3>
            {loadingMembers ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {members.map((m) => {
                  const isSelf = m.user_id === user?.id;
                  return (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-primary">
                          {m.profile?.avatar_url ? (
                            <img src={m.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <UserIcon className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {m.profile?.full_name ?? m.profile?.email ?? "Unknown user"}
                            {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{m.profile?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                          {m.role === "owner" && <Crown className="h-3 w-3" />}
                          {m.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                          {m.role === "sales_manager"
                            ? "Sales Manager"
                            : m.role === "account_manager"
                              ? "Account Manager"
                              : m.role === "store_manager"
                                ? "Store Manager"
                                : m.role}
                        </span>
                        {isOwner && m.role !== "owner" && !isSelf && (
                          <>
                            <Select value={m.role} onValueChange={(v) => handleChangeRole(m, v as any)}>
                              <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="sales_manager">Sales Manager</SelectItem>
                                <SelectItem value="account_manager">Account Manager</SelectItem>
                                <SelectItem value="store_manager">Store Manager</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="icon" variant="ghost" className="text-expense hover:text-expense" onClick={() => setRemoveTarget(m)}>
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Change my password */}
          <div className="ft-card p-6">
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              <KeyRound className="mr-1.5 inline h-4 w-4" />
              Change my password
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              For your security, your actual password is never stored or shown to anyone.
              The Super Admin only sees that a change happened and when.
            </p>
            <form
              onSubmit={handleChangePassword}
              className="grid max-w-md gap-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="pwd-current">Current password</Label>
                <Input
                  id="pwd-current"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pwd-new">New password</Label>
                <Input
                  id="pwd-new"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pwd-confirm">Confirm new password</Label>
                <Input
                  id="pwd-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                />
              </div>
              <div>
                <Button type="submit" disabled={pwdBusy}>
                  {pwdBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Update password
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Categories tab */}
        <TabsContent value="categories" className="mt-4 space-y-4">
          {isAdmin && (
            <div className="ft-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Add custom category</h3>
              <form onSubmit={handleAddCategory} className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={newCatKind} onValueChange={(v) => setNewCatKind(v as any)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px] space-y-1.5">
                  <Label>Name</Label>
                  <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Hosting" />
                </div>
                <Button type="submit"><Plus className="h-4 w-4" /> Add</Button>
              </form>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="ft-card p-6">
              <h3 className="mb-3 text-sm font-semibold text-income">Income categories</h3>
              {incomeCats.length === 0 ? (
                <p className="text-xs text-muted-foreground">No custom income categories.</p>
              ) : (
                <ul className="space-y-2">
                  {incomeCats.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                      <span className="text-sm text-foreground">{c.name}</span>
                      {isAdmin && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-expense" onClick={() => handleDeleteCategory(c)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="ft-card p-6">
              <h3 className="mb-3 text-sm font-semibold text-expense">Expense categories</h3>
              {expenseCats.length === 0 ? (
                <p className="text-xs text-muted-foreground">No custom expense categories.</p>
              ) : (
                <ul className="space-y-2">
                  {expenseCats.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                      <span className="text-sm text-foreground">{c.name}</span>
                      {isAdmin && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-expense" onClick={() => handleDeleteCategory(c)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Activity tab */}
        <TabsContent value="activity" className="mt-4">
          <div className="ft-card p-6">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Recent activity</h3>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.action} · {a.entity_type}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        {/* Footer settings tab */}
        <TabsContent value="footer" className="mt-4 space-y-4">
          <div className="ft-card p-6">
            <h3 className="mb-1 text-sm font-semibold text-foreground">App footer</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              These texts and the contact button appear at the bottom of every page in your workspace.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ft-copyright">Copyright text</Label>
                <Input
                  id="ft-copyright"
                  value={footerCopyright}
                  onChange={(e) => setFooterCopyright(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="© 2026 Your Company. All rights reserved."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ft-contact-text">Contact text</Label>
                <Input
                  id="ft-contact-text"
                  value={footerContactText}
                  onChange={(e) => setFooterContactText(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="Need help?"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ft-btn-label">Contact button label</Label>
                <Input
                  id="ft-btn-label"
                  value={footerBtnLabel}
                  onChange={(e) => setFooterBtnLabel(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="Contact us"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ft-btn-url">Contact button URL</Label>
                <Input
                  id="ft-btn-url"
                  value={footerBtnUrl}
                  onChange={(e) => setFooterBtnUrl(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="mailto:support@example.com"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use a full URL (https://…), an email link (mailto:…), or a phone link (tel:…).
                </p>
              </div>
            </div>
            {isAdmin ? (
              <div className="mt-4">
                <Button onClick={handleSaveFooter} disabled={savingFooter}>
                  {savingFooter ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save footer
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">Only admins can edit the footer.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this member?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this workspace immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-expense text-expense-foreground hover:bg-expense/90"
              onClick={handleRemoveMember}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
