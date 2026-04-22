import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StorefrontProduct } from "@/lib/ecom";

export function ProductTabs({ product }: { product: StorefrontProduct }) {
  return (
    <Tabs defaultValue="description" className="mt-12">
      <TabsList className="h-auto rounded-xl bg-muted/40 p-1">
        <TabsTrigger value="description" className="rounded-lg px-5 py-2">
          Description
        </TabsTrigger>
        <TabsTrigger value="details" className="rounded-lg px-5 py-2">
          Details
        </TabsTrigger>
        <TabsTrigger value="shipping" className="rounded-lg px-5 py-2">
          Shipping & returns
        </TabsTrigger>
      </TabsList>
      <TabsContent value="description" className="mt-6 max-w-3xl">
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {product.extras?.long_description ||
            product.description ||
            product.extras?.short_description ||
            "No detailed description available."}
        </p>
      </TabsContent>
      <TabsContent value="details" className="mt-6">
        <dl className="grid max-w-xl grid-cols-3 gap-x-6 gap-y-3 text-sm">
          <dt className="font-medium text-muted-foreground">SKU</dt>
          <dd className="col-span-2">{product.sku ?? "—"}</dd>
          <dt className="font-medium text-muted-foreground">Stock</dt>
          <dd className="col-span-2">{Number(product.stock)} {product.unit ?? "units"}</dd>
          <dt className="font-medium text-muted-foreground">Unit</dt>
          <dd className="col-span-2">{product.unit ?? "—"}</dd>
          {product.extras?.tags && product.extras.tags.length > 0 && (
            <>
              <dt className="font-medium text-muted-foreground">Options</dt>
              <dd className="col-span-2">{product.extras.tags.join(", ")}</dd>
            </>
          )}
        </dl>
      </TabsContent>
      <TabsContent value="shipping" className="mt-6 max-w-3xl space-y-3 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Free shipping</strong> on orders over $50. Standard
          delivery takes 3–5 business days.
        </p>
        <p>
          <strong className="text-foreground">Easy returns</strong> within 30 days of delivery —
          items must be unused and in original packaging.
        </p>
        <p>
          <strong className="text-foreground">Cash on delivery</strong> available for eligible
          regions. See checkout for details.
        </p>
      </TabsContent>
    </Tabs>
  );
}
