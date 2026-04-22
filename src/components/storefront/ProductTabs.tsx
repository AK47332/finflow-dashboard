import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { StorefrontProduct } from "@/lib/ecom";

export function ProductTabs({ product }: { product: StorefrontProduct }) {
  return (
    <Accordion
      type="multiple"
      defaultValue={["description"]}
      className="mt-8 max-w-3xl divide-y divide-border/60 border-y border-border/60"
    >
      <AccordionItem value="description" className="border-0">
        <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline">
          Description
        </AccordionTrigger>
        <AccordionContent className="pb-5">
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.extras?.long_description ||
              product.description ||
              product.extras?.short_description ||
              "No detailed description available."}
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="info" className="border-0">
        <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline">
          Additional Information
        </AccordionTrigger>
        <AccordionContent className="pb-5">
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
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  );
}
