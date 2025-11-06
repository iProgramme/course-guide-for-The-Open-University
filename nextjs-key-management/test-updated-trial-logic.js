// 测试更新后的免费试用API逻辑
console.log('测试更新后的免费试用API逻辑：');

// 模拟测试场景
const testScenarios = [
  {
    name: "新用户 - 应该创建新试用密钥",
    originalStr: "张三|12345678",
    existingKey: null,
    expected: "创建新的2小时试用密钥"
  },
  {
    name: "相同用户(有效密钥) - 应该直接返回现有密钥",
    originalStr: "张三|12345678",
    existingKey: { 
      isActive: true, 
      expiresAt: new Date(Date.now() + 10000000), // 未来时间
      maxUses: -1, 
      usedCount: 5,
      key: "EXISTING_TRIAL_KEY_12345"
    },
    expected: "直接返回现有有效密钥，启动试用功能"
  },
  {
    name: "相同用户(禁用密钥) - 应该返回状态",
    originalStr: "张三|12345678",
    existingKey: { 
      isActive: false, 
      expiresAt: new Date(Date.now() + 10000000), // 未来时间
      maxUses: -1, 
      usedCount: 5,
      key: "DISABLED_TRIAL_KEY_67890"
    },
    expected: "返回存在密钥状态: 已禁用，请联系您的销售"
  },
  {
    name: "相同用户(过期密钥) - 应该返回状态",
    originalStr: "张三|12345678",
    existingKey: { 
      isActive: true, 
      expiresAt: new Date(Date.now() - 100000), // 过去时间
      maxUses: -1, 
      usedCount: 5,
      key: "EXPIRED_TRIAL_KEY_11111"
    },
    expected: "返回存在密钥状态: 已过期，请联系您的销售"
  }
];

console.log('测试场景:');
testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}`);
  console.log(`   用户标识: ${scenario.originalStr}`);
  console.log(`   现有密钥状态: ${scenario.existingKey ? '是' : '否'}`);
  if (scenario.existingKey) {
    console.log(`   现有密钥: ${scenario.existingKey.key}`);
    console.log(`   是否有效: ${scenario.existingKey.isActive && new Date() < new Date(scenario.existingKey.expiresAt)}`);
  }
  console.log(`   预期结果: ${scenario.expected}`);
  console.log('');
});

console.log('已更新免费试用API逻辑:');
console.log('1. 使用相同 originalStr 时，如果现有密钥有效，则直接返回该密钥');
console.log('2. 如果现有密钥无效，则返回状态信息');
console.log('3. 只有在没有现有密钥的情况下才创建新密钥');
console.log('4. 有效密钥会直接启动试用功能，无需重新验证');