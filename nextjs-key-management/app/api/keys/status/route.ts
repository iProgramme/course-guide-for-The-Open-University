import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request) {
  try {
    const { id, isActive } = await request.json();

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ success: false, error: '缺少必需参数: id 和 isActive' }, { status: 400 });
    }

    // 更新密钥状态
    const [updatedKey] = await db
      .update(apiKeys)
      .set({ 
        isActive 
      })
      .where(eq(apiKeys.id, id))
      .returning();

    if (!updatedKey) {
      return NextResponse.json({ success: false, error: '密钥不存在' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        ...updatedKey,
        message: isActive ? '密钥已激活' : '密钥已禁用'
      } 
    });
  } catch (error) {
    console.error('更新密钥状态时出错:', error);
    return NextResponse.json({ success: false, error: '更新密钥状态失败' }, { status: 500 });
  }
}