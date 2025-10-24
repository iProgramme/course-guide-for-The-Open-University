import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { isKeyValid } from '@/lib/key-utils';

export async function POST(request: Request) {
  try {
    const { key, originalStr } = await request.json();

    if (!key) {
      return NextResponse.json({ success: false, error: '缺少密钥参数' }, { status: 400 });
    }

    if (!originalStr) {
      return NextResponse.json({ success: false, error: '缺少originalStr参数' }, { status: 400 });
    }

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
    if (!record.isActive || !isKeyValid({
      expiresAt: record.expiresAt,
      maxUses: record.maxUses!,
      usedCount: record.usedCount!
    })) {
      return NextResponse.json({ success: false, error: '密钥无效或已过期' }, { status: 403 });
    }

    // 验证originalParams和originalStr是否匹配
    if (record.originalParams) {
      // 如果originalParams是字符串，则直接比较
      if (typeof record.originalParams === 'string') {
        if (record.originalParams !== originalStr) {
          return NextResponse.json({ success: false, error: '密钥与当前设备不匹配，请使用本人授权Key' }, { status: 403 });
        }
      } 
      // 如果originalParams是对象，检查其中是否包含originalStr
      else if (typeof record.originalParams === 'object') {
        // 检查对象的值中是否包含originalStr
        const paramsValues = Object.values(record.originalParams);
        const isMatch = paramsValues.some(value => 
          value === originalStr || 
          (typeof value === 'string' && value.includes(originalStr))
        );
        
        if (!isMatch) {
          return NextResponse.json({ success: false, error: '密钥与当前设备不匹配，请使用本人授权Key' }, { status: 403 });
        }
      }
    }

    // 更新使用次数
    const [updatedRecord] = await db
      .update(apiKeys)
      .set({ 
        usedCount: (record.usedCount ?? 0) + 1
      })
      .where(eq(apiKeys.id, record.id))
      .returning();

    // 验证成功，不返回密钥详细信息，只返回成功状态
    return NextResponse.json({ 
      success: true 
    });
  } catch (error) {
    console.error('验证密钥时出错:', error);
    return NextResponse.json({ success: false, error: '验证密钥失败' }, { status: 500 });
  }
}