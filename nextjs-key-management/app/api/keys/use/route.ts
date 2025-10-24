import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json({ success: false, error: '缺少密钥' }, { status: 400 });
    }

    // 查找密钥并增加使用次数
    const [updatedKey] = await db
      .update(apiKeys)
      .set({ 
        usedCount: sql`${apiKeys.usedCount} + 1` 
      })
      .where(eq(apiKeys.key, key))
      .returning();

    if (!updatedKey) {
      return NextResponse.json({ success: false, error: '密钥不存在，请联系微信：teachAIGC' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        ...updatedKey,
        message: '使用次数已更新'
      } 
    });
  } catch (error) {
    console.error('更新密钥使用次数时出错:', error);
    return NextResponse.json({ success: false, error: '更新密钥使用次数失败' }, { status: 500 });
  }
}