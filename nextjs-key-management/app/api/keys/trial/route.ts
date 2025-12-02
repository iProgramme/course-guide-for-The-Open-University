import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateApiKey, isKeyValid } from '@/lib/key-utils';

export async function POST(request: Request) {
  try {
    const { originalStr, keyType } = await request.json();

    if (!originalStr) {
      return NextResponse.json({ success: false, error: '缺少信息，请到正确的页面再运行' }, { status: 400 });
    }

    // 检查是否有使用相同 originalStr 的密钥存在（无论是否有效）
    // originalParams 可能是字符串或对象，需要进行适当的匹配检查
    const existingKeyRecords = await db
      .select()
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt));
    
    // 找到与 originalStr 匹配的密钥（不管是否有效）
    let existingKey = null;
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
      
      // 如果匹配，不管密钥是否有效，都停止查找
      if (isMatch) {
        existingKey = record;
        break;
      }
    }

    // 如果找到了使用相同 originalStr 的密钥，则根据其状态决定返回内容
    if (existingKey) {
      // 检查密钥是否仍然有效
      const isStillValid = isKeyValid({
        expiresAt: existingKey.expiresAt,
        maxUses: existingKey.maxUses,
        usedCount: existingKey.usedCount
      });
      
      if (isStillValid && existingKey.isActive) {
        // 如果密钥仍然有效，先增加使用次数，然后返回密钥以供直接使用
        const [updatedKey] = await db
          .update(apiKeys)
          .set({ 
            usedCount: (existingKey.usedCount ?? 0) + 1
          })
          .where(eq(apiKeys.id, existingKey.id))
          .returning();

        return NextResponse.json({ 
          success: true, 
          data: {
            key: updatedKey.key,
            message: '使用现有有效密钥',
            isNew: false,
            expiresAt: updatedKey.expiresAt, // 返回有效期截止日期
            usedCount: updatedKey.usedCount // 返回更新后的使用次数
          }
        });
      } else {
        // 如果密钥已失效，返回状态信息
        let statusMessage = '该用户已存在试用密钥，';
        
        if (!existingKey.isActive) {
          statusMessage += '当前状态：已禁用，请联系您的销售';
        } else if (existingKey.expiresAt && new Date() > new Date(existingKey.expiresAt)) {
          statusMessage += '当前状态：已过期，请联系您的销售';
        } else if (existingKey.maxUses !== null && existingKey.maxUses !== -1 && (existingKey.usedCount || 0) >= existingKey.maxUses) {
          statusMessage += '当前状态：已达使用次数上限，请联系您的销售';
        } else {
          statusMessage += '当前状态：无效，请联系您的销售';
        }

        // 返回错误状态，而不是创建新密钥
        return NextResponse.json({ 
          success: false, 
          error: statusMessage,
          data: existingKey
        }, { status: 409 }); // 使用 409 Conflict 状态码
      }
    }

    // 如果没有找到现有密钥，则生成一个新的2小时有效密钥
    const newKey = generateApiKey();
    
    // 计算2小时后的时间（当前时间 + 2小时）
    const twoHoursLater = new Date();
    twoHoursLater.setHours(twoHoursLater.getHours() + 2);

    // 创建新的2小时有效密钥记录，取消使用次数限制，但初始使用次数为1
    const [createdKey] = await db
      .insert(apiKeys)
      .values({
        key: newKey,
        keyType: keyType,
        expiresAt: twoHoursLater,
        maxUses: -1, // 取消使用次数限制（-1表示无限制）
        originalParams: originalStr,
        user: `Trial_${originalStr.substring(0, 8)}`, // 使用 originalStr 的前8位作为用户标识
        isActive: true,
        usedCount: 1, // 初始使用次数为1 since the user just initiated the trial
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      data: {
        key: createdKey.key,
        message: '新密钥生成成功',
        isNew: true,
        expiresAt: createdKey.expiresAt, // 返回有效期截止日期
        usedCount: createdKey.usedCount // 返回使用次数
      }
    });
  } catch (error) {
    console.error('免费试用密钥处理时出错:', error);
    return NextResponse.json({ success: false, error: '处理免费试用请求失败' }, { status: 500 });
  }
}