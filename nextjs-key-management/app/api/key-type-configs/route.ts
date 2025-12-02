import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { keyTypeConfigs } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const configs = await db
      .select()
      .from(keyTypeConfigs);

    return NextResponse.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('获取 keyType 配置时出错:', error);
    return NextResponse.json({ success: false, error: '获取 keyType 配置失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { keyType, maxAccounts, expiresAt } = await request.json();

    if (!keyType || !expiresAt) {
      return NextResponse.json({ success: false, error: '缺少必需参数：keyType, maxAccounts, expiresAt' }, { status: 400 });
    }

    // 验证账号数量是否为非负整数
    if (!Number.isInteger(maxAccounts) || maxAccounts < 0) {
      return NextResponse.json({ success: false, error: 'maxAccounts 必须为非负整数' }, { status: 400 });
    }

    // 验证有效期是否为有效日期
    const date = new Date(expiresAt);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ success: false, error: 'expiresAt 不是有效的日期格式' }, { status: 400 });
    }

    // 检查是否已存在相同的 keyType
    const existingConfig = await db
      .select()
      .from(keyTypeConfigs)
      .where(eq(keyTypeConfigs.keyType, keyType));

    if (existingConfig.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: '该 keyType 已存在，请使用 PUT 方法更新现有配置' 
      }, { status: 409 });
    }

    // 创建新配置
    const [newConfig] = await db
      .insert(keyTypeConfigs)
      .values({
        keyType,
        maxAccounts,
        expiresAt: new Date(expiresAt),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newConfig
    });
  } catch (error) {
    console.error('创建 keyType 配置时出错:', error);
    return NextResponse.json({ success: false, error: '创建 keyType 配置失败' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { keyType, maxAccounts, expiresAt } = await request.json();

    if (!keyType || !expiresAt) {
      return NextResponse.json({ success: false, error: '缺少必需参数：keyType, maxAccounts, expiresAt' }, { status: 400 });
    }

    // 验证账号数量是否为非负整数
    if (!Number.isInteger(maxAccounts) || maxAccounts < 0) {
      return NextResponse.json({ success: false, error: 'maxAccounts 必须为非负整数' }, { status: 400 });
    }

    // 验证有效期是否为有效日期
    const date = new Date(expiresAt);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ success: false, error: 'expiresAt 不是有效的日期格式' }, { status: 400 });
    }

    // 更新配置
    const [updatedConfig] = await db
      .update(keyTypeConfigs)
      .set({
        maxAccounts,
        expiresAt: new Date(expiresAt),
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
    console.error('更新 keyType 配置时出错:', error);
    return NextResponse.json({ success: false, error: '更新 keyType 配置失败' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { keyType } = await request.json();

    if (!keyType) {
      return NextResponse.json({ success: false, error: '缺少必需参数：keyType' }, { status: 400 });
    }

    const result = await db
      .delete(keyTypeConfigs)
      .where(eq(keyTypeConfigs.keyType, keyType));

    if (result.rowsAffected === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '未找到指定的 keyType 配置' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'keyType 配置删除成功'
    });
  } catch (error) {
    console.error('删除 keyType 配置时出错:', error);
    return NextResponse.json({ success: false, error: '删除 keyType 配置失败' }, { status: 500 });
  }
}