// 课程指南扩展 - 综合脚本
// 该文件包含所有三个版本：基础版（2级），基础版（3级）和专业版

// ================ 基础版 - 2级目录 ================
// 基于 源文件-二级目录用这个.js
const Basic2Level = {
  /**
   * 处理2级目录课程自动化
   */
  processMenuItems: function() {
    console.log('开始处理菜单项，有问题请联系作者微信：teachAIGC');
    
    // 1. 获取当前active元素
    const activeItem = document.querySelector('.full-screen-mode-sidebar-menu-item.active');
    if (!activeItem) {
        console.log('未找到active元素，有问题请联系作者微信：teachAIGC');
        return;
    }

    // 2. 获取父元素下的所有菜单项
    const parent = activeItem.parentElement;
    const allItems = parent.querySelectorAll('.full-screen-mode-sidebar-menu-item');

    // 找到当前active元素的索引
    let currentIndex = Array.from(allItems).indexOf(activeItem);

    // 开始处理
    this.processNextItem(currentIndex, allItems);
  },

  processNextItem: function(index, items) {
    if (index >= items.length) {
        console.log('完成所有，有问题请联系作者微信：teachAIGC');
        return;
    }

    const currentItem = items[index];

    // 3. 检查i标签的class并执行相应操作
    const icon = currentItem.querySelector('i');
    if (icon) {
        // console.log('当前章节的i标签:', icon.classList);
        if (icon.classList.contains('font-syllabus-material')) {
            this.handleMaterialItem(index, items);
        } else if (icon.classList.contains('font-syllabus-online-video')) {
            this.handleVideoItem(index, items);
        }
    } else {
        // 没有找到i标签，直接进入下一步
        setTimeout(() => {
            this.clickNextItem(index, items);
        }, 7000);
    }
  },

  handleMaterialItem: function(index, items) {
    // 获取所有.ivu-table-cell .ng-scope元素
    const materialElements = document.querySelectorAll('.ivu-table-cell .ng-scope');
    // console.log('当前章节的所有.ivu-table-cell .ng-scope元素:', materialElements);

    if (materialElements.length === 0) {
        setTimeout(() => {
            this.clickNextItem(index, items);
        }, 7000);
        return;
    }

    this.processMaterialElements(0, materialElements, index, items);
  },

  processMaterialElements: function(currentMatIndex, materialElements, menuIndex, menuItems) {
    if (currentMatIndex >= materialElements.length) {
        setTimeout(() => {
            this.clickNextItem(menuIndex, menuItems);
        }, 7000);
        return;
    }

    // 点击当前.ivu-table-cell .ng-scope元素
    materialElements[currentMatIndex].click();

    setTimeout(() => {
        // 点击后等待7秒，然后点击预览器的关闭按钮
        const closeBtn = document.querySelector('#file-previewer > div > div > div.header.clearfix > a');
        if (closeBtn) {
            closeBtn.click();
        }

        // 继续处理下一个.ivu-table-cell .ng-scope元素
        setTimeout(() => {
            this.processMaterialElements(currentMatIndex + 1, materialElements, menuIndex, menuItems);
        }, 2000);
    }, 7000);
  },

  handleVideoItem: function(index, items) {
    // 点击播放按钮
    const playBtn = document.querySelector('.mvp-fonts.mvp-fonts-play');
    if (playBtn) {
        playBtn.click();
    }

    const video = document.querySelector('video');
    // if (video) {
    //     video.playbackRate = 4;
    // }

    // 开始检查时间显示
    this.checkVideoTime(index, items);
  },

  checkVideoTime: function(menuIndex, menuItems) {
    const timeDisplays = document.querySelectorAll('.mvp-time-display span');

    if (timeDisplays.length >= 2) {
        const currentTime = timeDisplays[0].textContent;
        const duration = timeDisplays[1].textContent;

        if (currentTime === duration) {
            // 视频播放完毕，进入下一步
            setTimeout(() => {
                this.clickNextItem(menuIndex, menuItems);
            }, 7000);
            return;
        }
    }

    // 未播放完毕，1秒后再次检查
    setTimeout(() => {
        this.checkVideoTime(menuIndex, menuItems);
    }, 1000);
  },

  clickNextItem: function(currentIndex, items) {
    if (currentIndex + 1 < items.length) {
        // 点击下一个菜单项
        items[currentIndex + 1].click();

        // 等待7秒后处理下一个菜单项
        setTimeout(() => {
            this.processNextItem(currentIndex + 1, items);
        }, 7000);
    } else {
        // 已经是最后一个，打印完成
        setTimeout(() => {
            console.log('完成所有，有问题请联系作者微信：teachAIGC');
        }, 7000);
    }
  }
};

