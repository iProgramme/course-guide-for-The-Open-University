import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys, keyTypeConfigs } from '@/drizzle/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { generateApiKey, isKeyValid } from '@/lib/key-utils';

export async function POST(request: Request) {
  try {
    const { originalStr, keyType } = await request.json();

    if (!originalStr) {
      return NextResponse.json({ success: false, error: '缺少信息，请到正确的页面再运行' }, { status: 400 });
    }

    console.log('收到试用请求，keyType:', keyType, 'originalStr:', originalStr);

    // 优先检查是否提供了keyType参数
    if (keyType) {
      console.log('检测到keyType，开始验证配置:', keyType);

      // 检查是否存在对应的keyType配置
      let keyTypeConfig = null;
      let configQueryError = false;
      try {
        const configs = await db
          .select()
          .from(keyTypeConfigs)
          .where(eq(keyTypeConfigs.keyType, keyType));

        if (configs.length > 0) {
          // 确保配置对象包含 isActive 字段（默认为 true）
          keyTypeConfig = {
            ...configs[0],
            isActive: configs[0].isActive !== undefined ? configs[0].isActive : true
          };
          console.log('找到keyType配置:', keyTypeConfig);
        } else {
          console.log('未找到keyType配置:', keyType);
        }
      } catch (error) {
        console.error('检查 keyType 配置时出错:', error);
        configQueryError = true;
        // 如果查询出错，继续使用老逻辑
      }

      // 如果存在 keyType 配置，则执行新业务逻辑
      if (keyTypeConfig && !configQueryError) {
        console.log('执行新业务逻辑，验证配置状态');

        // 1. 检查配置是否激活
        if (keyTypeConfig.isActive === false) {
          console.log('keyType配置已被禁用:', keyType);
          return NextResponse.json({
            success: false,
            error: '该账号类型已被禁用，请联系您的销售',
            data: { config: keyTypeConfig }
          }, { status: 403 });
        }

        // 2. 检查配置是否已过期
        const now = new Date();
        if (now > new Date(keyTypeConfig.expiresAt)) {
          console.log('keyType配置已过期:', keyType);
          return NextResponse.json({
            success: false,
            error: '该账号类型已过期，请联系您的销售续费',
            data: { config: keyTypeConfig }
          }, { status: 403 });
        }

        // 3. 检查账号数量是否达到上限
        // 如果 maxAccounts 为 0，表示不允许任何账号
        if (keyTypeConfig.maxAccounts === 0) {
          console.log('keyType配置没有可用账号:', keyType);
          return NextResponse.json({
            success: false,
            error: `该账号类型没有可用账号，请联系您的销售`,
            data: { config: keyTypeConfig, currentCount: 0 }
          }, { status: 403 });
        }

        const activeAccountsCount = await db
          .select({ count: count() })
          .from(apiKeys)
          .where(
            and(
              eq(apiKeys.keyType, keyType),
              eq(apiKeys.isActive, true)
            )
          );

        const currentAccountCount = activeAccountsCount[0].count;
        console.log('当前活跃账号数:', currentAccountCount, '最大账号数:', keyTypeConfig.maxAccounts);

        if (keyTypeConfig.maxAccounts > 0 && currentAccountCount >= keyTypeConfig.maxAccounts && keyTypeConfig.maxAccounts !== -1) {
          console.log('keyType配置已达到最大账号数量限制:', keyType);
          return NextResponse.json({
            success: false,
            error: `该账号类型已达到最大账号数量限制（${keyTypeConfig.maxAccounts}个），请联系您的销售增加账号数量`,
            data: { config: keyTypeConfig, currentCount: currentAccountCount }
          }, { status: 403 });
        }

        console.log('keyType验证通过，开始检查是否已存在相同originalStr的密钥');
      } else {
        console.log('keyType配置不存在或查询出错，使用老逻辑');
      }
    } else {
      console.log('未提供keyType，使用老逻辑直接检查originalStr');
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
      console.log('找到匹配的originalStr密钥，检查其有效性');

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

        console.log('使用现有有效密钥:', updatedKey.key);
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

        console.log('现有密钥已失效:', statusMessage);

        // 返回错误状态，而不是创建新密钥
        return NextResponse.json({
          success: false,
          error: statusMessage,
          data: existingKey
        }, { status: 409 }); // 使用 409 Conflict 状态码
      }
    } else {
      console.log('未找到匹配的originalStr密钥，准备创建新密钥');
    }

    // 如果没有找到现有密钥，根据是否提供了keyType来决定使用哪种逻辑
    if (keyType) {
      // 此时keyType已经通过了前面的验证，所以直接使用配置的有效期
      const newKey = generateApiKey();

      // 使用 keyType 配置的有效期
      const keyTypeConfig = await db
        .select()
        .from(keyTypeConfigs)
        .where(eq(keyTypeConfigs.keyType, keyType));

      let configExpiresAt;
      if (keyTypeConfig.length > 0) {
        // 如果存在配置，使用配置的有效期
        configExpiresAt = keyTypeConfig[0].expiresAt;
        console.log('使用keyType配置的有效期创建新密钥:', configExpiresAt);
      } else {
        // 如果没有配置（可能是查询错误等情况），使用老逻辑的2小时有效期
        configExpiresAt = new Date();
        configExpiresAt.setHours(configExpiresAt.getHours() + 2);
        console.log('使用默认2小时有效期创建新密钥');
      }

      // 创建新的密钥记录，使用配置的有效期
      const [createdKey] = await db
        .insert(apiKeys)
        .values({
          key: newKey,
          keyType: keyType,
          expiresAt: configExpiresAt, // 使用配置的有效期
          maxUses: -1, // 取消使用次数限制（-1表示无限制）
          originalParams: originalStr,
          user: `Trial_${originalStr.substring(0, 8)}`, // 使用 originalStr 的前8位作为用户标识
          isActive: true,
          usedCount: 1, // 初始使用次数为1 since the user just initiated the trial
        })
        .returning();

      console.log('新密钥创建成功:', createdKey.key);
      return NextResponse.json({
        success: true,
        data: {
          key: createdKey.key,
          message: '新密钥生成成功',
          isNew: true,
          expiresAt: createdKey.expiresAt, // 返回配置的有效期
          usedCount: createdKey.usedCount // 返回使用次数
        }
      });
    } else {
      // 如果没有提供keyType，直接使用老逻辑（2小时有效密钥）
      const newKey = generateApiKey();

      // 计算2小时后的时间（当前时间 + 2小时）
      const twoHoursLater = new Date();
      twoHoursLater.setHours(twoHoursLater.getHours() + 2);

      // 创建新的2小时有效密钥记录，取消使用次数限制，但初始使用次数为1
      const [createdKey] = await db
        .insert(apiKeys)
        .values({
          key: newKey,
          keyType: keyType, // 可能为 undefined，但不影响
          expiresAt: twoHoursLater,
          maxUses: -1, // 取消使用次数限制（-1表示无限制）
          originalParams: originalStr,
          user: `Trial_${originalStr.substring(0, 8)}`, // 使用 originalStr 的前8位作为用户标识
          isActive: true,
          usedCount: 1, // 初始使用次数为1 since the user just initiated the trial
        })
        .returning();

      console.log('使用老逻辑创建新密钥:', createdKey.key);
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
    }
  } catch (error) {
    console.error('免费试用密钥处理时出错:', error);
    return NextResponse.json({ success: false, error: '处理免费试用请求失败' }, { status: 500 });
  }
}