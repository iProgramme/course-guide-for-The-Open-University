import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';
import { isKeyValid } from '@/lib/key-utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ success: false, error: '缺少密钥参数' }, { status: 400 });
  }

  try {
    // 查找密钥
    const keyRecord = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, key))
      .limit(1);

    if (keyRecord.length === 0) {
      return NextResponse.json({ success: false, error: '密钥不存在' }, { status: 404 });
    }

    const record = keyRecord[0];

    // 检查密钥是否有效
    if (!record.isActive || !isKeyValid(record)) {
      return NextResponse.json({ success: false, error: '密钥无效或已过期' }, { status: 403 });
    }

    // 更新使用次数
    const [updatedRecord] = await db
      .update(apiKeys)
      .set({ 
        usedCount: record.usedCount + 1 
      })
      .where(eq(apiKeys.id, record.id))
      .returning();

    return NextResponse.json({ 
      success: true, 
      data: { 
        ...updatedRecord, 
        isValid: true 
      } 
    });
  } catch (error) {
    console.error('验证密钥时出错:', error);
    return NextResponse.json({ success: false, error: '验证密钥失败' }, { status: 500 });
  }
}