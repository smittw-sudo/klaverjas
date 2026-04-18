import { NextResponse } from 'next/server'
import { closeSession } from '@/lib/db/sessions'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const today = new Date().toISOString().slice(0, 10)
  await closeSession(id, today)
  return NextResponse.redirect(new URL(`/sessions/${id}`, process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'))
}
