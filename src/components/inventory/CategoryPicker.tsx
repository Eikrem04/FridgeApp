import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { CategoryIcon } from '../../lib/icons'

interface CategoryPickerProps {
  value: string
  onChange: (categoryId: string) => void
}

export const CategoryPicker = ({ value, onChange }: CategoryPickerProps) => {
  const categories = useStore((s) => s.categories)
  const addCategory = useStore((s) => s.addCategory)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const submitNew = async () => {
    const name = newName.trim()
    if (!name) {
      setAdding(false)
      return
    }
    setAdding(false)
    setNewName('')
    const id = await addCategory(name)
    onChange(id)
  }

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(cat.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition ${
            value === cat.id ? 'bg-[var(--color-accent)] text-white' : 'bg-black/[0.05] text-[var(--color-ink)] dark:bg-white/10'
          }`}
        >
          <CategoryIcon name={cat.icon} size={15} />
          {cat.name}
        </button>
      ))}
      {adding ? (
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={submitNew}
          onKeyDown={(e) => e.key === 'Enter' && submitNew()}
          placeholder="Category name"
          className="w-32 shrink-0 rounded-full bg-black/[0.05] px-3.5 py-2 text-[13.5px] outline-none dark:bg-white/10"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex shrink-0 items-center gap-1 rounded-full bg-black/[0.05] px-3 py-2 text-[13.5px] font-semibold text-[var(--color-ink-dim)] dark:bg-white/10"
        >
          <Plus size={14} /> New
        </button>
      )}
    </div>
  )
}
