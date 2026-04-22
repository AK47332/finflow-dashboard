import { useMemo, useState } from "react";
import { useEffect } from "react";
import { Package, Pencil, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CrudShell } from "@/components/crud/CrudShell";
import { useOrgTable } from "@/hooks/useOrgTable";
import { currency } from "@/lib/format";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { slugify, type EcomCategory, type EcomProductExtra } from "@/lib/ecom";
import { MultiImageUploader } from "@/components/ui/MultiImageUploader";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type Product = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  cost: number;
  stock: number;
  unit: string | null;
  description: string | null;
};

export default function ProductsPage() {
  const { rows, loading, create, update, remove } = useOrgTable<Product>("products", {
    column: "name",
    ascending: true,
  });
  const { currentOrgId } = useOrg();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("");
  const [description, setDescription] = useState("");

  // Ecommerce fields
  const [ecomCategories, setEcomCategories] = useState<EcomCategory[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [ecomCategoryId, setEcomCategoryId] = useState<string>("");
  const [shortDescription, setShortDescription] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (!currentOrgId) return;
    supabase
      .from("ecom_categories")
      .select("*")
      .eq("organization_id", currentOrgId)
      .order("sort_order")
      .then(({ data }) => setEcomCategories((data as EcomCategory[]) ?? []));
  }, [currentOrgId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.sku].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const reset = () => {
    setName(""); setSku(""); setPrice(""); setCost(""); setStock(""); setUnit(""); setDescription("");
    setIsPublished(false); setIsFeatured(false); setIsTrending(false);
    setEcomCategoryId(""); setShortDescription(""); setCompareAtPrice("");
    setImages([]); setSlug("");
    setEditing(null);
  };
  const openAdd = () => { reset(); setOpen(true); };
  const openEdit = async (p: Product) => {
    setEditing(p);
    setName(p.name); setSku(p.sku ?? ""); setPrice(p.price.toString());
    setCost(p.cost.toString()); setStock(p.stock.toString());
    setUnit(p.unit ?? ""); setDescription(p.description ?? "");
    setOpen(true);
    // Load ecom extras for this product
    if (currentOrgId) {
      const { data } = await supabase
        .from("ecom_product_extras")
        .select("*")
        .eq("product_id", p.id)
        .maybeSingle();
      if (data) {
        const ex = data as EcomProductExtra;
        setIsPublished(ex.is_published);
        setIsFeatured(ex.is_featured);
        setIsTrending(ex.is_trending);
        setEcomCategoryId(ex.ecom_category_id ?? "");
        setShortDescription(ex.short_description ?? "");
        setCompareAtPrice(ex.compare_at_price ? String(ex.compare_at_price) : "");
        setImages(ex.image_urls ?? []);
        setSlug(ex.slug);
      } else {
        setSlug(slugify(p.name));
      }
    }
  };

  const totalValue = rows.reduce((s, p) => s + p.price * p.stock, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim() || null,
        price: parseFloat(price) || 0,
        cost: parseFloat(cost) || 0,
        stock: parseFloat(stock) || 0,
        unit: unit.trim() || null,
        description: description.trim() || null,
      };
      let productId = editing?.id;
      if (editing) {
        await update(editing.id, payload);
      } else {
        const created = await create(payload);
        productId = (created as Product | undefined)?.id;
      }
      // Upsert ecom extras (always — defaults to unpublished)
      if (productId && currentOrgId) {
        const finalSlug = (slug.trim() || slugify(name)).toLowerCase();
        const cleanImages = images.map((s) => s.trim()).filter(Boolean);
        const { error: exErr } = await supabase.from("ecom_product_extras").upsert(
          {
            product_id: productId,
            organization_id: currentOrgId,
            ecom_category_id: ecomCategoryId || null,
            is_published: isPublished,
            is_featured: isFeatured,
            is_trending: isTrending,
            short_description: shortDescription.trim() || null,
            long_description: description.trim() || null,
            compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
            image_urls: cleanImages,
            tags: [],
            slug: finalSlug,
          },
          { onConflict: "product_id" },
        );
        if (exErr) throw exErr;
      }
      toast.success(editing ? "Product updated" : "Product added");
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    }
  };

  return (
    <CrudShell
      title="Products"
      description="Catalog of items you sell."
      loading={loading}
      empty={!loading && rows.length === 0}
      emptyText="No products yet. Add your first one."
      onAdd={openAdd}
      addLabel="Add Product"
      addClassName="bg-gradient-primary text-primary-foreground hover:opacity-90"
      stats={
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-primary-soft text-primary"><Package className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Products</p>
                <p className="text-2xl font-bold text-foreground">{rows.length}</p>
              </div>
            </div>
          </div>
          <div className="ft-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Inventory Value</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{currency(totalValue)}</p>
          </div>
          <div className="ft-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Out of Stock</p>
            <p className="mt-1 text-2xl font-bold text-expense">
              {rows.filter((p) => p.stock <= 0).length}
            </p>
          </div>
        </div>
      }
      toolbar={
        rows.length > 0 && (
          <div className="ft-card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        )
      }
    >
      <div className="ft-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary-soft/60 hover:bg-primary-soft/60">
              <TableHead className="text-foreground">Name</TableHead>
              <TableHead className="text-foreground">SKU</TableHead>
              <TableHead className="text-right text-foreground">Price</TableHead>
              <TableHead className="text-right text-foreground">Cost</TableHead>
              <TableHead className="text-right text-foreground">Stock</TableHead>
              <TableHead className="text-foreground">Unit</TableHead>
              <TableHead className="w-[100px] text-right text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p, i) => (
              <TableRow key={p.id} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.sku ?? "—"}</TableCell>
                <TableCell className="text-right font-semibold">{currency(p.price)}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{currency(p.cost)}</TableCell>
                <TableCell className={`text-right text-sm ${p.stock <= 0 ? "text-expense font-semibold" : "text-foreground"}`}>{p.stock}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.unit ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setPendingDelete(p)} className="text-expense hover:text-expense"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pname">Name *</Label>
              <Input
                id="pname"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editing && !slug) setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="psku">SKU</Label>
                <Input id="psku" value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="punit">Unit</Label>
                <Input id="punit" placeholder="pcs, kg, box" value={unit} onChange={(e) => setUnit(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pprice">Price</Label>
                <Input id="pprice" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pcost">Cost</Label>
                <Input id="pcost" type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pstock">Stock</Label>
                <Input id="pstock" type="number" step="0.01" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pdesc">Description</Label>
              <Textarea id="pdesc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            {/* Ecommerce settings */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">Storefront listing</div>
                  <p className="text-xs text-muted-foreground">Settings that apply when Ecommerce mood is on.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="ppub" className="text-xs">Publish</Label>
                  <Switch id="ppub" checked={isPublished} onCheckedChange={setIsPublished} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pslug">Slug</Label>
                  <Input id="pslug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pcat">Category</Label>
                  <Select value={ecomCategoryId || "none"} onValueChange={(v) => setEcomCategoryId(v === "none" ? "" : v)}>
                    <SelectTrigger id="pcat"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {ecomCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pshort">Short description</Label>
                <Textarea id="pshort" rows={2} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Shown on product cards" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pcompare">Compare-at price</Label>
                  <Input id="pcompare" type="number" step="0.01" min="0" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} placeholder="Original price" />
                </div>
                <div className="flex items-end gap-4 pb-1">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={isFeatured} onCheckedChange={setIsFeatured} /> Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={isTrending} onCheckedChange={setIsTrending} /> Trending
                  </label>
                </div>
              </div>

              <MultiImageUploader
                label="Product images"
                values={images}
                onChange={setImages}
                folder="products"
                max={8}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Add Product"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>{pendingDelete?.name}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-expense text-expense-foreground hover:bg-expense/90"
              onClick={async () => {
                if (!pendingDelete) return;
                try { await remove(pendingDelete.id); toast.success("Product deleted"); setPendingDelete(null); }
                catch (e: any) { toast.error(e.message ?? "Failed"); }
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CrudShell>
  );
}