import { Outlet } from "react-router-dom"
import Sidebar from "@/components/Sidebar"

export default function UserAppLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="pt-24">
        <Sidebar />
      </aside>
      <main className="flex-1 p-6 pt-24">
        <Outlet />
      </main>
    </div>
  )
}
