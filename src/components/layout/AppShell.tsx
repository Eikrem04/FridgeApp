import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { ItemDetailSheet } from '../inventory/ItemDetailSheet'
import { Toaster } from '../ui/Toaster'

export const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Sidebar />
      <div className="md:pl-64">
        <div className="mx-auto max-w-2xl">{children}</div>
      </div>
      <BottomNav />
      <ItemDetailSheet />
      <Toaster />
    </div>
  )
}
