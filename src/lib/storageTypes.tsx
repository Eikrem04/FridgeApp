import { Refrigerator, Snowflake, Archive, type LucideIcon } from 'lucide-react'
import type { StorageType } from '../types'

interface StorageTypeMeta {
  label: string
  icon: LucideIcon
  bg: string
  text: string
}

/**
 * Single source of truth for how each storage type looks/reads across the
 * app (Home cards, storage detail, settings, onboarding) — adding a type
 * here is enough for it to "just work" everywhere that already renders
 * from this map, instead of each screen re-implementing its own
 * fridge/freezer/pantry branch.
 */
export const STORAGE_TYPE_META: Record<StorageType, StorageTypeMeta> = {
  fridge: {
    label: 'Fridge',
    icon: Refrigerator,
    bg: 'bg-[var(--color-accent-soft)]',
    text: 'text-[var(--color-accent)]',
  },
  freezer: {
    label: 'Freezer',
    icon: Snowflake,
    bg: 'bg-[var(--color-frozen-soft)]',
    text: 'text-[var(--color-frozen)]',
  },
  pantry: {
    label: 'Pantry',
    icon: Archive,
    bg: 'bg-[var(--color-pantry-soft)]',
    text: 'text-[var(--color-pantry)]',
  },
}

export const STORAGE_TYPE_OPTIONS: { value: StorageType; label: string }[] = [
  { value: 'fridge', label: STORAGE_TYPE_META.fridge.label },
  { value: 'freezer', label: STORAGE_TYPE_META.freezer.label },
  { value: 'pantry', label: STORAGE_TYPE_META.pantry.label },
]
