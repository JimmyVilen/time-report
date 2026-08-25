import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMe, logout } from '../api/auth'
import { today } from '../lib/dateUtils'

type IconName = 'dashboard' | 'projects' | 'tasks' | 'notes' | 'planner' | 'export' | 'settings' | 'logout' | 'menu' | 'close'

function NavIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    projects: <path d="M3 7.5a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
    tasks: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    notes: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v5h5M9 12h6M9 16h6" /></>,
    planner: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></>,
    export: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.07 14H3v-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63h.01A1.7 1.7 0 0 0 10 3.07V3h4v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9v.01A1.7 1.7 0 0 0 20.93 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M13 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  }

  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  )
}

const links: { href: string; label: string; icon: IconName }[] = [
  { href: `/dashboard?date=${today()}`, label: 'Dashboard', icon: 'dashboard' },
  { href: '/projects', label: 'Projekt', icon: 'projects' },
  { href: '/tasks', label: 'Uppgifter', icon: 'tasks' },
  { href: '/notes', label: 'Anteckningar', icon: 'notes' },
  { href: '/planner', label: 'Planering', icon: 'planner' },
  { href: '/export', label: 'Exportera', icon: 'export' },
]

function Brand() {
  return <a className="brand-wordmark" href={`/dashboard?date=${today()}`}>Time<span>Report</span></a>
}

export function TopNav() {
  const { data: user } = useQuery({ queryKey: ['auth/me'], queryFn: getMe })
  const qc = useQueryClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.clear()
      window.location.href = '/login'
    },
  })

  const isActive = (href: string) => window.location.pathname.startsWith(href.split('?')[0])

  useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
      if (event.key !== 'Tab' || !drawerRef.current) return

      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('a, button:not([disabled])'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileOpen])

  const navigation = (
    <nav className="sidebar-nav" aria-label="Huvudnavigation">
      {links.map(link => (
        <a
          key={link.href}
          href={link.href}
          className={`sidebar-link ${isActive(link.href) ? 'is-active' : ''}`}
          aria-current={isActive(link.href) ? 'page' : undefined}
          onClick={() => setMobileOpen(false)}
        >
          <NavIcon name={link.icon} />
          <span>{link.label}</span>
        </a>
      ))}
    </nav>
  )

  const footer = (
    <div className="sidebar-footer">
      <div className="sidebar-user">
        <strong>{user?.name ?? 'TimeReport'}</strong>
        <span>{user?.email}</span>
      </div>
      <a href="/profile" className={`sidebar-link ${isActive('/profile') ? 'is-active' : ''}`} onClick={() => setMobileOpen(false)}>
        <NavIcon name="settings" />
        <span>Inställningar</span>
      </a>
      <button className="sidebar-link sidebar-logout" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
        <NavIcon name="logout" />
        <span>{logoutMutation.isPending ? 'Loggar ut…' : 'Logga ut'}</span>
      </button>
    </div>
  )

  return (
    <>
      <aside className="desktop-sidebar">
        <Brand />
        {navigation}
        {footer}
      </aside>

      <header className="mobile-topbar">
        <Brand />
        <button className="mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Öppna meny" aria-expanded={mobileOpen}>
          <NavIcon name="menu" />
        </button>
      </header>

      {mobileOpen && (
        <div className="mobile-drawer-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setMobileOpen(false)
        }}>
          <div ref={drawerRef} className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="mobile-drawer-header">
              <Brand />
              <button ref={closeButtonRef} className="mobile-menu-button" onClick={() => setMobileOpen(false)} aria-label="Stäng meny">
                <NavIcon name="close" />
              </button>
            </div>
            {navigation}
            {footer}
          </div>
        </div>
      )}
    </>
  )
}
