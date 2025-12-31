import { Suspense } from "react"
import VerifyForm from "./verify-form"

export const dynamic = "force-dynamic"

export default function VerifyPage({ searchParams }: { searchParams?: { email?: string } }) {
  const email = searchParams?.email || ""
  return (
    <Suspense>
      <VerifyForm initialEmail={email} />
    </Suspense>
  )
}
