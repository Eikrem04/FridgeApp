import { describe, expect, it } from 'vitest'
import type { TFunction } from 'i18next'
import { getStorageDisplayName } from './storageTypes'
import type { StorageUnit } from '../types'

// A minimal stub standing in for i18next's TFunction — no need to boot the
// real i18n instance to test pure display-name logic.
const STORAGE_LABELS: Record<string, string> = {
  'common:storageType.fridge': 'Kjøleskap',
  'common:storageType.freezer': 'Fryser',
  'common:storageType.pantry': 'Tørrvarelager',
}
const t = ((key: string) => STORAGE_LABELS[key] ?? key) as TFunction

const unit = (overrides: Partial<StorageUnit>): StorageUnit => ({
  id: 'u1',
  name: 'Fridge',
  type: 'fridge',
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

describe('getStorageDisplayName — built-in defaults are localized', () => {
  it('translates an untouched English default name', () => {
    expect(getStorageDisplayName(unit({ name: 'Fridge', type: 'fridge' }), t)).toBe('Kjøleskap')
    expect(getStorageDisplayName(unit({ name: 'Freezer', type: 'freezer' }), t)).toBe('Fryser')
    expect(getStorageDisplayName(unit({ name: 'Pantry', type: 'pantry' }), t)).toBe('Tørrvarelager')
  })

  it('recognizes an untouched default created while onboarding in Norwegian too', () => {
    expect(getStorageDisplayName(unit({ name: 'Kjøleskap', type: 'fridge' }), t)).toBe('Kjøleskap')
  })

  it('preserves the numbered suffix for multi-unit onboarding names', () => {
    expect(getStorageDisplayName(unit({ name: 'Fridge 2', type: 'fridge' }), t)).toBe('Kjøleskap 2')
    expect(getStorageDisplayName(unit({ name: 'Kjøleskap 3', type: 'fridge' }), t)).toBe('Kjøleskap 3')
  })
})

describe('getStorageDisplayName — custom names are never translated or altered', () => {
  it('returns a custom name exactly as stored', () => {
    expect(getStorageDisplayName(unit({ name: 'Garage Freezer', type: 'freezer' }), t)).toBe('Garage Freezer')
  })

  it('does not accidentally match a default name for the wrong storage type', () => {
    // "Fridge" is only a recognized default for type 'fridge', not 'freezer'.
    expect(getStorageDisplayName(unit({ name: 'Fridge', type: 'freezer' }), t)).toBe('Fridge')
  })

  it('treats a non-numeric suffix as a genuine custom name, not a numbered default', () => {
    expect(getStorageDisplayName(unit({ name: 'Fridge Downstairs', type: 'fridge' }), t)).toBe('Fridge Downstairs')
  })
})
