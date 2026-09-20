import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Refrigerator, Snowflake } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Button } from '../ui/Button'
import { Stepper } from '../ui/Stepper'
import { TextInput } from '../ui/Field'

type Step = 'welcome' | 'counts' | 'names'

export const OnboardingFlow = () => {
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const updateSettings = useStore((s) => s.updateSettings)
  const [step, setStep] = useState<Step>('welcome')
  const [fridgeCount, setFridgeCount] = useState(1)
  const [freezerCount, setFreezerCount] = useState(1)
  const [userName, setUserName] = useState('')

  const unitDrafts = useMemo(() => {
    const fridges = Array.from({ length: fridgeCount }, (_, i) => ({
      key: `fridge-${i}`,
      type: 'fridge' as const,
      defaultName: fridgeCount === 1 ? 'Fridge' : `Fridge ${i + 1}`,
    }))
    const freezers = Array.from({ length: freezerCount }, (_, i) => ({
      key: `freezer-${i}`,
      type: 'freezer' as const,
      defaultName: freezerCount === 1 ? 'Freezer' : `Freezer ${i + 1}`,
    }))
    return [...fridges, ...freezers]
  }, [fridgeCount, freezerCount])

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
              <h1 className="text-[30px] font-bold tracking-tight text-[var(--color-ink)]">Welcome to Kitchen</h1>
              <p className="mt-3 text-[16px] leading-relaxed text-[var(--color-ink-dim)]">
                Keep track of everything in your fridge and freezer — never let food go to waste again.
              </p>

              <div className="mt-8 w-full">
                <TextInput
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="text-center"
                />
              </div>

              <Button fullWidth size="lg" className="mt-6" onClick={() => setStep('counts')}>
                Get started
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
              <h1 className="text-[26px] font-bold tracking-tight text-[var(--color-ink)]">Set up your kitchen</h1>
              <p className="mt-2 text-[15px] text-[var(--color-ink-dim)]">Tell us how many storage units you have. You can change this anytime.</p>

              <div className="mt-8 flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-3xl bg-[var(--color-surface)] p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                      <Refrigerator size={20} />
                    </span>
                    <span className="text-[16px] font-semibold text-[var(--color-ink)]">Refrigerators</span>
                  </div>
                  <Stepper value={fridgeCount} onChange={setFridgeCount} min={0} max={6} />
                </div>

                <div className="flex items-center justify-between rounded-3xl bg-[var(--color-surface)] p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-frozen-soft)] text-[var(--color-frozen)]">
                      <Snowflake size={20} />
                    </span>
                    <span className="text-[16px] font-semibold text-[var(--color-ink)]">Freezers</span>
                  </div>
                  <Stepper value={freezerCount} onChange={setFreezerCount} min={0} max={6} />
                </div>
              </div>

              <Button fullWidth size="lg" className="mt-8" disabled={fridgeCount + freezerCount === 0} onClick={goToNames}>
                Continue
              </Button>
              {fridgeCount + freezerCount === 0 && (
                <p className="mt-2 text-center text-[13px] text-[var(--color-ink-faint)]">Add at least one fridge or freezer</p>
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
              <h1 className="text-[26px] font-bold tracking-tight text-[var(--color-ink)]">Name your storage</h1>
              <p className="mt-2 text-[15px] text-[var(--color-ink-dim)]">Give each one a name you'll recognize.</p>

              <div className="mt-6 flex max-h-[46vh] flex-col gap-3 overflow-y-auto pr-0.5">
                {unitDrafts.map((u) => (
                  <div key={u.key} className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        u.type === 'fridge' ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'bg-[var(--color-frozen-soft)] text-[var(--color-frozen)]'
                      }`}
                    >
                      {u.type === 'fridge' ? <Refrigerator size={19} /> : <Snowflake size={19} />}
                    </span>
                    <TextInput
                      value={names[u.key] ?? u.defaultName}
                      onChange={(e) => setNames((prev) => ({ ...prev, [u.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <Button fullWidth size="lg" className="mt-8" onClick={finish} disabled={finishing}>
                {finishing ? 'Setting up…' : 'Start using Kitchen'}
              </Button>
              <button
                type="button"
                onClick={() => setStep('counts')}
                className="mt-3 text-center text-[14px] font-medium text-[var(--color-ink-dim)]"
              >
                Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
