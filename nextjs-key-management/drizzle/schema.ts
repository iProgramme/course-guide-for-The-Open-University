import { pgTable, serial, text, timestamp, integer, json, boolean } from 'drizzle-orm/pg-core';

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  keyType: text('key_type').notNull(), // 如: '国开大学-pro', '国开大学-刷题', 'xxx系统-xxx'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // 可选：密钥有效期
  maxUses: integer('max_uses').default(-1), // -1 表示无限制
  usedCount: integer('used_count').default(0), // 已使用次数
  originalParams: json('original_params'), // 用于生成密钥的参数
  user: text('user'), // 使用人
  isActive: boolean('is_active').default(true),
});