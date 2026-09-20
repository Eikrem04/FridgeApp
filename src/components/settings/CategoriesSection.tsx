import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { SettingsSection } from './SettingsSection'
import { CategoryIcon } from '../../lib/icons'
import { TextInput } from '../ui/Field'

export const CategoriesSection = () => {
  const categories = useStore((s) => s.categories)
  const addCategory = useStore((s) => s.addCategory)
  const deleteCategory = useStore((s) => s.deleteCategory)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const submit = () => {
    const trimmed = name.trim()
    if (trimmed) addCategory(trimmed)
    setName('')
    setAdding(false)
  }

  return (
    <SettingsSection title="Categories">
      <div className="flex flex-wrap gap-2 p-4">
        {categories.map((cat) => (
          <span
            key={cat.id}
            className="flex items-center gap-1.5 rounded-full bg-black/[0.05] py-1.5 pl-3 pr-1.5 text-[13.5px] font-medium text-[var(--color-ink)] dark:bg-white/10"
          >
            <CategoryIcon name={cat.icon} size={14} />
            {cat.name}
            {cat.isCustom && (
              <button
                type="button"
                onClick={() => deleteCategory(cat.id)}
                className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-black/10"
              >
                <Trash2 size={11} />
              </button>
            )}
          </span>
        ))}
        {adding ? (
          <TextInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={submit}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Category name"
            className="!w-36 !py-1.5 !text-[13.5px]"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-3 py-1.5 text-[13.5px] font-semibold text-[var(--color-accent)]"
          >
            <Plus size={13} /> New
          </button>
        )}
      </div>
    </SettingsSection>
  )
}
