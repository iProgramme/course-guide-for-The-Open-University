// 该脚本的作用是：
// 只有二级目录的情况下，自动点击每个章节的材料和视频。



function processMenuItems() {
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
    processNextItem(currentIndex, allItems);
}

function processNextItem(index, items) {
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
            handleMaterialItem(index, items);
        } else if (icon.classList.contains('font-syllabus-online-video')) {
            handleVideoItem(index, items);
        }
    } else {
        // 没有找到i标签，直接进入下一步
        setTimeout(() => {
            clickNextItem(index, items);
        }, 7000);
    }
}

function handleMaterialItem(index, items) {
    // 获取所有.ivu-table-cell .ng-scope元素
    const materialElements = document.querySelectorAll('.ivu-table-cell .ng-scope');
    // console.log('当前章节的所有.ivu-table-cell .ng-scope元素:', materialElements);

    if (materialElements.length === 0) {
        setTimeout(() => {
            clickNextItem(index, items);
        }, 7000);
        return;
    }

    processMaterialElements(0, materialElements, index, items);
}

function processMaterialElements(currentMatIndex, materialElements, menuIndex, menuItems) {
    if (currentMatIndex >= materialElements.length) {
        setTimeout(() => {
            clickNextItem(menuIndex, menuItems);
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
            processMaterialElements(currentMatIndex + 1, materialElements, menuIndex, menuItems);
        }, 2000);
    }, 7000);
}

function handleVideoItem(index, items) {
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
    checkVideoTime(index, items);
}

function checkVideoTime(menuIndex, menuItems) {
    const timeDisplays = document.querySelectorAll('.mvp-time-display span');

    if (timeDisplays.length >= 2) {
        const currentTime = timeDisplays[0].textContent;
        const duration = timeDisplays[1].textContent;

        if (currentTime === duration) {
            // 视频播放完毕，进入下一步
            setTimeout(() => {
                clickNextItem(menuIndex, menuItems);
            }, 7000);
            return;
        }
    }

    // 未播放完毕，1秒后再次检查
    setTimeout(() => {
        checkVideoTime(menuIndex, menuItems);
    }, 1000);
}

function clickNextItem(currentIndex, items) {
    if (currentIndex + 1 < items.length) {
        // 点击下一个菜单项
        items[currentIndex + 1].click();

        // 等待7秒后处理下一个菜单项
        setTimeout(() => {
            processNextItem(currentIndex + 1, items);
        }, 7000);
    } else {
        // 已经是最后一个，打印完成
        setTimeout(() => {
            console.log('完成所有，有问题请联系作者微信：teachAIGC');
        }, 7000);
    }
}

// 开始执行
processMenuItems();