// ================ 基础版 - 3级目录 ================
// 基于 源文件-三级目录用这个.js
const Basic3Level = {
  /**
   * 处理3级目录课程自动化
   */
  runNextSection: function() {
    // 获取当前激活的菜单项
    const activeItem = document.querySelector('.full-screen-mode-sidebar-menu-item.active');
    if (!activeItem) return;

    // 找到当前章节
    const currentSection = activeItem.closest('.full-screen-mode-sidebar-sub-menu.has-line');
    if (!currentSection) return;

    // 获取所有章节
    const sections = document.querySelectorAll('.full-screen-mode-sidebar-sub-menu.has-line');
    
    // 找到下一个章节
    let nextSection = null;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i] === currentSection && i < sections.length - 1) {
        nextSection = sections[i + 1];
        break;
      }
    }

    if (nextSection) {
      // 点击下一个章节
      const nextTitle = nextSection.querySelector('.full-screen-mode-sidebar-sub-menu-title');
      if (nextTitle) {
        nextTitle.click();
        
        // 等待章节加载
        setTimeout(() => {
          // 获取下一个章节中的所有项目
          const arr = nextSection.querySelectorAll('.full-screen-mode-sidebar-menu-item-title');
          const arrChild = nextSection.querySelectorAll('.full-screen-mode-sidebar-menu-item');
          
          if (arr.length > 0) {
            this.runElementsSequentially(arr, arrChild, 0);
          } else {
            this.runNextSection(); // 如果未找到项目，转到下一个章节
          }
        }, 7000);
      }
    } else {
      console.log('基础版3级: 所有章节已完成');
    }
  },

  runElementsSequentially: function(arr, arrChild, index) {
    if (index >= arr.length) {
      // 当前章节完成，转到下一个章节
      this.runNextSection();
      return;
    }
    
    arr[index].click();
    
    setTimeout(() => {
      const currentItem = arrChild[index];
      const icon = currentItem.querySelector('i');
      
      if (icon && icon.classList.contains('font-syllabus-online-video')) {
        const video = document.querySelector('video');
        if (video) {
          const playBtn = document.querySelector(".mvp-fonts.mvp-fonts-play");
          if(playBtn) playBtn.click();
          
          video.play();
          
          const checkInterval = setInterval(() => {
            const timeSpans = document.querySelectorAll('.mvp-time-display span');
            if (timeSpans.length >= 2) {
              const [currentTime, totalTime] = timeSpans;
              if (currentTime.textContent === totalTime.textContent) {
                clearInterval(checkInterval);
                this.runElementsSequentially(arr, arrChild, index + 1);
              }
            }
          }, 1000);
          return;
        }
      } else if (icon && icon.classList.contains('font-syllabus-page')) {
        setTimeout(() => {
          this.runElementsSequentially(arr, arrChild, index + 1);
        }, 7000);
        return;
      } else if(icon && icon.classList.contains('font-syllabus-material')){
        // 获取所有"查看"按钮
        const viewButtons = document.querySelectorAll('.ivu-table-cell .ng-scope');
        let currentIndex = 0;
        
        const clickNextViewButton = () => {
          if (currentIndex >= viewButtons.length) {
            // 所有"查看"按钮已处理，继续下一个项目
            setTimeout(() => {
              this.runElementsSequentially(arr, arrChild, index + 1);
            }, 7000);
            return;
          }
          
          const button = viewButtons[currentIndex];
          if (button.textContent.includes('查看')) {
            button.click();
            
            // 7秒后关闭预览器
            setTimeout(() => {
              const closeBtn = document.querySelector('#file-previewer > div > div > div.header.clearfix > a');
              if (closeBtn) closeBtn.click();
              
              // 继续下一个"查看"按钮
              currentIndex++;
              setTimeout(clickNextViewButton, 7000);
            }, 7000);
          } else {
            // 如果不是"查看"按钮则跳过
            currentIndex++;
            clickNextViewButton();
          }
        };
        
        // 开始处理"查看"按钮
        clickNextViewButton();
        return;
      }

      this.runElementsSequentially(arr, arrChild, index + 1);
    }, 7000);
  },

  // 初始化3级自动化
  init: function() {
    console.log('基础版3级: 脚本已启动');
    
    const activeItem = document.querySelector('.full-screen-mode-sidebar-menu-item.active');
    if (activeItem) {
      const currentSection = activeItem.closest('.full-screen-mode-sidebar-sub-menu.has-line');
      if (currentSection) {
        const arr = currentSection.querySelectorAll('.full-screen-mode-sidebar-menu-item-title');
        const arrChild = currentSection.querySelectorAll('.full-screen-mode-sidebar-menu-item');
        
        // 找到激活项目的索引
        let startIndex = 0;
        for (let i = 0; i < arrChild.length; i++) {
          if (arrChild[i].classList.contains('active')) {
            startIndex = i;
            break;
          }
        }
        
        this.runElementsSequentially(arr, arrChild, startIndex);
      }
    } else {
      // 如果没有激活项目，从第一个章节开始
      const sections = document.querySelectorAll('.full-screen-mode-sidebar-sub-menu.has-line');
      if (sections.length > 0) {
        const firstTitle = sections[0].querySelector('.full-screen-mode-sidebar-sub-menu-title');
        if (firstTitle) {
          firstTitle.click();
          setTimeout(() => {
            const arr = sections[0].querySelectorAll('.full-screen-mode-sidebar-menu-item-title');
            const arrChild = sections[0].querySelectorAll('.full-screen-mode-sidebar-menu-item');
            if (arr.length > 0) {
              this.runElementsSequentially(arr, arrChild, 0);
            }
          }, 7000);
        }
      }
    }
  }
};

