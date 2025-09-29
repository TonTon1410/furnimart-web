// UserAppLayout.tsx
import { Outlet } from "react-router-dom"
import Sidebar from "@/components/Sidebar"

export default function UserAppLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      
        <Sidebar />
      

      {/* Main content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
