import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'

export default function AppLayout() {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-slate-50 text-slate-800">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