// ================ 专业版 ================
// 基于 史上最强.js
const ProVersion = {
  // 配置
  CONFIG: {
    VIDEO_PLAYBACK_RATE: 4.0,       // 视频播放速度
    DEFAULT_WAIT_TIME: 7000,        // 默认等待时间 (ms)
    POLLING_INTERVAL: 1000,         // 轮询间隔 (ms)
    SUB_SECTION_EXPAND_WAIT: 2000,  // 展开子章节后的短暂等待时间 (ms)
  },

  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  handleVideo: async function() {
    console.log("专业版: 处理视频...");
    const video = document.querySelector('video');
    if (!video) {
      console.log("专业版: 未找到视频元素，等待默认时间。");
      await this.sleep(this.CONFIG.DEFAULT_WAIT_TIME);
      return;
    }
    const playBtn = document.querySelector(".mvp-fonts.mvp-fonts-play");
    if (playBtn) playBtn.click();
    video.playbackRate = this.CONFIG.VIDEO_PLAYBACK_RATE;
    video.muted = true;
    await video.play().catch(e => console.error("专业版: 视频播放失败，可能是浏览器限制:", e));
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        const timeSpans = document.querySelectorAll('.mvp-time-display span');
        if (timeSpans.length >= 2) {
          const [currentTime, totalTime] = [timeSpans[0].textContent, timeSpans[1].textContent];
          if (totalTime && totalTime !== "00:00" && currentTime === totalTime) {
            console.log("专业版: 视频完成。");
            clearInterval(checkInterval);
            resolve();
          }
        } else if (video.ended) {
             console.log("专业版: 视频完成 (ended 事件)。");
             clearInterval(checkInterval);
             resolve();
        }
      }, this.CONFIG.POLLING_INTERVAL);
    });
  },

  handleMaterial: async function() {
    console.log("专业版: 处理材料...");
    const viewButtons = document.querySelectorAll('.ivu-table-cell .ng-scope');
    if (viewButtons.length === 0) {
      console.log("专业版: 未找到'查看'按钮，等待默认时间。");
      await this.sleep(this.CONFIG.DEFAULT_WAIT_TIME);
      return;
    }
    for (const button of viewButtons) {
      if (button.textContent.includes('查看')) {
        console.log("专业版: 点击'查看'按钮...");
        button.click();
        await this.sleep(this.CONFIG.DEFAULT_WAIT_TIME);
        const closeBtn = document.querySelector('#file-previewer > div > div > div.header.clearfix > a');
        if (closeBtn) {
          console.log("专业版: 关闭预览...");
          closeBtn.click();
        }
        await this.sleep(2000);
      }
    }
    console.log("专业版: 所有材料已处理。");
  },

  handlePage: async function() {
    console.log("专业版: 处理常规页面，等待...");
    await this.sleep(this.CONFIG.DEFAULT_WAIT_TIME);
  },

  processItems: async function(items, startIndex = 0) {
    for (let i = startIndex; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      const titleEl = item.querySelector('.full-screen-mode-sidebar-menu-item-title');
      const titleText = titleEl ? titleEl.textContent.trim() : `项目 ${i+1}`;
      console.log(`专业版: --- 开始处理: "${titleText}" ---`);
      item.click();
      await this.sleep(this.CONFIG.DEFAULT_WAIT_TIME);
      const icon = item.querySelector('i');
      if (icon) {
        if (icon.classList.contains('font-syllabus-online-video')) {
          await this.handleVideo();
        } else if (icon.classList.contains('font-syllabus-material')) {
          await this.handleMaterial();
        } else if (icon.classList.contains('font-syllabus-page')) {
          await this.handlePage();
        } else {
             console.log("专业版: 未知项目类型，默认等待。");
             await this.handlePage();
        }
      } else {
        console.log("专业版: 未找到图标，默认等待。");
        await this.handlePage();
      }
    }
    console.log("专业版: 本章节所有项目已处理。");
  },

  /**
   * 主自动化函数
   */
  startAutomation: async function() {
    console.log("专业版: 脚本启动，开始完全自动化...");

    // 注意：这里的选择器可能需要根据实际情况微调，但根据您的代码，这个是有效的
    const allSections = document.querySelectorAll('.full-screen-mode-sidebar-menu > .full-screen-mode-sidebar-sub-menu');
    
    if (allSections.length === 0) {
      console.error("专业版: 错误: 未找到章节！请检查选择器是否正确。");
      return;
    }
    console.log(`专业版: 总共找到 ${allSections.length} 个章节。`);

    let startSectionIndex = 0;
    let startItemIndex = 0;
    let activeItem = document.querySelector('.full-screen-mode-sidebar-menu-item.active');

    if (activeItem) {
        const currentSection = activeItem.closest('.full-screen-mode-sidebar-menu > .full-screen-mode-sidebar-sub-menu');
        if (currentSection) {
            startSectionIndex = Array.from(allSections).indexOf(currentSection);
            const itemsInCurrentSection = currentSection.querySelectorAll('.full-screen-mode-sidebar-menu-item');
            startItemIndex = Array.from(itemsInCurrentSection).indexOf(activeItem);
            console.log(`专业版: 检测到激活项目，从章节 ${startSectionIndex + 1}，项目 ${startItemIndex + 1} 开始。`);
        }
    } else {
        console.log("专业版: 未检测到激活项目，从第一个章节和第一个项目开始。");
    }

    for (let i = startSectionIndex; i < allSections.length; i++) {
        const section = allSections[i];
        if (!section) continue;

        const sectionTitle = section.querySelector(':scope > .full-screen-mode-sidebar-sub-menu-title');
        const isStartingChapter = (i === startSectionIndex && activeItem);

        if (sectionTitle) {
            const sectionTitleText = sectionTitle.textContent.trim();
            console.log(`\n========================================\n专业版: 处理章节 (${i + 1}/${allSections.length}): ${sectionTitleText}\n========================================`);

            if (!isStartingChapter) {
                sectionTitle.click();
                await this.sleep(this.CONFIG.DEFAULT_WAIT_TIME);
            } else {
                console.log("专业版: 这是当前活动章节，直接处理内部项目。");
            }
        }

        // 深度展开子章节
        const subSections = section.querySelectorAll(':scope > div > .full-screen-mode-sidebar-sub-menu');
        if (subSections.length > 0) {
            console.log(`专业版: 检测到 ${subSections.length} 个子章节，将进行智能展开...`);
            for (const subSection of subSections) {
                const subSectionTitle = subSection.querySelector(':scope > .full-screen-mode-sidebar-sub-menu-title');
                
                // 【关键逻辑修正】
                // 只有在满足以下条件之一时，才点击子章节标题：
                // 1. 这不是我们开始的那个主章节 (需要全部展开)
                // 2. 这是我们开始的主章节，但当前这个子章节 *不包含* 我们的活动项 (说明需要展开其他子章节)
                const shouldClickSubSection = !isStartingChapter || (isStartingChapter && !subSection.contains(activeItem));

                if (shouldClickSubSection && subSectionTitle) {
                    console.log(`专业版: 展开子章节: ${subSectionTitle.textContent.trim()}`);
                    subSectionTitle.click();
                    await this.sleep(this.CONFIG.SUB_SECTION_EXPAND_WAIT);
                } else if (subSectionTitle) {
                    console.log(`专业版: 跳过点击当前活动的子章节: ${subSectionTitle.textContent.trim()}`);
                }
            }
            console.log("专业版: 所有子章节智能展开完毕。");
        }

        const items = section.querySelectorAll('.full-screen-mode-sidebar-menu-item');
        if (items.length > 0) {
            const currentStartIndex = isStartingChapter ? startItemIndex : 0;
            await this.processItems(items, currentStartIndex);
        } else {
            console.log("专业版: 此章节中未找到可学习的项目，跳过。");
        }
    }

    console.log("\n🎉🎉🎉 专业版: 所有章节和任务已完成！ 🎉🎉🎉");
  }
};

