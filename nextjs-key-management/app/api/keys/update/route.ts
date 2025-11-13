import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request) {
  try {
    const { id, keyType, expiresAt } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少密钥ID' }, { status: 400 });
    }

    // 构建更新对象
    const updateData: any = {};
    if (keyType !== undefined) {
      updateData.keyType = keyType;
    }
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    // 如果没有要更新的字段，返回错误
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: '没有提供需要更新的字段' }, { status: 400 });
    }

    // 更新密钥信息
    const [updatedKey] = await db
      .update(apiKeys)
      .set(updateData)
      .where(eq(apiKeys.id, id))
      .returning();

    if (!updatedKey) {
      return NextResponse.json({ success: false, error: '密钥不存在，请联系您的销售' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedKey
    });
  } catch (error) {
    console.error('更新密钥信息时出错:', error);
    return NextResponse.json({ success: false, error: '更新密钥信息失败' }, { status: 500 });
  }
}