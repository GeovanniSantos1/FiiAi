import { auth, createClerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin-utils"
import { db } from "@/lib/db"

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY as string })
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch a page of users from Clerk; paginate here if needed
    const { pageSize: bodyPageSize, maxPages, debug: bodyDebug } = await request.json().catch(() => ({}))
    const pageSize = Math.max(1, Math.min(200, bodyPageSize || 50))
    const max = Math.max(1, Math.min(20, maxPages || 10))
    const debug = Boolean(bodyDebug) || process.env.DEBUG_CLERK_SYNC === '1'

    const dlog = (...args: unknown[]) => { if (debug) console.log('[admin/users/sync]', ...args) }

    let totalProcessed = 0
    let createdUsers = 0
    let updatedUsers = 0
    let pagesProcessed = 0

    for (let page = 0; page < max; page++) {
      const res = await clerk.users.getUserList({ limit: pageSize, offset: page * pageSize }) as unknown as { data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>
      const users: Array<Record<string, any>> = (res as { data?: Array<Record<string, any>> })?.data || (res as Array<Record<string, any>>) || []
      if (!users.length) break
      pagesProcessed++
      dlog(`page ${page + 1}/${max}: fetched ${users.length} users`)

      // Process users in batches to prevent database connection exhaustion
      const BATCH_SIZE = 10
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE)
        const batchPromises = batch.map(async (cu) => {
          totalProcessed++
          try {
            const clerkId = cu.id
            dlog('processing user', { clerkId })
            const primary = cu.emailAddresses?.find((e: { id?: string }) => e.id === cu.primaryEmailAddressId) || cu.emailAddresses?.[0]
            const email = primary?.emailAddress || null
            const name = [cu.firstName, cu.lastName].filter(Boolean).join(' ') || cu.firstName || null

            // Sync basic user data
            let dbUser = await db.user.findUnique({ where: { clerkId } })
            if (!dbUser) {
              dbUser = await db.user.create({ data: { clerkId, email, name } })
              createdUsers++
              dlog('created user', { clerkId, email, name })
            } else {
              // Update existing user data
              await db.user.update({ where: { id: dbUser.id }, data: { email, name } })
              updatedUsers++
              dlog('updated user', { clerkId, email, name })
            }
          } catch (innerErr) {
            console.error('Sync user failed:', innerErr)
          }
        })

        // Wait for batch to complete before processing next batch
        await Promise.allSettled(batchPromises)
      }
    }

    const payload: Record<string, unknown> = {
      processed: totalProcessed,
      createdUsers,
      updatedUsers,
      pagesProcessed,
    }
    if (debug) {
      payload.debug = {
        pagesProcessed,
      }
    }
    return NextResponse.json(payload)
  } catch (error: unknown) {
    console.error('Sync from Clerk failed:', error)
    const err = error as { errors?: Array<{ message?: string }>; message?: string; status?: number }
    const message = err?.errors?.[0]?.message || err?.message || 'Failed to sync users'
    return NextResponse.json({ error: message }, { status: err?.status || 500 })
  }
}
