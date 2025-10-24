// ==================== CONFIGURATIONS (可配置项) ====================
const CONFIG = {
    VIDEO_PLAYBACK_RATE: 4.0,       // 视频播放速度
    DEFAULT_WAIT_TIME: 7000,        // 默认等待时间 (ms)
    POLLING_INTERVAL: 1000,         // 轮询间隔 (ms)
    SUB_SECTION_EXPAND_WAIT: 2000,  // 展开子章节后的短暂等待时间 (ms)
};

// ==================== HELPER FUNCTIONS (辅助函数) ====================
// (这部分函数和之前一样，为节省篇幅已折叠，您直接复制完整代码即可)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function handleVideo() { /* ... 代码不变 ... */ 
    console.log("处理视频...");
    const video = document.querySelector('video');
    if (!video) {
        console.log("未找到 video 元素，按默认时间等待。");
        await sleep(CONFIG.DEFAULT_WAIT_TIME);
        return;
    }
    const playBtn = document.querySelector(".mvp-fonts.mvp-fonts-play");
    if (playBtn) playBtn.click();
    video.playbackRate = CONFIG.VIDEO_PLAYBACK_RATE;
    video.muted = true;
    await video.play().catch(e => console.error("视频播放失败，可能是浏览器限制:", e));
    return new Promise(resolve => {
        const checkInterval = setInterval(() => {
            const timeSpans = document.querySelectorAll('.mvp-time-display span');
            if (timeSpans.length >= 2) {
                const [currentTime, totalTime] = [timeSpans[0].textContent, timeSpans[1].textContent];
                if (totalTime && totalTime !== "00:00" && currentTime === totalTime) {
                    console.log("视频播放完毕。");
                    clearInterval(checkInterval);
                    resolve();
                }
            } else if (video.ended) {
                 console.log("视频播放完毕 (ended event)。");
                 clearInterval(checkInterval);
                 resolve();
            }
        }, CONFIG.POLLING_INTERVAL);
    });
}
async function handleMaterial() { /* ... 代码不变 ... */ 
    console.log("处理材料...");
    const viewButtons = document.querySelectorAll('.ivu-table-cell .ng-scope');
    if (viewButtons.length === 0) {
        console.log("未找到'查看'按钮，按默认时间等待。");
        await sleep(CONFIG.DEFAULT_WAIT_TIME);
        return;
    }
    for (const button of viewButtons) {
        if (button.textContent.includes('查看')) {
            console.log("点击'查看'按钮...");
            button.click();
            await sleep(CONFIG.DEFAULT_WAIT_TIME);
            const closeBtn = document.querySelector('#file-previewer > div > div > div.header.clearfix > a');
            if (closeBtn) {
                console.log("关闭预览窗口...");
                closeBtn.click();
            }
            await sleep(2000);
        }
    }
    console.log("所有材料处理完毕。");
}
async function handlePage() { /* ... 代码不变 ... */ 
    console.log("处理普通页面，等待...");
    await sleep(CONFIG.DEFAULT_WAIT_TIME);
}
async function processItems(items, startIndex = 0) { /* ... 代码不变 ... */ 
    for (let i = startIndex; i < items.length; i++) {
        const item = items[i];
        if (!item) continue;
        const titleEl = item.querySelector('.full-screen-mode-sidebar-menu-item-title');
        const titleText = titleEl ? titleEl.textContent.trim() : `项目 ${i+1}`;
        console.log(`--- 开始处理: "${titleText}" ---`);
        item.click();
        await sleep(CONFIG.DEFAULT_WAIT_TIME);
        const icon = item.querySelector('i');
        if (icon) {
            if (icon.classList.contains('font-syllabus-online-video')) {
                await handleVideo();
            } else if (icon.classList.contains('font-syllabus-material')) {
                await handleMaterial();
            } else if (icon.classList.contains('font-syllabus-page')) {
                await handlePage();
            } else {
                 console.log("未知类型项目，按默认方式等待。");
                 await handlePage();
            }
        } else {
            console.log("未找到图标，按默认方式等待。");
            await handlePage();
        }
    }
    console.log("本章节所有项目处理完毕。");
}


