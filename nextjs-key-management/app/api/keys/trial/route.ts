import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateApiKey, isKeyValid } from '@/lib/key-utils';

export async function POST(request: Request) {
  try {
    const { originalStr } = await request.json();

    if (!originalStr) {
      return NextResponse.json({ success: false, error: '缺少 originalStr 参数' }, { status: 400 });
    }

    // 检查用户是否已经有有效的密钥（相同 originalStr）
    // originalParams 可能是字符串或对象，需要进行适当的匹配检查
    const existingKeyRecords = await db
      .select()
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt));
      console.log('existingKeyRecords:',existingKeyRecords)
    
    // 找到与 originalStr 匹配的有效密钥
    let existingValidKey = null;
    for (const record of existingKeyRecords) {
      // 检查 originalParams 是否与 originalStr 匹配
      let isMatch = false;
      
      if (record.originalParams) {
        // 如果 originalParams 是字符串，则直接比较
        if (typeof record.originalParams === 'string') {
          if (record.originalParams === originalStr) {
            isMatch = true;
          }
        }
        // 如果 originalParams 是对象，检查其中是否包含 originalStr
        else if (typeof record.originalParams === 'object') {
          const paramsValues = Object.values(record.originalParams);
          isMatch = paramsValues.some(value => 
            value === originalStr || 
            (typeof value === 'string' && value.includes(originalStr))
          );
        }
      }
      
      // 如果匹配且密钥有效，则使用该密钥
      if (isMatch && isKeyValid({
        expiresAt: record.expiresAt,
        maxUses: record.maxUses!,
        usedCount: record.usedCount!
      })) {
        existingValidKey = record;
        break;
      }
    }

    // 如果用户已经有有效的密钥，直接返回该密钥
    if (existingValidKey) {
      // 更新使用次数
      const [updatedRecord] = await db
        .update(apiKeys)
        .set({ 
          usedCount: (existingValidKey.usedCount ?? 0) + 1
        })
        .where(eq(apiKeys.id, existingValidKey.id))
        .returning();

      return NextResponse.json({ 
        success: true, 
        data: {
          key: existingValidKey.key,
          message: '使用现有密钥',
          isNew: false
        }
      });
    }

    // 如果没有有效密钥，则生成一个新的2小时有效密钥
    const newKey = generateApiKey();
    
    // 计算2小时后的时间（当前时间 + 2小时）
    const twoHoursLater = new Date();
    twoHoursLater.setHours(twoHoursLater.getHours() + 2);

    // 创建新的2小时有效密钥记录，取消使用次数限制
    const [createdKey] = await db
      .insert(apiKeys)
      .values({
        key: newKey,
        keyType: '免费试用',
        expiresAt: twoHoursLater,
        maxUses: -1, // 取消使用次数限制（-1表示无限制）
        originalParams: originalStr,
        user: `Trial_${originalStr.substring(0, 8)}`, // 使用 originalStr 的前8位作为用户标识
        isActive: true,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      data: {
        key: createdKey.key,
        message: '新密钥生成成功',
        isNew: true
      }
    });
  } catch (error) {
    console.error('免费试用密钥处理时出错:', error);
    return NextResponse.json({ success: false, error: '处理免费试用请求失败' }, { status: 500 });
  }
}