import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/drizzle/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { generateApiKey, isKeyValid } from '@/lib/key-utils';

export async function GET(request: Request) {
  try {
    // 查询所有密钥记录
    const allKeys = await db
      .select()
      .from(apiKeys)
      .orderBy(sql`${apiKeys.createdAt} DESC`);

    return NextResponse.json({ success: true, data: allKeys });
  } catch (error) {
    console.error('获取密钥列表时出错:', error);
    return NextResponse.json({ success: false, error: '获取密钥列表失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { keyType, expiresAt, maxUses, originalParams, user } = await request.json();

    // 验证必需字段
    if (!keyType) {
      return NextResponse.json({ success: false, error: '缺少必需字段: keyType' }, { status: 400 });
    }

    // 生成新密钥
    const newKey = generateApiKey();

    // 插入数据库
    const [insertedKey] = await db
      .insert(apiKeys)
      .values({
        key: newKey,
        keyType,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: maxUses !== undefined ? maxUses : -1, // 默认无限制
        originalParams,
        user,
      })
      .returning();

    return NextResponse.json({ success: true, data: insertedKey });
  } catch (error) {
    console.error('创建密钥时出错:', error);
    return NextResponse.json({ success: false, error: '创建密钥失败' }, { status: 500 });
  }
}