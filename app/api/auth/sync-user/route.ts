import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const syncUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = syncUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const { id, email, name, avatar } = validation.data;

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { id },
      update: {
        email,
        name,
        avatar,
      },
      create: {
        id,
        email,
        name,
        avatar,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}
