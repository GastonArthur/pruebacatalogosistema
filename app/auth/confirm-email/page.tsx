import { Suspense } from "react"
import ConfirmEmailContent from "./confirm-email-content"

export const dynamic = "force-dynamic"

export default function ConfirmEmailPage({ searchParams }: { searchParams?: { email?: string } }) {
  const email = searchParams?.email || ""
  return (
    <Suspense>
      <ConfirmEmailContent initialEmail={email} />
    </Suspense>
  )
}

