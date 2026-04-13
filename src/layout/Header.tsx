import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/characters', label: 'Characters' },
  { to: '/locations', label: 'Locations' },
  { to: '/episodes', label: 'Episodes' },
]

export default function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <h2 className="brand">Rickpedia</h2>
        <nav aria-label="Primary navigation">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? 'nav-link nav-link-active' : 'nav-link'
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
