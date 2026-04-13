import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="container app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
