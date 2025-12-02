import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { keyTypeConfigs, apiKeys } from '@/drizzle/schema';
import { eq, and, count } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyType = searchParams.get('keyType');

    if (!keyType) {
      return NextResponse.json({ success: false, error: '缺少必需参数：keyType' }, { status: 400 });
    }

    // 获取 keyType 配置
    const configResult = await db
      .select()
      .from(keyTypeConfigs)
      .where(eq(keyTypeConfigs.keyType, keyType));

    if (configResult.length === 0) {
      return NextResponse.json({ success: false, error: '未找到指定的 keyType 配置' }, { status: 404 });
    }

    // 确保返回的配置包含 isActive 字段（默认为 true）
    const config = {
      ...configResult[0],
      isActive: configResult[0].isActive !== undefined ? configResult[0].isActive : true
    };

    // 计算该 keyType 下的活跃账号数量
    const activeAccountsCountResult = await db
      .select({ count: count() })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyType, keyType),
          eq(apiKeys.isActive, true)
        )
      );

    const totalAccountsCountResult = await db
      .select({ count: count() })
      .from(apiKeys)
      .where(eq(apiKeys.keyType, keyType));

    const [activeCount, totalCount] = [
      activeAccountsCountResult[0].count,
      totalAccountsCountResult[0].count
    ];

    return NextResponse.json({
      success: true,
      data: {
        config,
        usage: {
          activeAccounts: activeCount,
          totalAccounts: totalCount,
          maxAccounts: config.maxAccounts,
          remainingAccounts: config.maxAccounts - activeCount,
          isExpired: new Date() > new Date(config.expiresAt),
          daysUntilExpiry: Math.max(0, Math.ceil((new Date(config.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        }
      }
    });
  } catch (error: any) {
    console.error('获取 keyType 使用情况时出错:', error);

    // 如果是数据库字段不存在错误，则返回一个默认结构
    if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
      return NextResponse.json({ success: false, error: '数据库字段不存在，请先更新数据库结构' }, { status: 500 });
    }

    return NextResponse.json({ success: false, error: '获取 keyType 使用情况失败' }, { status: 500 });
  }
}

// 获取所有 keyType 的使用情况
export async function POST(request: Request) {
  try {
    // 获取所有 keyType 配置
    const configs = await db
      .select()
      .from(keyTypeConfigs);

    const results = [];

    for (const config of configs) {
      // 确保 isActive 字段存在
      const fullConfig = {
        ...config,
        // 如果 isActive 不存在（即数据库还没有这个字段），默认为 true
        isActive: config.isActive !== undefined ? config.isActive : true
      };

      // 计算该 keyType 下的活跃账号数量
      const activeAccountsCountResult = await db
        .select({ count: count() })
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.keyType, fullConfig.keyType),
            eq(apiKeys.isActive, true)
          )
        );

      const totalAccountsCountResult = await db
        .select({ count: count() })
        .from(apiKeys)
        .where(eq(apiKeys.keyType, fullConfig.keyType));

      const [activeCount, totalCount] = [
        activeAccountsCountResult[0].count,
        totalAccountsCountResult[0].count
      ];

      results.push({
        config: fullConfig,
        usage: {
          activeAccounts: activeCount,
          totalAccounts: totalCount,
          maxAccounts: fullConfig.maxAccounts,
          remainingAccounts: fullConfig.maxAccounts - activeCount,
          isExpired: new Date() > new Date(fullConfig.expiresAt),
          daysUntilExpiry: Math.max(0, Math.ceil((new Date(fullConfig.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    console.error('获取所有 keyType 使用情况时出错:', error);

    // 如果是数据库字段不存在错误，则返回一个默认结构
    if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
      return NextResponse.json({ success: false, error: '数据库字段不存在，请先更新数据库结构' }, { status: 500 });
    }

    return NextResponse.json({ success: false, error: '获取所有 keyType 使用情况失败' }, { status: 500 });
  }
}