import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * POST /api/account/underage
 *
 * Called when a signed-in user enters a date of birth under 13. PBGB is 13+,
 * so the account and all of its data are deleted. The date of birth is checked
 * here on the server and is never stored.
 *
 * Body: { date_of_birth: "YYYY-MM-DD" }
 * Auth: Bearer access token of the user being deleted (a user can only delete themselves).
 */
function ageOn(dateOfBirth: string, today: Date): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  let age = today.getUTCFullYear() - y
  const beforeBirthday =
    today.getUTCMonth() + 1 < mo || (today.getUTCMonth() + 1 === mo && today.getUTCDate() < d)
  if (beforeBirthday) age -= 1
  return age
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
  }
  const token = authHeader.split('Bearer ')[1]
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  let body: { date_of_birth?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const age = body.date_of_birth ? ageOn(body.date_of_birth, new Date()) : null
  if (age === null || age < 0) {
    return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 })
  }
  if (age >= 13) {
    // Not under 13: nothing to delete. The client should save the date normally.
    return NextResponse.json({ deleted: false })
  }

  // audit_log references auth.users without ON DELETE CASCADE, so clear it first.
  // Every other table cascades when the auth user is deleted.
  const { error: auditError } = await supabaseAdmin.from('audit_log').delete().eq('user_id', user.id)
  if (auditError) {
    console.error('Underage deletion: audit_log cleanup failed', { code: auditError.code })
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    console.error('Underage deletion: deleteUser failed', { message: deleteError.message })
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }

  // Cascading deletes fire the audit trigger, which copies the deleted rows into audit_log
  // with no user_id. Remove those copies too so none of the child's data is left behind.
  const { error: residueError } = await supabaseAdmin
    .from('audit_log')
    .delete()
    .or(`old_values->>user_id.eq.${user.id},old_values->>id.eq.${user.id}`)
  if (residueError) {
    console.error('Underage deletion: audit residue cleanup failed', { code: residueError.code })
  }

  return NextResponse.json({ deleted: true })
}
