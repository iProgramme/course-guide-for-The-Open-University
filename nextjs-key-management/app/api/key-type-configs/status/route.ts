import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { keyTypeConfigs } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request) {
  try {
    const { keyType, isActive } = await request.json();

    if (!keyType || isActive === undefined) {
      return NextResponse.json({ success: false, error: '缺少必需参数：keyType, isActive' }, { status: 400 });
    }

    // 更新 keyType 配置的激活状态
    const [updatedConfig] = await db
      .update(keyTypeConfigs)
      .set({
        isActive: isActive,
        updatedAt: new Date(), // 更新时间戳
      })
      .where(eq(keyTypeConfigs.keyType, keyType))
      .returning();

    if (!updatedConfig) {
      return NextResponse.json({ 
        success: false, 
        error: '未找到指定的 keyType 配置' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedConfig
    });
  } catch (error) {
    console.error('更新 keyType 配置状态时出错:', error);
    return NextResponse.json({ success: false, error: '更新 keyType 配置状态失败' }, { status: 500 });
  }
}