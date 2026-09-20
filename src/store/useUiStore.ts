import { create } from 'zustand'

interface UiState {
  selectedItemId: string | null
  openItem: (id: string) => void
  closeItem: () => void
}

export const useUiStore = create<UiState>((set) => ({
  selectedItemId: null,
  openItem: (id) => set({ selectedItemId: id }),
  closeItem: () => set({ selectedItemId: null }),
}))
