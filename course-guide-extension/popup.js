// 课程指南扩展弹窗处理器

// 显示toast通知的函数
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'show ' + (type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-info');
    
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
    // 标签页切换功能
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有激活状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 激活当前标签
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // 通过ID获取元素
    const basic2LevelBtn = document.getElementById('basic2LevelBtn');
    const basic3LevelBtn = document.getElementById('basic3LevelBtn');
    const proVersionBtn = document.getElementById('proVersionBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const verifyKeyBtn = document.getElementById('verifyKeyBtn');
    const keyInputContainer = document.querySelector('.key-input-container');
    const statusDiv = document.getElementById('status');
    
    // 添加一个标志来跟踪密钥验证状态
    let isProVersionAuthorized = false;
    let currentApiKey = '';

    // 为按钮添加点击事件监听器
    if (basic2LevelBtn) {
        basic2LevelBtn.addEventListener('click', function() {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'runBasic2Level'}, function(response) {
                    console.log(response.status);
                    showToast('基础版2级已启动！', 'success');
                });
            });
        });
    }

    if (basic3LevelBtn) {
        basic3LevelBtn.addEventListener('click', function() {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'runBasic3Level'}, function(response) {
                    console.log(response.status);
                    showToast('基础版3级已启动！', 'success');
                });
            });
        });
    }

    if (proVersionBtn) {
        proVersionBtn.addEventListener('click', function() {
            // 在执行专业版功能前，再次检查授权状态
            if (!isProVersionAuthorized) {
                showToast('请先验证密钥以使用专业版功能！', 'error');
                return;
            }
            
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'runProVersion'}, function(response) {
                    console.log(response.status);
                    showToast(response.status || '专业版已启动', 'success');
                });
            });
        });
    }

    // 验证密钥功能 - 调用后端验证API
    if (verifyKeyBtn) {
        verifyKeyBtn.addEventListener('click', async function() {
            const key = apiKeyInput.value.trim();
            if (!key) {
                showToast('请输入密钥', 'error');
                return;
            }

            try {
                showToast('正在验证密钥...', 'info');
                
                // 从当前页面获取originalStr字段
                let originalStr = await getOriginalStrFromPage();
                
                console.log('第一次尝试获取的originalStr:', originalStr);
                
                // 如果第一次尝试失败，可以尝试备用方法
                if (!originalStr) {
                    console.log('第一次获取失败，尝试备用方法...');
                    // 这里可以添加备用获取方法
                    // 但现在我们先记录错误并停止
                }
                
                console.log('最终获取到的originalStr:', originalStr);
                console.log('originalStr类型:', typeof originalStr);
                console.log('originalStr长度:', originalStr ? originalStr.length : 0);
                
                if (!originalStr) {
                    showToast('无法获取当前页面的验证信息，请确保：\n1. 页面已完全加载\n2. 页面包含验证信息\n3. 页面URL在允许的域名范围内', 'error');
                    return;
                }
                
                // 调用后端验证API，发送密钥和originalStr
                const response = await fetch('http://localhost:3000/api/keys/verify', {
                    method: 'POST', // 改为POST以发送更多数据
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        key: key,
                        originalStr: originalStr
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // 验证成功，设置授权标志
                    isProVersionAuthorized = true;
                    currentApiKey = key; // 保存当前密钥
                    showToast('密钥验证成功！专业版已解锁', 'success');
                    
                    // 隐藏密钥输入区域
                    if (keyInputContainer) {
                        keyInputContainer.style.display = 'none';
                    }
                    
                    // 向内容脚本发送授权状态更新
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {action: 'updateProAuthStatus', authorized: true, apiKey: key}, function(response) {
                            console.log('授权状态已发送到内容脚本:', response);
                        });
                    });
                } else {
                    // 验证失败，重置授权状态
                    isProVersionAuthorized = false;
                    currentApiKey = '';
                    
                    // 向内容脚本发送未授权状态
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {action: 'updateProAuthStatus', authorized: false, apiKey: null}, function(response) {
                            console.log('未授权状态已发送到内容脚本:', response);
                        });
                    });
                    
                    showToast(data.error || '密钥验证失败，请重试', 'error');
                }
            } catch (error) {
                console.error('验证过程中出现错误:', error);
                // 验证出错时重置状态
                isProVersionAuthorized = false;
                currentApiKey = '';
                
                // 向内容脚本发送未授权状态
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: 'updateProAuthStatus', authorized: false, apiKey: null}, function(response) {
                        console.log('错误状态已发送到内容脚本:', response);
                    });
                });
                
                showToast('网络错误，请检查后端服务是否运行', 'error');
            }
        });
    }
    
    // 从当前页面获取originalStr的函数
    async function getOriginalStrFromPage() {
        console.log('开始查询活动标签页...');
        
        try {
            const tabs = await new Promise((resolve, reject) => {
                chrome.tabs.query({active: true, currentWindow: true}, (result) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(result);
                    }
                });
            });
            
            if (!tabs || tabs.length === 0) {
                console.error('未找到活动标签页');
                return '';
            }
            
            const tab = tabs[0];
            console.log('找到活动标签页:', tab);
            
            // 检查标签页状态，如果是loading状态，等待一段时间再获取
            if (tab.status !== 'complete') {
                console.log('标签页尚未加载完成，当前状态:', tab.status);
                // 等待1秒钟再尝试
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // 直接使用chrome.scripting.executeScript获取页面的localStorage
            console.log('尝试直接通过scripting API获取originalStr，tabId:', tab.id);
            
            const results = await new Promise((resolve, reject) => {
                try {
                    chrome.scripting.executeScript({
                        target: {tabId: tab.id},
                        func: () => {
                            try {
                                // console.log('在页面上下文中执行，尝试获取originalStr');
                                const value = localStorage.getItem('originalStr');
                                // todo
                                // console.log('在页面上下文中获取到的originalStr:', value);
                                return value || '';
                            } catch (e) {
                                console.error('在页面上下文中获取originalStr时出错:', e);
                                return '';
                            }
                        }
                    }, (results) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(results);
                        }
                    });
                } catch (error) {
                    reject(error);
                }
            });
            
            if (results && results.length > 0 && results[0].result !== undefined) {
                console.log('直接执行脚本成功获取originalStr:', results[0].result);
                return results[0].result || '';
            } else {
                console.error('直接执行脚本未返回预期结果:', results);
                return '';
            }
        } catch (error) {
            console.error('获取originalStr时出错:', error);
            return '';
        }
    }
    
    // 回车键支持密钥验证
    if (apiKeyInput) {
        apiKeyInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyKeyBtn.click();
            }
        });
    }
});