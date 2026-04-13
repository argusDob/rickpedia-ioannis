import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/characters', label: 'Characters' },
  { to: '/locations', label: 'Locations' },
  { to: '/episodes', label: 'Episodes' },
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isMenuOpen])

  const mobileLinkClasses = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'block rounded-md bg-slate-900 px-3 py-2 text-white'
      : 'block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100'

  const desktopLinkClasses = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'rounded-md bg-slate-900 px-3 py-1.5 text-white'
      : 'rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100'

  return (
    <header ref={headerRef} className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <h2 className="m-0 text-xl font-semibold">Rickpedia</h2>
        <button
          type="button"
          className="rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 md:hidden"
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation-mobile"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setIsMenuOpen((prevState) => !prevState)}
        >
          <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            {isMenuOpen ? (
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm1 4a1 1 0 100 2h12a1 1 0 100-2H4z"
                clipRule="evenodd"
              />
            )}
          </svg>
        </button>
        <nav aria-label="Primary navigation" className="hidden md:block">
          <ul className="m-0 flex list-none gap-3 p-0">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={desktopLinkClasses}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {isMenuOpen && (
          <nav
            id="primary-navigation-mobile"
            aria-label="Primary navigation mobile"
            className="w-full md:hidden"
          >
            <ul className="m-0 list-none space-y-2 border-t border-slate-200 pt-3">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={mobileLinkClasses}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  )
}
