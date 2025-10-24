import { v4 as uuidv4 } from 'uuid';

// 生成密钥的辅助函数
export const generateApiKey = (): string => {
  // 生成一个UUID并进行格式化
  const uuid = uuidv4();
  // 移除连字符并转换为大写，再添加前缀
  return `KEY_${uuid.replace(/-/g, '').toUpperCase()}`;
};

// 验证密钥是否有效（未过期、未达使用次数上限）
export const isKeyValid = (
  key: {
    expiresAt?: Date | null;
    maxUses: number;
    usedCount: number;
  }
): boolean => {
  // 检查是否已过期
  if (key.expiresAt && new Date() > key.expiresAt) {
    return false;
  }

  // 检查是否达到使用次数限制
  if (key.maxUses !== -1 && key.usedCount >= key.maxUses) {
    return false;
  }

  return true;
};