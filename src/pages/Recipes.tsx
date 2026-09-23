import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChefHat, Loader2, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { TopBar } from '../components/layout/TopBar'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Segmented'
import { RecipeCard } from '../components/recipes/RecipeCard'
import { RecipeDetailSheet } from '../components/recipes/RecipeDetailSheet'
import { OfflineSuggestions } from '../components/recipes/OfflineSuggestions'
import { RecipePreferencesQuiz } from '../components/recipes/RecipePreferencesQuiz'
import { getUseSoonItems } from '../lib/selectors'
import { searchRecipes, getSuggestions, computeRecipeMatch } from '../lib/recipeService'
import { uniqueItemNames } from '../lib/recipeIngredients'
import type { ApiRecipe, RecipeMatch } from '../types/recipe'

type AsyncState<T> = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error' }

type Tab = 'suggestions' | 'search'
type SuggestionFilter = 'all' | 'dinner' | 'useSoon'

export const Recipes = () => {
  const { t } = useTranslation('recipes')
  const items = useStore((s) => s.items)
  const expiringSoonDays = useStore((s) => s.settings.expiration.expiringSoonDays)
  const preferences = useStore((s) => s.settings.recipePreferences)

  const [tab, setTab] = useState<Tab>('suggestions')
  const [query, setQuery] = useState('')
  const [searchState, setSearchState] = useState<AsyncState<ApiRecipe[]>>({ status: 'idle' })
  const [suggestState, setSuggestState] = useState<AsyncState<RecipeMatch[]>>({ status: 'idle' })
  const [suggestRetryToken, setSuggestRetryToken] = useState(0)
  const [suggestionFilter, setSuggestionFilter] = useState<SuggestionFilter>('all')
  const [selectedMatch, setSelectedMatch] = useState<RecipeMatch | null>(null)
  // Opens once, only if the user has never completed or skipped the quiz — see RecipePreferencesQuiz.
  const [quizOpen, setQuizOpen] = useState(() => !preferences.setupSeen)

  const searchRequestId = useRef(0)
  const searchController = useRef<AbortController | null>(null)

  const useSoon = useMemo(() => getUseSoonItems(items, expiringSoonDays, items.length), [items, expiringSoonDays])
  const ownedNames = useMemo(() => uniqueItemNames(items), [items])
  const useSoonNames = useMemo(() => uniqueItemNames(useSoon), [useSoon])
  // Only the fields that actually affect ranking/filtering — cookingTime and householdSize don't (see report).
  const preferenceRankingKey = `${preferences.mealInterests.join(',')}|${preferences.inventoryImportance}|${preferences.dietary}`

  useEffect(() => {
    if (tab !== 'suggestions' || items.length === 0) return
    const controller = new AbortController()
    let cancelled = false
    setSuggestState({ status: 'loading' })
    getSuggestions(items, useSoon, preferences, controller.signal)
      .then((matches) => {
        if (!cancelled) setSuggestState({ status: 'success', data: matches })
      })
      .catch(() => {
        if (!cancelled) setSuggestState({ status: 'error' })
      })
    return () => {
      cancelled = true
      controller.abort()
    }
    // Re-fetch when the tab is opened, retried, or the ranking-relevant preferences change —
    // other inventory content changes are picked up next time this effect runs, avoiding a
    // network call on every item edit. Cached ingredient/detail lookups make a preference-only
    // re-run cheap (no new API calls in the common case).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, suggestRetryToken, items.length > 0, preferenceRankingKey])

  useEffect(() => {
    return () => searchController.current?.abort()
  }, [])

  const submitSearch = () => {
    const q = query.trim()
    if (!q) return
    searchController.current?.abort()
    const controller = new AbortController()
    searchController.current = controller
    const requestId = ++searchRequestId.current
    setSearchState({ status: 'loading' })
    searchRecipes(q, controller.signal)
      .then((results) => {
        if (searchRequestId.current !== requestId) return
        setSearchState({ status: 'success', data: results })
      })
      .catch(() => {
        if (searchRequestId.current !== requestId) return
        setSearchState({ status: 'error' })
      })
  }

  const searchMatches = useMemo(() => {
    if (searchState.status !== 'success') return []
    return searchState.data.map((recipe) => computeRecipeMatch(recipe, ownedNames, useSoonNames))
  }, [searchState, ownedNames, useSoonNames])

  // Client-side only — no re-fetch, just narrows the already-ranked suggestion list.
  const filteredSuggestions = useMemo(() => {
    if (suggestState.status !== 'success') return []
    if (suggestionFilter === 'dinner') return suggestState.data.filter((m) => m.mealClass === 'main')
    if (suggestionFilter === 'useSoon') return suggestState.data.filter((m) => m.usesSoonCount > 0)
    return suggestState.data
  }, [suggestState, suggestionFilter])

  return (
    <div className="pb-28 md:pb-12">
      <TopBar title={t('title')} />
      <div className="px-5 md:px-8">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'suggestions', label: t('tabs.suggestions') },
            { value: 'search', label: t('tabs.search') },
          ]}
        />

        <div className="mt-5">
          {tab === 'search' && (
            <>
              <div className="mb-5 flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-2xl bg-black/[0.04] px-4 py-3.5 dark:bg-white/[0.06]">
                  <Search size={17} className="shrink-0 text-[var(--color-ink-faint)]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                    placeholder={t('search.placeholder')}
                    className="w-full bg-transparent text-[16px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
                  />
                  {query && (
                    <button type="button" onClick={() => setQuery('')} aria-label={t('common:actions.close')}>
                      <X size={16} className="text-[var(--color-ink-faint)]" />
                    </button>
                  )}
                </div>
                <Button size="md" onClick={submitSearch} disabled={!query.trim()}>
                  {t('search.submit')}
                </Button>
              </div>

              {searchState.status === 'idle' && (
                <EmptyState icon={<Search size={26} />} title={t('search.emptyTitle')} subtitle={t('search.emptySubtitle')} />
              )}
              {searchState.status === 'loading' && (
                <div className="flex flex-col items-center justify-center gap-3 py-16">
                  <Loader2 size={24} className="animate-spin text-[var(--color-ink-dim)]" />
                </div>
              )}
              {searchState.status === 'error' && (
                <EmptyState
                  icon={<AlertTriangle size={26} />}
                  title={t('search.errorTitle')}
                  subtitle={t('search.errorSubtitle')}
                  action={<Button onClick={submitSearch}>{t('search.retry')}</Button>}
                />
              )}
              {searchState.status === 'success' && searchMatches.length === 0 && (
                <EmptyState icon={<ChefHat size={26} />} title={t('search.noResultsTitle')} subtitle={t('search.noResultsSubtitle')} />
              )}
              {searchState.status === 'success' && searchMatches.length > 0 && (
                <div className="flex flex-col gap-3">
                  {searchMatches.map((match, i) => (
                    <RecipeCard key={match.recipe.id} match={match} index={i} onClick={() => setSelectedMatch(match)} />
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'suggestions' && (
            <>
              {items.length === 0 ? (
                <EmptyState icon={<ChefHat size={26} />} title={t('suggestions.noItemsTitle')} subtitle={t('suggestions.noItemsSubtitle')} />
              ) : (
                <>
                  {suggestState.status === 'loading' && (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                      <Loader2 size={24} className="animate-spin text-[var(--color-ink-dim)]" />
                      <p className="text-[14.5px] text-[var(--color-ink-dim)]">{t('suggestions.loadingTitle')}</p>
                    </div>
                  )}
                  {suggestState.status === 'error' && (
                    <div className="flex flex-col gap-6">
                      <EmptyState
                        icon={<AlertTriangle size={26} />}
                        title={t('suggestions.errorTitle')}
                        subtitle={t('suggestions.errorSubtitle')}
                        action={<Button onClick={() => setSuggestRetryToken((n) => n + 1)}>{t('suggestions.retry')}</Button>}
                      />
                      <OfflineSuggestions items={items} />
                    </div>
                  )}
                  {suggestState.status === 'success' && suggestState.data.length === 0 && (
                    <EmptyState
                      icon={<ChefHat size={26} />}
                      title={t('suggestions.noMatchesTitle')}
                      subtitle={
                        preferences.avoidedIngredients.length > 0
                          ? t('suggestions.noMatchesWithAvoidedSubtitle')
                          : t('suggestions.noMatchesSubtitle')
                      }
                    />
                  )}
                  {suggestState.status === 'success' && suggestState.data.length > 0 && (
                    <>
                      <div className="mb-4 flex gap-2 overflow-x-auto">
                        {(
                          [
                            { value: 'all', label: t('filters.forYou') },
                            { value: 'dinner', label: t('filters.dinner') },
                            { value: 'useSoon', label: t('filters.useSoon') },
                          ] as const
                        ).map((f) => (
                          <button
                            key={f.value}
                            type="button"
                            onClick={() => setSuggestionFilter(f.value)}
                            className={`shrink-0 rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition ${
                              suggestionFilter === f.value
                                ? 'bg-[var(--color-accent)] text-white'
                                : 'bg-black/[0.05] text-[var(--color-ink-dim)] dark:bg-white/10'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                      {filteredSuggestions.length === 0 ? (
                        <EmptyState icon={<ChefHat size={26} />} title={t('suggestions.noMatchesTitle')} subtitle={t('suggestions.noMatchesSubtitle')} />
                      ) : (
                        <div className="flex flex-col gap-3">
                          {filteredSuggestions.map((match, i) => (
                            <RecipeCard key={match.recipe.id} match={match} index={i} onClick={() => setSelectedMatch(match)} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <RecipeDetailSheet match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      <RecipePreferencesQuiz open={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  )
}
