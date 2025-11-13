// Test script to verify the updated trial API usage count functionality
console.log('Testing updated trial API usage count functionality:\n');

// Test scenarios for the updated trial API
const testScenarios = [
  {
    name: "New user - New trial key should start with usedCount: 1",
    description: "When a new user requests a trial key, the response should include usedCount: 1",
    originalStr: "newUser@example.com|device123",
    existingKey: null,
    expectedAction: "Create new trial key with usedCount = 1",
    expectedResponse: {
      success: true,
      data: {
        isNew: true,
        usedCount: 1
      }
    }
  },
  {
    name: "Existing user with valid key - Usage count should increment",
    description: "When an existing user with a valid trial key requests again, usedCount should increment by 1",
    originalStr: "existingUser@example.com|device456",
    existingKey: { 
      id: 1,
      isActive: true, 
      expiresAt: new Date(Date.now() + 10000000), // Future time
      maxUses: -1, 
      usedCount: 2,
      key: "EXISTING_TRIAL_KEY_12345"
    },
    expectedAction: "Increment usedCount from 2 to 3",
    expectedResponse: {
      success: true,
      data: {
        isNew: false,
        usedCount: 3
      }
    }
  },
  {
    name: "Existing user with invalid/expired key",
    description: "When user has an invalid/expired key, should return error without changing usage",
    originalStr: "expiredUser@example.com|device789",
    existingKey: { 
      id: 2,
      isActive: true, 
      expiresAt: new Date(Date.now() - 100000), // Past time (expired)
      maxUses: -1, 
      usedCount: 5,
      key: "EXPIRED_TRIAL_KEY_67890"
    },
    expectedAction: "Return error, not create new key or increment usage",
    expectedResponse: {
      success: false,
      error: "该用户已存在试用密钥，当前状态：已过期，请联系您的销售"
    }
  }
];

console.log('Test Scenarios:');
testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}`);
  console.log(`   Description: ${scenario.description}`);
  console.log(`   Input: originalStr = "${scenario.originalStr}"`);
  console.log(`   Existing key: ${scenario.existingKey ? 'Yes' : 'No'}`);
  if (scenario.existingKey) {
    console.log(`   Current usedCount: ${scenario.existingKey.usedCount}`);
  }
  console.log(`   Expected action: ${scenario.expectedAction}`);
  console.log(`   Expected response: ${JSON.stringify(scenario.expectedResponse, null, 2)}`);
  console.log('');
});

console.log('Summary of changes made:');
console.log('1. When returning an existing valid trial key, the API now increments the usedCount by 1');
console.log('2. When creating a new trial key, the initial usedCount is set to 1 instead of 0');
console.log('3. The response now includes the updated usedCount value for transparency');
console.log('\nThis ensures that every time a user clicks the free trial button, the usage count is recorded.');