// ================ 扩展弹窗控制器 ================
const ExtensionController = {
  // 添加一个标志来跟踪专业版授权状态
  isProVersionAuthorized: false,

  init: function() {
    // 监听来自弹窗的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'runBasic2Level') {
        Basic2Level.processMenuItems();
        sendResponse({status: '基础版2级已启动'});
      } else if (request.action === 'runBasic3Level') {
        Basic3Level.init();
        sendResponse({status: '基础版3级已启动'});
      } else if (request.action === 'runProVersion') {
        // 检查专业版是否已授权
        if (!this.isProVersionAuthorized) {
          sendResponse({status: '专业版未授权，请先在弹窗中验证密钥'});
          return;
        }
        ProVersion.startAutomation();
        sendResponse({status: '专业版已启动'});
      } 
      // 添加授权状态更新消息处理
      else if (request.action === 'updateProAuthStatus') {
        this.isProVersionAuthorized = request.authorized || false;
        sendResponse({status: `授权状态已更新: ${this.isProVersionAuthorized}`});
      }
    });
    
    console.log('课程指南扩展: 控制器已初始化');
  }
};

// DOM加载时初始化扩展
document.addEventListener('DOMContentLoaded', function() {
  ExtensionController.init();
});

// 如果DOM已加载也立即初始化
if (document.readyState === 'loading') {
  // 仍在加载，等待事件
} else {
  // 已加载，立即初始化
  ExtensionController.init();
}