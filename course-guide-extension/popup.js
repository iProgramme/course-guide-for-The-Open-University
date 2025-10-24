// 课程指南扩展弹窗处理器

document.addEventListener('DOMContentLoaded', function() {
    // 通过ID获取元素
    const basic2LevelBtn = document.getElementById('basic2LevelBtn');
    const basic3LevelBtn = document.getElementById('basic3LevelBtn');
    const proVersionBtn = document.getElementById('proVersionBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const verifyKeyBtn = document.getElementById('verifyKeyBtn');
    
    // 添加一个标志来跟踪密钥验证状态
    let isProVersionAuthorized = false;

    // 为按钮添加点击事件监听器
    if (basic2LevelBtn) {
        basic2LevelBtn.addEventListener('click', function() {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'runBasic2Level'}, function(response) {
                    console.log(response.status);
                    // 可选：提供用户反馈
                    document.getElementById('status').textContent = '基础版2级已启动！';
                });
            });
        });
    }

    if (basic3LevelBtn) {
        basic3LevelBtn.addEventListener('click', function() {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'runBasic3Level'}, function(response) {
                    console.log(response.status);
                    // 可选：提供用户反馈
                    document.getElementById('status').textContent = '基础版3级已启动！';
                });
            });
        });
    }

    if (proVersionBtn) {
        proVersionBtn.addEventListener('click', function() {
            // 在执行专业版功能前，再次检查授权状态
            if (!isProVersionAuthorized) {
                document.getElementById('status').textContent = '请先验证密钥！';
                // 重新隐藏专业版按钮
                proVersionBtn.classList.add('hidden');
                return;
            }
            
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'runProVersion'}, function(response) {
                    console.log(response.status);
                    // 可选：提供用户反馈
                    document.getElementById('status').textContent = response.status;
                });
            });
        });
    }

    // 验证密钥功能
    if (verifyKeyBtn) {
        verifyKeyBtn.addEventListener('click', async function() {
            const key = apiKeyInput.value.trim();
            if (!key) {
                document.getElementById('status').textContent = '请输入密钥';
                return;
            }

            try {
                // 从localStorage获取originalStr字段
                const originalStr = localStorage.getItem('originalStr');
                
                // 模拟后端验证API调用
                const isValid = await verifyApiKey(key, originalStr);
                
                if (isValid) {
                    // 验证成功，设置授权标志并显示专业版按钮
                    isProVersionAuthorized = true;
                    proVersionBtn.classList.remove('hidden');
                    document.getElementById('status').textContent = '密钥验证成功！';
                    // 清空输入框
                    apiKeyInput.value = '';
                    
                    // 向内容脚本发送授权状态更新
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {action: 'updateProAuthStatus', authorized: true}, function(response) {
                            console.log('授权状态已发送到内容脚本:', response);
                        });
                    });
                } else {
                    // 验证失败，确保专业版按钮隐藏并重置授权状态
                    isProVersionAuthorized = false;
                    proVersionBtn.classList.add('hidden');
                    
                    // 同时向内容脚本发送未授权状态
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {action: 'updateProAuthStatus', authorized: false}, function(response) {
                            console.log('未授权状态已发送到内容脚本:', response);
                        });
                    });
                    
                    document.getElementById('status').textContent = '密钥验证失败，请重试';
                }
            } catch (error) {
                console.error('验证过程中出现错误:', error);
                // 验证出错时也重置状态
                isProVersionAuthorized = false;
                proVersionBtn.classList.add('hidden');
                
                // 向内容脚本发送未授权状态
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: 'updateProAuthStatus', authorized: false}, function(response) {
                        console.log('错误状态已发送到内容脚本:', response);
                    });
                });
                
                document.getElementById('status').textContent = '验证失败，请重试';
            }
        });
    }

    // 模拟后端API验证函数
    async function verifyApiKey(key, originalStr) {
        // 这里是模拟的后端验证逻辑
        // 在实际实现中，这里会调用真实的后端API
        return new Promise((resolve) => {
            setTimeout(() => {
                // 模拟验证 - 在实际应用中这会连接到真实后端
                // 可以根据key和originalStr进行某种验证
                console.log('验证密钥:', key, '原始字符串:', originalStr);
                
                // 模拟API验证成功的情况（实际应用中会有真实验证逻辑）
                // 这里可以加入真实的验证逻辑
                const isValid = key && key.length > 0; // 简单模拟验证
                resolve(isValid);
            }, 1000); // 模拟网络请求延迟
        });
    }
});