import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/characters', label: 'Characters' },
  { to: '/locations', label: 'Locations' },
  { to: '/episodes', label: 'Episodes' },
]

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <h2 className="m-0 text-xl font-semibold">Rickpedia</h2>
        <nav aria-label="Primary navigation">
          <ul className="m-0 flex list-none gap-3 p-0">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    isActive
                      ? 'rounded-md bg-slate-900 px-3 py-1.5 text-white'
                      : 'rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100'
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
