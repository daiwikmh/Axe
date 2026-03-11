import type React from "react"
import Providers from "@/components/shared/Providers"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
