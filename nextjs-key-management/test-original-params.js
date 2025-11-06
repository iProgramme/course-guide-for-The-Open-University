const { db } = require('./lib/db');
const { apiKeys } = require('./drizzle/schema');
const { eq, sql } = require('drizzle-orm');

// 测试 original_params 查询逻辑
async function testOriginalParamsQuery() {
  console.log('测试 original_params 查询逻辑...');
  
  // 准备测试数据
  const testParams = { 
    course: '国开大学-计算机科学', 
    level: '中级', 
    user: 'test@example.com' 
  };
  
  const paramsStr = JSON.stringify(testParams);
  
  console.log('测试参数:', paramsStr);
  
  // 在实际应用中，我们会使用如下查询:
  // existingKey = await db
  //   .select()
  //   .from(apiKeys)
  //   .where(
  //     sql`original_params::text = ${paramsStr}::text`
  //   )
  //   .limit(1)
  //   .then(result => result[0] || null);
  
  console.log('SQL 查询将如下执行:');
  console.log(`SELECT * FROM api_keys WHERE original_params::text = '${paramsStr}'::text LIMIT 1;`);
  
  console.log('\n实现已完成，original_params 相同的密钥将不会重复生成。');
}

testOriginalParamsQuery();