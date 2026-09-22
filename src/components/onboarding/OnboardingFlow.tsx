import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Refrigerator } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../../store/useStore'
import { Button } from '../ui/Button'
import { Stepper } from '../ui/Stepper'
import { TextInput } from '../ui/Field'
import { STORAGE_TYPE_META } from '../../lib/storageTypes'
import type { StorageType } from '../../types'

type Step = 'welcome' | 'counts' | 'names'

export const OnboardingFlow = () => {
  const { t } = useTranslation('onboarding')
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const updateSettings = useStore((s) => s.updateSettings)
  const [step, setStep] = useState<Step>('welcome')
  const [fridgeCount, setFridgeCount] = useState(1)
  const [freezerCount, setFreezerCount] = useState(1)
  const [pantryCount, setPantryCount] = useState(1)
  const [userName, setUserName] = useState('')

  const unitDrafts = useMemo(() => {
    const draftsFor = (type: StorageType, count: number) =>
      Array.from({ length: count }, (_, i) => ({
        key: `${type}-${i}`,
        type,
        defaultName: count === 1 ? t(`common:storageType.${type}`) : `${t(`common:storageType.${type}`)} ${i + 1}`,
      }))
    return [...draftsFor('fridge', fridgeCount), ...draftsFor('freezer', freezerCount), ...draftsFor('pantry', pantryCount)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fridgeCount, freezerCount, pantryCount])

  const [names, setNames] = useState<Record<string, string>>({})
  const [finishing, setFinishing] = useState(false)

  const goToNames = () => {
    const initial: Record<string, string> = {}
    for (const u of unitDrafts) initial[u.key] = u.defaultName
    setNames(initial)
    setStep('names')
  }

  const finish = async () => {
    setFinishing(true)
    if (userName.trim()) await updateSettings({ userName: userName.trim() })
    await completeOnboarding(unitDrafts.map((u) => ({ name: (names[u.key] || u.defaultName).trim(), type: u.type })))
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--color-bg)]">
      <div className="safe-top safe-bottom mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[var(--color-accent)] text-white shadow-xl shadow-[var(--color-accent)]/20">
                <Refrigerator size={36} />
              </span>
              <h1 className="text-[30px] font-bold tracking-tight text-[var(--color-ink)]">{t('welcome.heading')}</h1>
              <p className="mt-3 text-[16px] leading-relaxed text-[var(--color-ink-dim)]">{t('welcome.subtitle')}</p>

              <div className="mt-8 w-full">
                <TextInput
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={t('welcome.namePlaceholder')}
                  className="text-center"
                />
              </div>

              <Button fullWidth size="lg" className="mt-6" onClick={() => setStep('counts')}>
                {t('welcome.getStarted')}
              </Button>
            </motion.div>
          )}

          {step === 'counts' && (
            <motion.div
              key="counts"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col"
            >
              <h1 className="text-[26px] font-bold tracking-tight text-[var(--color-ink)]">{t('counts.heading')}</h1>
              <p className="mt-2 text-[15px] text-[var(--color-ink-dim)]">{t('counts.subtitle')}</p>

              <div className="mt-8 flex flex-col gap-3">
                {(
                  [
                    { type: 'fridge', pluralLabel: t('counts.refrigerators'), count: fridgeCount, setCount: setFridgeCount },
                    { type: 'freezer', pluralLabel: t('counts.freezers'), count: freezerCount, setCount: setFreezerCount },
                    { type: 'pantry', pluralLabel: t('counts.pantries'), count: pantryCount, setCount: setPantryCount },
                  ] as const
                ).map(({ type, pluralLabel, count, setCount }) => {
                  const meta = STORAGE_TYPE_META[type]
                  const Icon = meta.icon
                  return (
                    <div key={type} className="flex items-center justify-between rounded-3xl bg-[var(--color-surface)] p-5">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${meta.bg} ${meta.text}`}>
                          <Icon size={20} />
                        </span>
                        <span className="text-[16px] font-semibold text-[var(--color-ink)]">{pluralLabel}</span>
                      </div>
                      <Stepper value={count} onChange={setCount} min={0} max={6} />
                    </div>
                  )
                })}
              </div>

              <Button
                fullWidth
                size="lg"
                className="mt-8"
                disabled={fridgeCount + freezerCount + pantryCount === 0}
                onClick={goToNames}
              >
                {t('counts.continue')}
              </Button>
              {fridgeCount + freezerCount + pantryCount === 0 && (
                <p className="mt-2 text-center text-[13px] text-[var(--color-ink-faint)]">{t('counts.addAtLeastOne')}</p>
              )}
            </motion.div>
          )}

          {step === 'names' && (
            <motion.div
              key="names"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col"
            >
              <h1 className="text-[26px] font-bold tracking-tight text-[var(--color-ink)]">{t('names.heading')}</h1>
              <p className="mt-2 text-[15px] text-[var(--color-ink-dim)]">{t('names.subtitle')}</p>

              <div className="mt-6 flex max-h-[46vh] flex-col gap-3 overflow-y-auto pr-0.5">
                {unitDrafts.map((u) => {
                  const meta = STORAGE_TYPE_META[u.type]
                  const Icon = meta.icon
                  return (
                  <div key={u.key} className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.bg} ${meta.text}`}>
                      <Icon size={19} />
                    </span>
                    <TextInput
                      value={names[u.key] ?? u.defaultName}
                      onChange={(e) => setNames((prev) => ({ ...prev, [u.key]: e.target.value }))}
                    />
                  </div>
                  )
                })}
              </div>

              <Button fullWidth size="lg" className="mt-8" onClick={finish} disabled={finishing}>
                {finishing ? t('names.finishing') : t('names.finish')}
              </Button>
              <button
                type="button"
                onClick={() => setStep('counts')}
                className="mt-3 text-center text-[14px] font-medium text-[var(--color-ink-dim)]"
              >
                {t('names.back')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
