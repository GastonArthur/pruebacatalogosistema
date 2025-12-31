"use client"

import { CatalogPage } from "@/components/catalog-page"

export default function CatalogByIdPage({ params }: { params: { id: string } }) {
  return <CatalogPage catalogId={params.id} />
}

