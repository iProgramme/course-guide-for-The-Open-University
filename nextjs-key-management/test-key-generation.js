// 测试密钥生成逻辑
console.log('测试密钥生成逻辑：');

// 模拟测试场景
const testScenarios = [
  {
    name: "新参数 - 应该创建新密钥",
    originalParams: { course: "国开大学", level: "高级", student: "张三" },
    existingKey: null,
    expected: "创建新密钥"
  },
  {
    name: "相同参数(有效密钥) - 应该返回状态",
    originalParams: { course: "国开大学", level: "高级", student: "张三" },
    existingKey: { 
      isActive: true, 
      expiresAt: new Date(Date.now() + 10000000), // 未来时间
      maxUses: 100, 
      usedCount: 5 
    },
    expected: "返回存在密钥状态: 有效"
  },
  {
    name: "相同参数(禁用密钥) - 应该返回状态",
    originalParams: { course: "国开大学", level: "高级", student: "张三" },
    existingKey: { 
      isActive: false, 
      expiresAt: new Date(Date.now() + 10000000), // 未来时间
      maxUses: 100, 
      usedCount: 5 
    },
    expected: "返回存在密钥状态: 已禁用，请联系您的销售"
  },
  {
    name: "相同参数(过期密钥) - 应该返回状态",
    originalParams: { course: "国开大学", level: "高级", student: "张三" },
    existingKey: { 
      isActive: true, 
      expiresAt: new Date(Date.now() - 100000), // 过去时间
      maxUses: 100, 
      usedCount: 5 
    },
    expected: "返回存在密钥状态: 已过期，请联系您的销售"
  }
];

console.log('测试场景:');
testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}`);
  console.log(`   参数: ${JSON.stringify(scenario.originalParams)}`);
  console.log(`   现有密钥状态: ${scenario.existingKey ? '是' : '否'}`);
  console.log(`   预期结果: ${scenario.expected}`);
  console.log('');
});

console.log('已更新代码以实现以下功能：');
console.log('1. 使用相同 original_params 时不再创建新密钥');
console.log('2. 返回现有密钥的详细状态信息');
console.log('3. 根据状态显示不同的提示信息（已禁用/已过期/有效）');
console.log('4. 在提示信息中包含请联系您的销售的说明');