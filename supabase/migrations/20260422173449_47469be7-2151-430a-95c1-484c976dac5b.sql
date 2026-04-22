
-- 1. Link incomes back to source ecom orders (idempotency key)
ALTER TABLE public.incomes
  ADD COLUMN IF NOT EXISTS ecom_order_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS incomes_ecom_order_id_unique
  ON public.incomes (ecom_order_id)
  WHERE ecom_order_id IS NOT NULL;

-- 2. Sync function: keep an income row in sync with a paid order
CREATE OR REPLACE FUNCTION public.sync_income_from_ecom_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_name text;
BEGIN
  -- On delete: also drop the linked income
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM public.incomes WHERE ecom_order_id = OLD.id;
    RETURN OLD;
  END IF;

  -- Resolve a friendly client name
  v_customer_name := COALESCE(
    NEW.shipping_full_name,
    NEW.contact_email,
    'Online Customer'
  );

  IF NEW.payment_status = 'paid' THEN
    -- Upsert an income row tied to this order
    INSERT INTO public.incomes (
      organization_id,
      created_by,
      title,
      amount,
      date,
      type,
      category,
      client,
      payment_method,
      description,
      ecom_order_id
    )
    VALUES (
      NEW.organization_id,
      COALESCE(
        (SELECT user_id FROM public.organization_members
          WHERE organization_id = NEW.organization_id
          ORDER BY (role = 'owner') DESC, created_at ASC
          LIMIT 1),
        NEW.customer_id
      ),
      'Online Order ' || NEW.order_number,
      NEW.total,
      COALESCE(NEW.updated_at::date, CURRENT_DATE),
      'Product',
      'Sales',
      v_customer_name,
      CASE NEW.payment_method
        WHEN 'cod' THEN 'Cash'
        WHEN 'card' THEN 'Card'
        WHEN 'bank' THEN 'Bank Transfer'
        WHEN 'mobile' THEN 'Mobile Banking'
        ELSE 'Other'
      END,
      'Auto-created from ecommerce order #' || NEW.order_number,
      NEW.id
    )
    ON CONFLICT (ecom_order_id) DO UPDATE SET
      amount = EXCLUDED.amount,
      title = EXCLUDED.title,
      client = EXCLUDED.client,
      payment_method = EXCLUDED.payment_method,
      date = EXCLUDED.date,
      updated_at = now();
  ELSE
    -- If the order is no longer paid (refunded/unpaid), remove the income row
    DELETE FROM public.incomes WHERE ecom_order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Triggers
DROP TRIGGER IF EXISTS trg_sync_income_from_ecom_order_ins ON public.ecom_orders;
CREATE TRIGGER trg_sync_income_from_ecom_order_ins
AFTER INSERT ON public.ecom_orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_income_from_ecom_order();

DROP TRIGGER IF EXISTS trg_sync_income_from_ecom_order_upd ON public.ecom_orders;
CREATE TRIGGER trg_sync_income_from_ecom_order_upd
AFTER UPDATE OF payment_status, total, payment_method, order_number ON public.ecom_orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_income_from_ecom_order();

DROP TRIGGER IF EXISTS trg_sync_income_from_ecom_order_del ON public.ecom_orders;
CREATE TRIGGER trg_sync_income_from_ecom_order_del
AFTER DELETE ON public.ecom_orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_income_from_ecom_order();

-- 4. Backfill: create income for any already-paid orders
INSERT INTO public.incomes (
  organization_id, created_by, title, amount, date, type, category, client, payment_method, description, ecom_order_id
)
SELECT
  o.organization_id,
  COALESCE(
    (SELECT user_id FROM public.organization_members m
      WHERE m.organization_id = o.organization_id
      ORDER BY (m.role = 'owner') DESC, m.created_at ASC
      LIMIT 1),
    o.customer_id
  ),
  'Online Order ' || o.order_number,
  o.total,
  COALESCE(o.updated_at::date, CURRENT_DATE),
  'Product',
  'Sales',
  COALESCE(o.shipping_full_name, o.contact_email, 'Online Customer'),
  CASE o.payment_method
    WHEN 'cod' THEN 'Cash'
    WHEN 'card' THEN 'Card'
    WHEN 'bank' THEN 'Bank Transfer'
    WHEN 'mobile' THEN 'Mobile Banking'
    ELSE 'Other'
  END,
  'Auto-created from ecommerce order #' || o.order_number,
  o.id
FROM public.ecom_orders o
WHERE o.payment_status = 'paid'
  AND NOT EXISTS (SELECT 1 FROM public.incomes i WHERE i.ecom_order_id = o.id);
