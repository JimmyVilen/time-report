import type { ReactNode } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import type { RouterContext } from '~/router'

// Imported for its side effect: Vite records the stylesheet in the build
// manifest and Start injects the correct hashed <link> for both the SSR and
// the client graph. Importing it as `?url` yields a different hash per build
// environment, which 404s on first paint.
import '~/index.css'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { name: 'theme-color', content: '#f7f4ee' },
      {
        name: 'description',
        content:
          'TimeReport — elegant tidrapportering, planering och arbetsöversikt.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'TimeReport' },
      { property: 'og:description', content: 'Tid. Struktur. Överblick.' },
      { property: 'og:image', content: '/og.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'TimeReport' },
      { name: 'twitter:description', content: 'Tid. Struktur. Överblick.' },
      { name: 'twitter:image', content: '/og.png' },
      { title: 'TimeReport' },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      {
        rel: 'preload',
        href: '/fonts/manrope-latin-wght-normal.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        href: '/fonts/cormorant-garamond-latin-wght-normal.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="sv">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
