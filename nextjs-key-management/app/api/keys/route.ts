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
    
    // 验证 original_params 是必需的
    if (!originalParams) {
      return NextResponse.json({ success: false, error: '缺少必需字段: originalParams' }, { status: 400 });
    }

    // 检查是否已经存在使用相同 original_params 的密钥（无论是否有效）
    let existingKey = null;
    
    // 将 original_params 转换为字符串进行比较
    const paramsStr = JSON.stringify(originalParams);
    
    // 使用 SQL 查询来直接匹配 JSON 字段
    existingKey = await db
      .select()
      .from(apiKeys)
      .where(
        sql`original_params::text = ${paramsStr}::text`
      )
      .limit(1)
      .then(result => result[0] || null);

    // 如果找到了使用相同 original_params 的密钥，则不允许创建新密钥，而是返回现有密钥的状态
    if (existingKey) {
      // 构建状态消息
      let statusMessage = '该参数对应的密钥已存在，';
      
      // 检查密钥是否仍然有效
      const isStillValid = isKeyValid(existingKey);
      
      if (!existingKey.isActive) {
        statusMessage += '当前状态：已禁用，请联系您的销售';
      } else if (!isStillValid) {
        // 检查具体是哪个限制导致无效
        if (existingKey.expiresAt && new Date() > new Date(existingKey.expiresAt)) {
          statusMessage += '当前状态：已过期，请联系您的销售';
        } else if (existingKey.maxUses !== null && existingKey.maxUses !== -1 && (existingKey.usedCount || 0) >= existingKey.maxUses) {
          statusMessage += '当前状态：已达使用次数上限，请联系您的销售';
        } else {
          statusMessage += '当前状态：无效，请联系您的销售';
        }
      } else {
        statusMessage += '当前状态：有效';
      }

      // 返回错误状态，而不是创建新密钥
      return NextResponse.json({ 
        success: false, 
        error: statusMessage,
        data: existingKey
      }, { status: 409 }); // 使用 409 Conflict 状态码
    }

    // 如果没有找到现有密钥，则生成新密钥
    const newKey = generateApiKey();

    // 插入数据库
    const [insertedKey] = await db
      .insert(apiKeys)
      .values({
        key: newKey,
        keyType,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: maxUses !== undefined ? maxUses : -1, // 默认无限制
        originalParams, // 现在是必填字段
        user,
      })
      .returning();

    return NextResponse.json({ success: true, data: insertedKey });
  } catch (error) {
    console.error('创建密钥时出错:', error);
    return NextResponse.json({ success: false, error: '创建密钥失败' }, { status: 500 });
  }
}