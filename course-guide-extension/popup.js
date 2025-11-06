// 课程指南扩展弹窗处理器
var baseUrl = [
  'https://course-guide-for-the-open-universit.vercel.app',
  'http://localhost:3000'
][0];
// 显示toast通知的函数
function showToast(message, type) {
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
                
                // 从当前页面获取globalData字段（之前为originalStr）
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
                    // 获取到试用密钥，可能是新生成的，也可能是现有的有效密钥
                    const trialKey = data.data.key;
                    
                    try {
                        // 从当前页面获取globalData字段用于验证（之前为originalStr）
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
                            
                            showToast(data.data.message || '免费试用已激活！', 'success');
                            
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
                    // 处理免费试用API返回的错误状态，比如密钥已存在但无效的情况
                    let errorMessage = data.error || '获取免费试用失败';
                    
                    // 检查是否是409错误（密钥已存在但无效）
                    if (response.status === 409) {
                        // 显示密钥状态信息，包含联系微信teachAIGC的说明
                        showToast(errorMessage, 'error');
                    } else {
                        // 其他错误
                        if (response.status === 500) {
                            errorMessage = `服务器错误 (${response.status}): ${errorMessage}。可能原因：\n1. 后端服务未启动\n2. 数据库连接配置错误\n3. 环境变量未设置\n\n请确保后端服务已启动并正确配置环境变量`;
                        } else if (response.status === 404) {
                            errorMessage = 'API端点未找到，请检查后端服务是否正确部署';
                        }
                        showToast(errorMessage, 'error');
                    }
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
                
                // 从当前页面获取globalData字段（之前为originalStr）
                let originalStr = await getOriginalStrFromPage();
                
                console.log('第一次尝试获取的globalData (作为originalStr):', originalStr);
                
                // 如果第一次尝试失败，可以尝试备用方法
                if (!originalStr) {
                    console.log('第一次获取失败，尝试备用方法...');
                    // 这里可以添加备用获取方法
                    // 但现在我们先记录错误并停止
                }
                
                console.log('最终获取到的globalData (作为originalStr):', originalStr);
                console.log('originalStr类型:', typeof originalStr);
                console.log('originalStr长度:', originalStr ? originalStr.length : 0);
                
                if (!originalStr) {
                    showToast('无法获取当前页面的验证信息，请确保：\n1. 页面已完全加载\n2. 页面包含验证信息\n3. 页面URL在允许的域名范围内', 'error');
                    return;
                }
                
                // 调用后端验证API，发送密钥和globalData（以originalStr字段名）
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
    
    // 专门从globalData.user获取用户信息的函数
    async function getGlobalDataFromPage() {
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
                // 等待3秒钟再尝试，确保页面完全加载
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            // 方法1: 尝试使用chrome.scripting.executeScript（现代方法）
            try {
                const results = await chrome.scripting.executeScript({
                    target: {tabId: tab.id},
                    world: 'MAIN',  // 在主页面上下文中运行，可以访问所有全局变量
                    func: () => {
                        // 尝试多种方式获取 globalData
                        let globalData = null;
                        
                        // 首先检查 window.globalData
                        if (window && typeof window.globalData !== 'undefined') {
                            globalData = window.globalData;
                            console.log('找到 window.globalData');
                        }
                        
                        // 如果没找到，检查其他可能的对象
                        if (!globalData) {
                            // 遍历window对象的属性，寻找包含user信息的对象
                            for (const key in window) {
                                if (window.hasOwnProperty(key)) {
                                    try {
                                        const obj = window[key];
                                        if (obj && typeof obj === 'object' && !Array.isArray(obj) && 
                                            obj.user && typeof obj.user === 'object' && 
                                            obj.user.name && obj.user.userNo) {
                                            globalData = obj;
                                            console.log(`在 window.${key} 中找到用户信息`);
                                            break;
                                        }
                                    } catch (e) {
                                        // 跨域错误，继续下一个
                                        continue;
                                    }
                                }
                            }
                        }
                        
                        // 如果找到了包含用户信息的对象
                        if (globalData && typeof globalData === 'object' && globalData.user) {
                            const user = globalData.user;
                            
                            // 获取 name 和 userNo，支持多种可能的字段名
                            const userName = user.name || user.userName || user.Name || user.username || 
                                           user.nickName || user.displayName || user.realName || '';
                            const userNo = user.userNo || user.UserNo || user.studentNo || user.studentId || 
                                         user.id || user.userId || user.StudentNo || user.userNumber || '';
                            
                            if (userName && userNo) {
                                // console.log('todo 成功获取用户信息:', {name: userName, no: userNo});
                                return userName + '|' + userNo;
                            } else {
                                // 用户信息不完整但有部分信息
                                return userName || userNo || JSON.stringify(user) || '';
                            }
                        } else if (globalData && globalData.name && globalData.userNo) {
                            // 检查globalData本身是否包含用户信息
                            return globalData.name + '|' + globalData.userNo;
                        } else {
                            console.log('未找到包含用户信息的对象');
                            return '';
                        }
                    }
                });
                
                if (results && results.length > 0 && results[0].result) {
                    console.log('通过MAIN world executeScript成功获取信息:', results[0].result);
                    return results[0].result;
                }
            } catch (executeError) {
                console.error('executeScript方法失败:', executeError);
            }
            
            // 如果上述方法都失败，尝试使用旧版的 chrome.tabs.executeScript 方法
            // 这种方法可以绕过某些CSP限制
            try {
                const result = await new Promise((resolve, reject) => {
                    chrome.tabs.executeScript(tab.id, {
                        code: `
                            (function() {
                                // 尝试获取 globalData 变量的值
                                let result = '';
                                
                                // 检查 window.globalData
                                if (window && typeof window.globalData !== 'undefined' && 
                                    window.globalData.user && 
                                    window.globalData.user.name && 
                                    window.globalData.user.userNo) {
                                    result = window.globalData.user.name + '|' + window.globalData.user.userNo;
                                } 
                                // 遍历window对象查找包含用户信息的对象
                                else {
                                    for (let key in window) {
                                        if (window.hasOwnProperty(key)) {
                                            try {
                                                const obj = window[key];
                                                if (obj && typeof obj === 'object' && !Array.isArray(obj) && 
                                                    obj.user && typeof obj.user === 'object' && 
                                                    obj.user.name && obj.user.userNo) {
                                                    result = obj.user.name + '|' + obj.user.userNo;
                                                    break;
                                                }
                                            } catch (e) {
                                                // 跳过跨域错误
                                                continue;
                                            }
                                        }
                                    }
                                }
                                
                                // 如果仍未找到，并且页面上有 globalData 变量（但不在window上）
                                if (!result) {
                                    try {
                                        // 这部分不会在CSP限制下工作，但我们尝试其他方式
                                        // 检查页面中的script标签
                                        const scripts = document.querySelectorAll('script');
                                        for (const script of scripts) {
                                            if (script.textContent && 
                                                (script.textContent.includes('globalData') || 
                                                 script.textContent.includes('user') || 
                                                 script.textContent.includes('name') || 
                                                 script.textContent.includes('userNo'))) {
                                                // 尝试从内联脚本中提取变量（如果可能）
                                                // 这种方式无法直接提取，但可以记录相关信息
                                            }
                                        }
                                    } catch (e) {
                                        console.log('检查页面script标签时出错:', e.message);
                                    }
                                }
                                
                                return result;
                            })();
                        `
                    }, (results) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(results);
                        }
                    });
                });
                
                if (result && result[0]) {
                    console.log('通过 tabs.executeScript 成功获取信息:', result[0]);
                    return result[0];
                }
            } catch (tabError) {
                console.error('tabs.executeScript 方法失败:', tabError);
            }
            
            console.error('所有方法都未能获取到globalData变量');
            return '';
        } catch (error) {
            console.error('获取globalData.user信息时出错:', error);
            return '';
        }
    }
    
    // 保留原有函数名以便向后兼容，但内部调用新的globalData获取函数
    async function getOriginalStrFromPage() {
        return await getGlobalDataFromPage();
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