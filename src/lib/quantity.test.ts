import { describe, expect, it } from 'vitest'
import { clampQuantity } from './quantity'

describe('clampQuantity', () => {
  it('applies a positive delta normally', () => {
    expect(clampQuantity(2, 1)).toBe(3)
  })

  it('applies a negative delta normally when it stays at or above zero', () => {
    expect(clampQuantity(5, -1)).toBe(4)
    expect(clampQuantity(1, -1)).toBe(0)
  })

  it('never goes below zero, even with a large negative delta', () => {
    expect(clampQuantity(3, -10)).toBe(0)
    expect(clampQuantity(0, -1)).toBe(0)
  })
})
