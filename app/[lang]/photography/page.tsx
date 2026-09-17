import Link from 'next/link'
import { pageMetadata } from '@/lib/page-metadata'
import { t } from '@/lib/i18n'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return pageMetadata('/photography', lang)
}

// Ported as-is from the old static build's src/content/photography.html — photo credits are
// proper nouns and external links, so this page stays in English across every language (no
// content to translate) per the ticket's "Photography page ported as-is".
const CREDITS: { place: string; photographer: string; url: string; note?: string }[] = [
  { place: 'Giza', photographer: 'Andreea Munteanu, Unsplash', url: 'https://unsplash.com/photos/EAVwlrs7Rr8' },
  { place: 'Nile feluccas', photographer: 'Craig Manners, Unsplash', url: 'https://unsplash.com/photos/z-TPgRnB4mI' },
  { place: 'Luxor', photographer: 'Fatih Beki, Unsplash', url: 'https://unsplash.com/photos/jCdTBY4zOMw' },
  { place: 'Khan el-Khalili', photographer: 'Thales Botelho de Sousa, Unsplash', url: 'https://unsplash.com/photos/MB2eoqiNKiw' },
  { place: 'Hurghada', photographer: 'Jayde Keroi, Unsplash', url: 'https://unsplash.com/photos/i4c60uEiUaM' },
  { place: 'Alexandria', photographer: 'Mahamed Salama, Unsplash', url: 'https://unsplash.com/photos/1yghFV510NU' },
  {
    place: 'White Desert', photographer: 'Ahmed Yousry Mahfouz, Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:White_desert_sunset_time.jpg',
    note: 'CC BY-SA 4.0. Displayed with a layout crop.',
  },
]

export default async function PhotographyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return (
    <article data-reveal>
      <Link href={`/${lang}`}>← {t(lang, 'footer.explore')}</Link>
      <h1>{t(lang, 'footer.photography')}</h1>
      <p>Real places, seen through the eyes of talented photographers.</p>
      <ul>
        {CREDITS.map((c) => (
          <li key={c.place}>
            {c.place} —{' '}
            <a href={c.url} rel="noopener" target="_blank">
              {c.photographer}
            </a>
            {c.note ? <> . {c.note}</> : null}
          </li>
        ))}
      </ul>
      <p>
        Unsplash photographs are used under the <a href="https://unsplash.com/license">Unsplash License</a>. Logo supplied by Egyphoria.
      </p>
    </article>
  )
}