/**
 * ================== 主启动函数 (最终修复版) ==================
 */
async function startAutomation() {
    console.log("脚本启动，开始自动化处理所有章节...");

    // 注意：这里的选择器可能需要根据实际情况微调，但根据您的代码，这个是有效的
    const allSections = document.querySelectorAll('.full-screen-mode-sidebar-menu > .full-screen-mode-sidebar-sub-menu');
    
    if (allSections.length === 0) {
        console.error("错误：未找到任何章节！请检查选择器是否正确。");
        return;
    }
    console.log(`总共找到 ${allSections.length} 个章节。`);

    let startSectionIndex = 0;
    let startItemIndex = 0;
    let activeItem = document.querySelector('.full-screen-mode-sidebar-menu-item.active');

    if (activeItem) {
        const currentSection = activeItem.closest('.full-screen-mode-sidebar-menu > .full-screen-mode-sidebar-sub-menu');
        if (currentSection) {
            startSectionIndex = Array.from(allSections).indexOf(currentSection);
            const itemsInCurrentSection = currentSection.querySelectorAll('.full-screen-mode-sidebar-menu-item');
            startItemIndex = Array.from(itemsInCurrentSection).indexOf(activeItem);
            console.log(`检测到活动项，将从第 ${startSectionIndex + 1} 章节的第 ${startItemIndex + 1} 个项目开始。`);
        }
    } else {
        console.log("未检测到活动项，将从第一个章节的第一个项目开始。");
    }

    for (let i = startSectionIndex; i < allSections.length; i++) {
        const section = allSections[i];
        if (!section) continue;

        const sectionTitle = section.querySelector(':scope > .full-screen-mode-sidebar-sub-menu-title');
        const isStartingChapter = (i === startSectionIndex && activeItem);

        if (sectionTitle) {
            const sectionTitleText = sectionTitle.textContent.trim();
            console.log(`\n========================================\n处理章节 (${i + 1}/${allSections.length}): ${sectionTitleText}\n========================================`);

            if (!isStartingChapter) {
                sectionTitle.click();
                await sleep(CONFIG.DEFAULT_WAIT_TIME);
            } else {
                console.log("这是当前活动章节，直接处理内部项目。");
            }
        }

        // 深度展开子章节
        const subSections = section.querySelectorAll(':scope > div > .full-screen-mode-sidebar-sub-menu');
        if (subSections.length > 0) {
            console.log(`检测到 ${subSections.length} 个子章节，将进行智能展开...`);
            for (const subSection of subSections) {
                const subSectionTitle = subSection.querySelector(':scope > .full-screen-mode-sidebar-sub-menu-title');
                
                // 【关键逻辑修正】
                // 只有在满足以下条件之一时，才点击子章节标题：
                // 1. 这不是我们开始的那个主章节 (需要全部展开)
                // 2. 这是我们开始的主章节，但当前这个子章节 *不包含* 我们的活动项 (说明需要展开其他子章节)
                const shouldClickSubSection = !isStartingChapter || (isStartingChapter && !subSection.contains(activeItem));

                if (shouldClickSubSection && subSectionTitle) {
                    console.log(`展开子章节: ${subSectionTitle.textContent.trim()}`);
                    subSectionTitle.click();
                    await sleep(CONFIG.SUB_SECTION_EXPAND_WAIT);
                } else if (subSectionTitle) {
                    console.log(`跳过点击当前活动的子章节: ${subSectionTitle.textContent.trim()}`);
                }
            }
            console.log("所有子章节智能展开完毕。");
        }

        const items = section.querySelectorAll('.full-screen-mode-sidebar-menu-item');
        if (items.length > 0) {
            const currentStartIndex = isStartingChapter ? startItemIndex : 0;
            await processItems(items, currentStartIndex);
        } else {
            console.log("这个章节下没有找到可学习的项目，跳过。");
        }
    }

    console.log("\n🎉🎉🎉 恭喜！所有章节的所有任务已全部完成！ 🎉🎉🎉");
}

// 启动脚本
startAutomation();