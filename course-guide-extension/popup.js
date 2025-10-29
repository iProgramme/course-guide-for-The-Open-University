// 课程指南扩展弹窗处理器
var baseUrl = [
  'https://course-guide-for-the-open-universit.vercel.app',
  'http://localhost:3000'
][1]
// 显示toast通知的函数
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'show ' + (type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-info');
    
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 10000);
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
    const freeTrialBtn = document.getElementById('freeTrialBtn');
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

    // 免费试用按钮事件监听器
    if (freeTrialBtn) {
        freeTrialBtn.addEventListener('click', async function() {
            try {
                showToast('正在获取免费试用密钥...', 'info');
                
                // 从当前页面获取originalStr字段
                let originalStr = await getOriginalStrFromPage();
                
                if (!originalStr) {
                    showToast('无法获取当前页面的验证信息，请确保：\n1. 页面已完全加载\n2. 页面包含验证信息\n3. 页面URL在允许的域名范围内', 'error');
                    return;
                }
                
                // 调用后端免费试用API
                const response = await fetch(baseUrl + '/api/keys/trial', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        originalStr: originalStr
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // 获取到试用密钥，但需要先验证密钥的有效性
                    const trialKey = data.data.key;
                    
                    try {
                        // 从当前页面获取originalStr字段用于验证
                        let originalStrForValidation = await getOriginalStrFromPage();
                        
                        if (!originalStrForValidation) {
                            showToast('无法获取当前页面的验证信息，无法验证密钥有效性', 'error');
                            return;
                        }
                        
                        // 验证获取到的试用密钥是否有效
                        const validateResponse = await fetch(baseUrl + '/api/keys/validate', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                key: trialKey,
                                originalStr: originalStrForValidation
                            })
                        });
                        
                        const validateData = await validateResponse.json();
                        
                        if (validateData.success) {
                            // 密钥有效，更新专业版授权状态
                            isProVersionAuthorized = true;
                            currentApiKey = trialKey; // 保存试用密钥
                            
                            // 更新专业版按钮的状态显示
                            const proVersionBtn = document.getElementById('proVersionBtn');
                            if (proVersionBtn) {
                                // 修改按钮文本以反映已授权状态
                                const spans = proVersionBtn.querySelectorAll('span');
                                if (spans.length >= 2) {
                                    spans[1].textContent = '(已授权使用)';
                                    spans[1].style.color = '#4CAF50';
                                }
                            }
                            
                            showToast('免费试用已激活！', 'success');
                            
                            // 隐藏密钥输入区域（因为已经有密钥了）
                            if (keyInputContainer) {
                                keyInputContainer.style.display = 'none';
                            }
                            
                            // 向内容脚本发送授权状态更新
                            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                                chrome.tabs.sendMessage(tabs[0].id, {action: 'updateProAuthStatus', authorized: true, apiKey: trialKey}, function(response) {
                                    console.log('试用授权状态已发送到内容脚本:', response);
                                });
                            });
                            
                            // 启动专业版功能
                            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                                chrome.tabs.sendMessage(tabs[0].id, {action: 'runProVersion'}, function(response) {
                                    console.log(response.status);
                                    showToast('专业版已启动', 'success');
                                });
                            });
                        } else {
                            // 密钥无效（已过期或被禁用）
                            isProVersionAuthorized = false;
                            currentApiKey = '';
                            
                            // 向内容脚本发送未授权状态
                            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                                chrome.tabs.sendMessage(tabs[0].id, {action: 'updateProAuthStatus', authorized: false, apiKey: null}, function(response) {
                                    console.log('未授权状态已发送到内容脚本:', response);
                                });
                            });
                            
                            let invalidReason = validateData.error || '密钥无效';
                            if (invalidReason.includes('过期')) {
                                showToast('免费试用已过期，请联系微信购买新的密钥：teachAIGC', 'error');
                            } else if (invalidReason.includes('禁用')) {
                                showToast('密钥已被禁用，请联系微信购买新的密钥：teachAIGC', 'error');
                            } else {
                                showToast(`获取的试用密钥无效：${invalidReason}`, 'error');
                            }
                        }
                    } catch (validationError) {
                        console.error('验证试用密钥时出错:', validationError);
                        showToast('验证试用密钥时出错，请重试', 'error');
                    }
                } else {
                    console.error('API响应错误:', data);
                    let errorMessage = data.error || '获取免费试用失败';
                    
                    // 如果是500错误，提供更明确的错误信息
                    if (response.status === 500) {
                        errorMessage = `服务器错误 (${response.status}): ${errorMessage}。可能原因：\n1. 后端服务未启动\n2. 数据库连接配置错误\n3. 环境变量未设置\n\n请确保后端服务已启动并正确配置环境变量`;
                    } else if (response.status === 404) {
                        errorMessage = 'API端点未找到，请检查后端服务是否正确部署';
                    }
                    
                    showToast(errorMessage, 'error');
                }
            } catch (error) {
                console.error('获取免费试用过程中出现错误:', error);
                showToast('网络错误，请检查后端服务是否运行', 'error');
            }
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
                const response = await fetch(baseUrl + '/api/keys/verify', {
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