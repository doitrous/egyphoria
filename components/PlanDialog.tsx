'use client'

import { useEffect, useRef, useState } from 'react'
import { planText, type PlanDay, type PlanDetails } from '@/lib/itinerary'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = any

/**
 * The itinerary dialog: edit -> details -> a downloadable document. Ported from the old static
 * build's src/client/itinerary.js as one React client component (mounted once, in [lang]/layout,
 * same pattern as <ShareBlock/>) instead of that file's direct DOM manipulation. Any page opens
 * it by dispatching a `window` CustomEvent named "egyphoria:start-plan" with a `PlanDay[]` detail
 * — the home page's builder form and every trip page's "make it mine" button do this — which
 * keeps the (fairly large) dialog markup out of every page that can trigger it.
 *
 * ponytail: the old build rendered a fully branded, separately-styled document in a hidden
 * iframe so `window.print()` produced a nice PDF without printing the whole page chrome. This
 * version prints the dialog itself under a `@media print` rule in styles.css instead — one
 * fewer moving part, at the cost of the standalone letterhead styling. Upgrade back to a
 * dedicated print document if the plain dialog printout looks wrong in review.
 */
export default function PlanDialog({ lang, dict }: { lang: string; dict: Dict }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [plan, setPlan] = useState<PlanDay[]>([])
  const [details, setDetails] = useState<PlanDetails>({})
  const [view, setView] = useState<'edit' | 'details' | 'done'>('edit')

  function t(key: string, vars?: Record<string, string | number>): string {
    const lookup = (d: Dict) => key.split('.').reduce((o: Dict, k: string) => (o == null ? o : o[k]), d)
    const value = lookup(dict) ?? key
    return String(value).replace(/\{(\w+)\}/g, (_m, k) => (vars && k in vars ? String(vars[k]) : `{${k}}`))
  }

  useEffect(() => {
    function onStart(e: Event) {
      const detail = (e as CustomEvent<PlanDay[]>).detail
      setPlan(detail.map((d) => ({ ...d, activities: [...d.activities] })))
      setDetails({})
      setView('edit')
      dialogRef.current?.showModal()
      document.body.classList.add('modal-open')
    }
    window.addEventListener('egyphoria:start-plan', onStart)
    return () => window.removeEventListener('egyphoria:start-plan', onStart)
  }, [])

  function close() {
    dialogRef.current?.close()
    document.body.classList.remove('modal-open')
  }

  function updateActivity(dayIndex: number, activityIndex: number, value: string) {
    setPlan((prev) => prev.map((d, di) => (di !== dayIndex ? d : { ...d, activities: d.activities.map((a, ai) => (ai === activityIndex ? value : a)) })))
  }
  function moveActivity(dayIndex: number, activityIndex: number, dir: -1 | 1) {
    setPlan((prev) =>
      prev.map((d, di) => {
        if (di !== dayIndex) return d
        const activities = [...d.activities]
        const target = activityIndex + dir
        if (target < 0 || target >= activities.length) return d
        ;[activities[activityIndex], activities[target]] = [activities[target], activities[activityIndex]]
        return { ...d, activities }
      }),
    )
  }
  function removeActivity(dayIndex: number, activityIndex: number) {
    setPlan((prev) => prev.map((d, di) => (di !== dayIndex ? d : { ...d, activities: d.activities.filter((_, ai) => ai !== activityIndex) })))
  }
  function addActivity(dayIndex: number) {
    setPlan((prev) => prev.map((d, di) => (di !== dayIndex ? d : { ...d, activities: [...d.activities, ''] })))
  }

  function summary(): string {
    const names = [...new Set(plan.map((d) => d.title))]
    return `${plan.length} ${plan.length === 1 ? t('journeys.day') : t('journeys.days')} · ${names.join(' → ')}`
  }

  function downloadTxt() {
    const blob = new Blob([planText(t, plan, details)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'My-Egyphoria-Itinerary.txt'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <dialog
      ref={dialogRef}
      id="plan-dialog"
      className="plan-dialog"
      aria-labelledby="plan-dialog-title"
      lang={lang}
      onClick={(e) => {
        if (e.target === dialogRef.current) close()
      }}
      onClose={() => document.body.classList.remove('modal-open')}
    >
      <button type="button" className="dialog-close" onClick={close} aria-label="Close">
        ×
      </button>

      {view === 'edit' && (
        <section data-view="edit">
          <p className="dialog-eyebrow">{t('plan.eyebrow')}</p>
          <h2 id="plan-dialog-title">{t('plan.title')}</h2>
          <p id="plan-summary">{summary()}</p>
          <p className="plan-help">{t('plan.help')}</p>
          <div id="plan-days">
            {plan.map((day, di) => (
              <section className="plan-day" key={di}>
                <div className="day-heading">
                  <span>
                    {t('plan.day')} {String(di + 1).padStart(2, '0')}
                  </span>
                  <h3>{day.title}</h3>
                </div>
                <ol className="activities">
                  {day.activities.map((activity, ai) => (
                    <li className="activity" key={ai}>
                      <textarea
                        rows={2}
                        aria-label={`${t('plan.day')} ${di + 1}, ${ai + 1}`}
                        maxLength={1000}
                        value={activity}
                        onChange={(e) => updateActivity(di, ai, e.target.value)}
                      />
                      <div className="activity-actions">
                        <button type="button" disabled={ai === 0} onClick={() => moveActivity(di, ai, -1)} aria-label="Move up">
                          ↑
                        </button>
                        <button type="button" disabled={ai === day.activities.length - 1} onClick={() => moveActivity(di, ai, 1)} aria-label="Move down">
                          ↓
                        </button>
                        <button type="button" onClick={() => removeActivity(di, ai)} aria-label="Remove">
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
                <button type="button" className="add-activity" onClick={() => addActivity(di)}>
                  {t('plan.addExperience')}
                </button>
              </section>
            ))}
          </div>
          <p className="plan-keep-copy">{t('plan.keepCopy')}</p>
          <div className="dialog-actions">
            <button type="button" onClick={() => setView('details')}>
              {t('plan.next')}
            </button>
          </div>
        </section>
      )}

      {view === 'details' && (
        <section data-view="details">
          <h2>{t('plan.detailsTitle')}</h2>
          <p>{t('plan.detailsIntro')}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              setDetails({
                name: String(f.get('name') ?? '').trim(),
                email: String(f.get('email') ?? '').trim(),
                startDate: String(f.get('startDate') ?? ''),
                travelers: String(f.get('travelers') ?? ''),
                notes: String(f.get('notes') ?? '').trim(),
              })
              setView('done')
            }}
          >
            <label>
              {t('plan.name')}
              <input name="name" type="text" />
            </label>
            <label>
              {t('plan.emailLabel')}
              <input name="email" type="email" />
            </label>
            <label>
              {t('plan.startDate')}
              <input name="startDate" type="date" />
            </label>
            <label>
              {t('plan.travellers') || t('plan.travelers')}
              <input name="travelers" type="number" min={1} defaultValue={2} />
            </label>
            <label>
              {t('plan.notes')}
              <textarea name="notes" rows={3} />
            </label>
            <div className="dialog-actions">
              <button type="button" onClick={() => setView('edit')}>
                {t('plan.refine')}
              </button>
              <button type="submit">{t('plan.produce')}</button>
            </div>
          </form>
        </section>
      )}

      {view === 'done' && (
        <section data-view="done">
          <h2>{details.name ? t('plan.doneFor', { name: details.name }) : t('plan.produced')}</h2>
          <p>{summary()}</p>
          <div className="dialog-actions">
            <button type="button" onClick={() => window.print()}>
              {t('plan.downloadPdf')}
            </button>
            <button type="button" onClick={downloadTxt}>
              {t('plan.downloadTxt')}
            </button>
          </div>
          <p className="print-hint">{t('plan.printHint')}</p>
          <button type="button" onClick={() => setView('edit')}>
            {t('plan.refine')}
          </button>
        </section>
      )}
    </dialog>
  )
}
