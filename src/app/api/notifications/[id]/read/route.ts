import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// PATCH /api/notifications/[id]/read - Mark notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const notificationId = params.id;

    // Verify the notification belongs to the user
    const notification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId: internalUser.id
      }
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Mark as read
    const updatedNotification = await db.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    return NextResponse.json(updatedNotification);

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}