import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread') === 'true';

    const where = {
      userId: internalUser.id,
      ...(unreadOnly && { read: false }),
      // Filter out expired notifications
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    const notifications = await db.notification.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    // Get unread count
    const unreadCount = await db.notification.count({
      where: {
        userId: internalUser.id,
        read: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === limit
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create notification (admin only or internal system use)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the current user to check admin permissions
    const currentUser = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin (based on email in environment variable)
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    const isAdmin = adminEmails.includes(currentUser.email || '');

    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Forbidden - Admin access required' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { 
      targetUserId, 
      type, 
      priority = 'NORMAL',
      title, 
      message, 
      data = null,
      expiresAt = null
    } = body;

    // Find the internal user for the target
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const notification = await db.notification.create({
      data: {
        userId: targetUserId,
        type,
        priority,
        title,
        message,
        data,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    return NextResponse.json(notification, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}