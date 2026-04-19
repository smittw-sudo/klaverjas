'use server'

import { deleteGame } from '@/lib/db/games'
import { revalidatePath } from 'next/cache'

export async function deleteGameAction(id: string) {
  await deleteGame(id)
  revalidatePath('/dashboard')
}
