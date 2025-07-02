// app/api/blob/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  // ⚠️ The below code is for App Router Route Handlers only
  if (!request.body) {
    return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
  }
  const blob = await put(filename, request.body, {
    access: 'public',
    addRandomSuffix: true,
  });
  if (!blob) {
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }

  return NextResponse.json(blob);
}

