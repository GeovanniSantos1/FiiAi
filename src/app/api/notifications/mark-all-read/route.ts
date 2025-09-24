import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the internal user by Clerk ID
    const internalUser = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!internalUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mark all unread notifications as read
    const result = await db.notification.updateMany({
      where: {
        userId: internalUser.id,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: 'All notifications marked as read',
      updatedCount: result.count
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}