import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from "@/lib/db";
// Credit system removed - manual access control only

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
  console.log('Webhook body:', body);

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    try {
      const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
      
      // Create user in database
      const user = await db.user.create({
        data: {
          clerkId: id,
          email: primaryEmail?.email_address || null,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        },
      });

      console.log('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      return new Response('Error creating user', { status: 500 });
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    try {
      const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
      
      await db.user.update({
        where: { clerkId: id },
        data: {
          email: primaryEmail?.email_address || null,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        },
      });

      // Credit system removed - metadata ignored

      console.log('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  if (eventType === 'user.deleted') {
    try {
      await db.user.delete({
        where: { clerkId: evt.data.id! },
      });

      console.log('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  // Subscription and billing system removed - manual access control only
  console.log(`Webhook processed: ${eventType} - subscription/billing events ignored`);

  return new Response('', { status: 200 });
}
