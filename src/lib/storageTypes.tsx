import { Refrigerator, Snowflake, Archive, type LucideIcon } from 'lucide-react'
import type { TFunction } from 'i18next'
import type { StorageType, StorageUnit } from '../types'

interface StorageTypeStyle {
  icon: LucideIcon
  bg: string
  text: string
}

/**
 * Icon/color only — not translatable content, safe to keep static. Display
 * labels are resolved separately via `t()` so they follow the active
 * language (see `getStorageDisplayName` below).
 */
export const STORAGE_TYPE_META: Record<StorageType, StorageTypeStyle> = {
  fridge: {
    icon: Refrigerator,
    bg: 'bg-[var(--color-accent-soft)]',
    text: 'text-[var(--color-accent)]',
  },
  freezer: {
    icon: Snowflake,
    bg: 'bg-[var(--color-frozen-soft)]',
    text: 'text-[var(--color-frozen)]',
  },
  pantry: {
    icon: Archive,
    bg: 'bg-[var(--color-pantry-soft)]',
    text: 'text-[var(--color-pantry)]',
  },
}

export const getStorageTypeOptions = (t: TFunction): { value: StorageType; label: string }[] => [
  { value: 'fridge', label: t('common:storageType.fridge') },
  { value: 'freezer', label: t('common:storageType.freezer') },
  { value: 'pantry', label: t('common:storageType.pantry') },
]

/**
 * The exact default names onboarding/backfill have ever created a storage
 * unit with, in every supported language — a plain unit is created with
 * one of these names verbatim (e.g. "Fridge", or "Kjøleskap" for someone
 * who onboarded in Norwegian), never anything else. Used only to recognize
 * an untouched default for display purposes; the database row itself is
 * never renamed.
 */
const CANONICAL_DEFAULT_NAMES: Record<StorageType, string[]> = {
  fridge: ['Fridge', 'Kjøleskap'],
  freezer: ['Freezer', 'Fryser'],
  pantry: ['Pantry', 'Tørrvarelager'],
}

const matchCanonicalDefaultName = (name: string, type: StorageType): { suffix: string | null } | null => {
  const trimmed = name.trim()
  for (const canonical of CANONICAL_DEFAULT_NAMES[type]) {
    if (trimmed === canonical) return { suffix: null }
    // Multi-unit onboarding names, e.g. "Fridge 2" / "Kjøleskap 2".
    const numbered = trimmed.match(/^(.+)\s(\d+)$/)
    if (numbered && numbered[1] === canonical) return { suffix: numbered[2] }
  }
  return null
}

/**
 * Display name for a storage unit: an untouched built-in default (matched
 * by exact name, in any supported language — see above) is shown using the
 * current language's translated label, e.g. "Fridge" → "Kjøleskap". Any
 * other name — a genuine user customization, in any language — is shown
 * exactly as stored, never translated, never altered. The underlying
 * database row's `name` and `type` are never written to for this purpose.
 */
export const getStorageDisplayName = (unit: StorageUnit, t: TFunction): string => {
  const match = matchCanonicalDefaultName(unit.name, unit.type)
  if (!match) return unit.name
  const label = t(`common:storageType.${unit.type}`)
  return match.suffix ? `${label} ${match.suffix}` : label
}
