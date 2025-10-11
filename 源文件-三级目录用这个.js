// 该脚本的作用是：
// 有三级目录的情况下，完成整个章节



// 获取所有章节节点
const sections = document.querySelectorAll('.full-screen-mode-sidebar-sub-menu.has-line');

function runNextSection() {
    // 获取当前激活的菜单项
    const activeItem = document.querySelector('.full-screen-mode-sidebar-menu-item.active');
    if (!activeItem) return;

    // 找到当前所属的章节
    const currentSection = activeItem.closest('.full-screen-mode-sidebar-sub-menu.has-line');
    if (!currentSection) return;

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
                // 获取当前章节的所有子项
                const arr = nextSection.querySelectorAll('.full-screen-mode-sidebar-menu-item-title');
                const arrChild = nextSection.querySelectorAll('.full-screen-mode-sidebar-menu-item');
                
                if (arr.length > 0) {
                    runElementsSequentially(arr, arrChild, 0);
                } else {
                    runNextSection(); // 如果没找到子项，继续下一个章节
                }
            }, 7000);
        }
    } else {
        console.log('所有章节已完成，有问题请联系作者微信：teachAIGC');
    }
}

function runElementsSequentially(arr, arrChild, index) {
    if (index >= arr.length) {
        // 当前章节完成，进入下一章节
        runNextSection();
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
                
                // video.playbackRate = 4;
                video.play();
                
                const checkInterval = setInterval(() => {
                    const timeSpans = document.querySelectorAll('.mvp-time-display span');
                    if (timeSpans.length >= 2) {
                        const [currentTime, totalTime] = timeSpans;
                        if (currentTime.textContent === totalTime.textContent) {
                            clearInterval(checkInterval);
                            runElementsSequentially(arr, arrChild, index + 1);
                        }
                    }
                }, 1000);
                return;
            }
        } else if (icon && icon.classList.contains('font-syllabus-page')) {
            setTimeout(() => {
                runElementsSequentially(arr, arrChild, index + 1);
            }, 7000);
            return;
        }else if(icon && icon.classList.contains('font-syllabus-material')){
            // 获取所有"查看"按钮
            const viewButtons = document.querySelectorAll('.ivu-table-cell .ng-scope');
            let currentIndex = 0;
            
            function clickNextViewButton() {
                if (currentIndex >= viewButtons.length) {
                    // 所有"查看"按钮处理完成，继续下一个项目
                    setTimeout(() => {
                        runElementsSequentially(arr, arrChild, index + 1);
                    }, 7000);
                    return;
                }
                
                const button = viewButtons[currentIndex];
                if (button.textContent.includes('查看')) {
                    button.click();
                    
                    // 5秒后点击预览器的关闭按钮
                    setTimeout(() => {
                        const closeBtn = document.querySelector('#file-previewer > div > div > div.header.clearfix > a');
                        if (closeBtn) closeBtn.click();
                        
                        // 继续点击下一个"查看"按钮
                        currentIndex++;
                        setTimeout(clickNextViewButton, 7000);
                    }, 7000);
                } else {
                    // 如果不是"查看"按钮，跳过
                    currentIndex++;
                    clickNextViewButton();
                }
            }
            
            // 开始处理"查看"按钮
            clickNextViewButton();
            return;
        }

        runElementsSequentially(arr, arrChild, index + 1);
    }, 7000);
}
console.log('脚本已启动，有问题请联系作者微信：teachAIGC');
// 启动脚本
const activeItem = document.querySelector('.full-screen-mode-sidebar-menu-item.active');
if (activeItem) {
    const currentSection = activeItem.closest('.full-screen-mode-sidebar-sub-menu.has-line');
    if (currentSection) {
        const arr = currentSection.querySelectorAll('.full-screen-mode-sidebar-menu-item-title');
        const arrChild = currentSection.querySelectorAll('.full-screen-mode-sidebar-menu-item');
        
        // 找到当前激活项的索引
        let startIndex = 0;
        for (let i = 0; i < arrChild.length; i++) {
            if (arrChild[i].classList.contains('active')) {
                startIndex = i;
                break;
            }
        }
        
        runElementsSequentially(arr, arrChild, startIndex);
    }
} else {
    // 如果没有激活项，从第一个章节开始
    if (sections.length > 0) {
        const firstTitle = sections[0].querySelector('.full-screen-mode-sidebar-sub-menu-title');
        if (firstTitle) {
            firstTitle.click();
            setTimeout(() => {
                const arr = sections[0].querySelectorAll('.full-screen-mode-sidebar-menu-item-title');
                const arrChild = sections[0].querySelectorAll('.full-screen-mode-sidebar-menu-item');
                if (arr.length > 0) {
                    runElementsSequentially(arr, arrChild, 0);
                }
            }, 7000);
        }
    }
}