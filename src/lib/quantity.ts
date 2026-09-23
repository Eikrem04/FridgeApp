/**
 * Applies a +/- delta to a quantity, clamped at 0 — the same clamp the
 * database enforces atomically in adjust_inventory_item_quantity (see
 * supabase/migrations/0008_atomic_inventory_quantity.sql). This client-side
 * copy is only ever used for the optimistic UI guess; the database's own
 * clamp is the authoritative one.
 */
export const clampQuantity = (current: number, delta: number): number => Math.max(0, current + delta)
