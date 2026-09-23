-- Fixes a cross-device lost-update race on inventory item quantity.
--
-- Root cause (client-side, see src/store/useStore.ts's changeQuantity): the
-- client read the item's current quantity from its own local store, computed
-- `nextQuantity = previous.quantity + delta` in JavaScript, and wrote that
-- ABSOLUTE number back with `update inventory_items set quantity = ...`. Two
-- devices decrementing the same item at nearly the same time both read the
-- same stale starting value and both write the same (wrong) result — e.g.
-- two devices independently decrementing a quantity of 5 both compute 4 and
-- write 4, instead of the correct 3.
--
-- Fix: move the read-modify-write into a single atomic SQL statement inside
-- a Postgres function, so the database — not the client — computes the new
-- value from whatever the row's CURRENT value is at the moment of the
-- update. `update ... set quantity = greatest(0, quantity + p_delta)` takes
-- a row lock for the statement's duration; a concurrent call for the same
-- row simply waits for that lock and then applies its own delta on top of
-- the already-updated value, so concurrent deltas always sum correctly
-- regardless of arrival order. `greatest(0, ...)` clamps at zero so quantity
-- can never go negative, matching the app's existing client-side clamp.
--
-- Security: this function is `security invoker` (the Postgres default, kept
-- explicit here for clarity) — it runs as the calling `authenticated` role,
-- not as a privileged definer, so the table's existing RLS policy
-- (`inventory_items_owner`, from 0001_init.sql: `using (auth.uid() = user_id)`)
-- still applies to its UPDATE exactly as if the client had issued the UPDATE
-- directly. The explicit `and user_id = auth.uid()` below is redundant with
-- that RLS policy by design — defense in depth, and it documents the
-- ownership check in the function body itself rather than relying solely on
-- an external policy. The item id is the only thing the client supplies;
-- ownership is always derived from auth.uid(), never from a client-supplied
-- user id. No service-role key or SECURITY DEFINER bypass is used anywhere.

create or replace function public.adjust_inventory_item_quantity(p_item_id uuid, p_delta numeric)
returns numeric
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_new_quantity numeric;
begin
  update public.inventory_items
  set quantity = greatest(0, quantity + p_delta)
  where id = p_item_id
    and user_id = auth.uid()
  returning quantity into v_new_quantity;

  if not found then
    raise exception 'Inventory item not found or not owned by the current user'
      using errcode = 'P0002';
  end if;

  return v_new_quantity;
end;
$$;

-- Postgres grants EXECUTE to PUBLIC by default on a newly created function —
-- revoke that and grant only to `authenticated`, matching 0002_fix_grants.sql's
-- "never anon, only the exact privilege needed" convention.
revoke all on function public.adjust_inventory_item_quantity(uuid, numeric) from public;
grant execute on function public.adjust_inventory_item_quantity(uuid, numeric) to authenticated;
