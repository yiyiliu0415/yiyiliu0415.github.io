/**
 * Live2D Waifu 模块
 * 包含Live2D看板娘的所有功能
 */
(function () {
    'use strict';

    // 注入HTML结构
    function injectWaifuHTML() {
        if (document.getElementById('live2d')) return;

        const waifuHTML = `
            <div class="waifu">
                <div class="waifu-tips"></div>
                <canvas id="live2d" width="280" height="250"></canvas>
                <div class="waifu-tool">
                    <span class="fui-eye">👁</span>
                    <span class="fui-user">👤</span>
                    <span class="fui-photo">📷</span>
                    <span class="fui-game">🎮</span>
                    <span class="fui-background">🖼️</span>
                    <span class="fui-wallpaper">🌄</span>
                    <span class="fui-cross">❌</span>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', waifuHTML);
    }

    // 字符串模板渲染函数
    String.prototype.render = function (context) {
        var tokenReg = /(\\)?\{([^\{\}\\]+)(\\)?\}/g;
        return this.replace(tokenReg, function (word, slash1, token, slash2) {
            if (slash1 || slash2) {
                return word.replace('\\', '');
            }
            var variables = token.replace(/\s/g, '').split('.');
            var currentObject = context;
            var i, length, variable;
            for (i = 0, length = variables.length; i < length; ++i) {
                variable = variables[i];
                currentObject = currentObject[variable];
                if (currentObject === undefined || currentObject === null) return '';
            }
            return currentObject;
        });
    };

    // 显示消息
    function showMessage(text, timeout, flag) {
        if (flag || sessionStorage.getItem('waifu-text') === '' || sessionStorage.getItem('waifu-text') === null) {
            if (Array.isArray(text)) text = text[Math.floor(Math.random() * text.length)];

            if (flag) sessionStorage.setItem('waifu-text', text);

            $('.waifu-tips').stop();
            $('.waifu-tips').html(text).fadeTo(200, 1);
            if (timeout === undefined) timeout = 5000;
            hideMessage(timeout);
        }
    }

    function hideMessage(timeout) {
        $('.waifu-tips').stop().css('opacity', 1);
        if (timeout === undefined) timeout = 5000;
        window.setTimeout(function () { sessionStorage.removeItem('waifu-text') }, timeout);
        $('.waifu-tips').delay(timeout).fadeTo(200, 0);
    }

    // 模型加载函数
    function loadModel(modelId, modelTexturesId, retryCount) {
        if (retryCount === undefined) retryCount = 0;

        if (typeof loadlive2d === 'function') {
            try {
                localStorage.setItem('modelId', modelId);
                if (modelTexturesId === undefined) modelTexturesId = 0;
                localStorage.setItem('modelTexturesId', modelTexturesId);

                var modelUrl = 'https://live2d.jixiaob.cn/get/?id=' + modelId + '-' + modelTexturesId;
                console.log('Loading Live2D model:', modelUrl, 'retry:', retryCount);

                // 检查canvas元素是否存在
                var canvas = document.getElementById('live2d');
                if (!canvas) {
                    console.error('Live2D canvas元素不存在');
                    if (retryCount < 3) {
                        setTimeout(function () {
                            loadModel(modelId, modelTexturesId, retryCount + 1);
                        }, 500);
                    }
                    return;
                }

                // 确保canvas处于正确状态
                canvas.style.display = 'block';
                canvas.style.visibility = 'visible';
                canvas.style.opacity = '1';

                // 加载模型
                loadlive2d('live2d', modelUrl);

                // 优化的加载检测机制
                var checkInterval = setInterval(function () {
                    var canvas = document.getElementById('live2d');
                    if (canvas && canvas.style.display !== 'none' && canvas.style.visibility !== 'hidden') {
                        console.log('Live2D模型加载成功');
                        clearInterval(checkInterval);
                        return;
                    }
                }, 500);

                // 超时检测
                setTimeout(function () {
                    clearInterval(checkInterval);
                    var canvas = document.getElementById('live2d');
                    if (canvas && (canvas.style.display === 'none' || canvas.style.visibility === 'hidden')) {
                        console.warn('Live2D模型可能加载失败，尝试重新加载');
                        if (retryCount < 2) {
                            loadModel(modelId, modelTexturesId, retryCount + 1);
                        }
                    }
                }, 8000);

            } catch (error) {
                console.error('Live2D模型加载失败:', error);
                if (retryCount < 3) {
                    console.log('尝试重新加载模型，重试次数:', retryCount + 1);
                    setTimeout(function () {
                        loadModel(modelId, modelTexturesId, retryCount + 1);
                    }, 1000);
                } else {
                    showMessage('模型加载失败，请刷新页面重试', 3000, true);
                }
            }
        } else {
            console.error('loadlive2d函数未定义，请检查Live2D库是否正确加载');
            if (retryCount < 5) {
                setTimeout(function () {
                    loadModel(modelId, modelTexturesId, retryCount + 1);
                }, 500);
            } else {
                showMessage('Live2D库未正确加载', 3000, true);
            }
        }
    }

    // 防抖变量
    var isLoadingModel = false;

    function loadRandModel(silent) {
        // 防止重复请求
        if (isLoadingModel) {
            if (!silent) {
                showMessage('正在换装中，请稍等~', 2000, true);
            }
            return;
        }

        isLoadingModel = true;
        var modelId = localStorage.getItem('modelId') || 1;
        var modelTexturesId = localStorage.getItem('modelTexturesId') || 0;

        $.ajax({
            cache: false,
            url: 'https://live2d.jixiaob.cn/switch_textures/?id=' + modelId + '-' + modelTexturesId,
            dataType: "json",
            success: function (result) {
                isLoadingModel = false; // 重置防抖标志
                // 检查API响应是否有效
                if (result && result.textures && result.textures.id !== undefined) {
                    if (!silent) {
                        if (result.textures.id == 1 && (modelTexturesId == 1 || modelTexturesId == 0)) {
                            showMessage('我还没有其他衣服呢', 3000, true);
                        } else {
                            showMessage('我的新衣服好看嘛', 3000, true);
                        }
                    }
                    loadModel(modelId, result.textures.id);
                } else {
                    // API响应无效时的处理
                    console.warn('Live2D API返回了无效的响应:', result);
                    if (!silent) {
                        showMessage('换装失败，API响应异常', 3000, true);
                    }
                    // 重新加载当前模型以防止模型消失
                    loadModel(modelId, modelTexturesId);
                }
            },
            error: function (xhr, status, error) {
                isLoadingModel = false; // 重置防抖标志
                console.error('Live2D换装API请求失败:', error);
                if (!silent) {
                    showMessage('换装失败，请稍后再试~', 3000, true);
                }
                // 重新加载当前模型以防止模型消失
                var currentModelId = localStorage.getItem('modelId') || 1;
                var currentTexturesId = localStorage.getItem('modelTexturesId') || 0;
                loadModel(currentModelId, currentTexturesId);
            }
        });
    }

    function loadOtherModel() {
        // 防止重复请求
        if (isLoadingModel) {
            showMessage('正在切换模型中，请稍等~', 2000, true);
            return;
        }

        isLoadingModel = true;
        var modelId = localStorage.getItem('modelId') || 1;

        $.ajax({
            cache: false,
            url: 'https://live2d.jixiaob.cn/switch/?id=' + modelId,
            dataType: "json",
            success: function (result) {
                isLoadingModel = false; // 重置防抖标志
                // 检查API响应是否有效
                if (result && result.model && result.model.id !== undefined) {
                    loadModel(result.model.id);
                    showMessage(result.model.message || '新的朋友来了~', 3000, true);
                } else {
                    // API响应无效时的处理
                    console.warn('Live2D切换模型API返回了无效的响应:', result);
                    showMessage('切换模型失败，API响应异常', 3000, true);
                    // 重新加载当前模型以防止模型消失
                    var currentModelId = localStorage.getItem('modelId') || 1;
                    var currentTexturesId = localStorage.getItem('modelTexturesId') || 0;
                    loadModel(currentModelId, currentTexturesId);
                }
            },
            error: function (xhr, status, error) {
                isLoadingModel = false; // 重置防抖标志
                console.error('Live2D切换模型API请求失败:', error);
                showMessage('切换模型失败，请稍后再试~', 3000, true);
                // 重新加载当前模型以防止模型消失
                var currentModelId = localStorage.getItem('modelId') || 1;
                var currentTexturesId = localStorage.getItem('modelTexturesId') || 0;
                loadModel(currentModelId, currentTexturesId);
            }
        });
    }

    // 重置到默认位置（右下角）
    function resetToDefaultPosition() {
        $('.waifu').css({
            'position': 'fixed',
            'right': '65px',
            'bottom': '0px',
            'left': 'auto',
            'top': 'auto'
        });
    }

    // 背景欣赏模式功能
    var bgModeActive = false;

    function toggleBackgroundMode() {
        bgModeActive = !bgModeActive;
        var $body = $('body');

        console.log('切换背景模式，当前状态:', bgModeActive);

        if (bgModeActive) {
            // 开启背景欣赏模式
            $body.addClass('bg-mode-active');
            console.log('已添加bg-mode-active类');
            // 显示提示消息
            if (typeof showMessage === 'function') {
                showMessage('背景欣赏模式已开启，按 B 键退出', 3000, true);
            }
        } else {
            // 关闭背景欣赏模式
            $body.removeClass('bg-mode-active');
            console.log('已移除bg-mode-active类');
            // 显示提示消息
            if (typeof showMessage === 'function') {
                showMessage('欢迎回来！继续浏览内容吧~', 3000, true);
            }
        }
    }

    // 背景切换功能
    function changeBackground() {
        // 添加时间戳参数强制刷新背景图片
        // var timestamp = new Date().getTime();
        // var newBgUrl = 'https://t.alcy.cc/moez?t=' + timestamp;

        // 定义本地背景图片的路径数组
        var backgrounds = [
            'static/assets/img/background1.jpg',
            'static/assets/img/background2.jpg'
        ];

        // 随机选择一张背景图片（避免与当前背景重复）
        var newBgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];
        if (backgrounds.length > 1 && $('body').css('background-image').indexOf(newBgUrl) !== -1) {
            newBgUrl = backgrounds[(backgrounds.indexOf(newBgUrl) + 1) % backgrounds.length];
        }

        $('body').css('background-image', 'url(' + newBgUrl + ')');

        // 显示提示消息
        if (typeof showMessage === 'function') {
            showMessage('背景已切换！喜欢这张图片吗？', 3000, true);
        }
    }

    // 鼠标轨迹功能
    var mouseTrailEnabled = true;
    var lastTrailTime = 0;
    var trailDelay = 50; // 轨迹生成间隔（毫秒）

    function createMouseTrail(x, y) {
        if (!mouseTrailEnabled) return;

        var currentTime = Date.now();
        if (currentTime - lastTrailTime < trailDelay) return;
        lastTrailTime = currentTime;

        var trail = $('<div class="mouse-trail"></div>');

        // 随机大小
        var sizes = ['small', 'medium', '', 'large'];
        var randomSize = sizes[Math.floor(Math.random() * sizes.length)];
        if (randomSize) trail.addClass(randomSize);

        // 设置位置
        trail.css({
            left: x - 4 + 'px',
            top: y - 4 + 'px'
        });

        $('body').append(trail);

        // 1秒后移除元素
        setTimeout(function () {
            trail.remove();
        }, 1000);
    }

    // 绑定事件
    function bindEvents() {
        // 控制台彩蛋
        var re = /x/;
        console.log(re);
        re.toString = function () {
            showMessage('哈哈，你打开了控制台，是想要看看我的秘密吗？', 5000, true);
            return '';
        };

        // 复制监听
        $(document).on('copy', function () {
            showMessage('你都复制了些什么呀，转载要记得加上出处哦~', 5000, true);
        });

        // 工具栏点击事件
        $('.waifu-tool .fui-eye').off('click.live2d').on('click.live2d', function (e) {
            e.preventDefault();
            e.stopPropagation();
            loadOtherModel();
        });

        $('.waifu-tool .fui-user').off('click.live2d').on('click.live2d', function (e) {
            e.preventDefault();
            e.stopPropagation();
            loadRandModel();
        });

        $('.waifu-tool .fui-cross').off('click.live2d').on('click.live2d', function (e) {
            e.preventDefault();
            e.stopPropagation();
            sessionStorage.setItem('waifu-dsiplay', 'none');
            showMessage('愿你有一天能与重要的人重逢~', 1300, true);
            window.setTimeout(function () { $('.waifu').hide(); }, 1300);
        });

        $('.waifu-tool .fui-photo').off('click.live2d').on('click.live2d', function (e) {
            e.preventDefault();
            e.stopPropagation();
            showMessage('照好了嘛，是不是很可爱呢？', 5000, true);
            if (window.Live2D) {
                window.Live2D.captureName = 'Pio.png';
                window.Live2D.captureFrame = true;
            }
        });

        $('.waifu-tool .fui-game').off('click.live2d').on('click.live2d', function (e) {
            e.preventDefault();
            e.stopPropagation();
            showMessage('选择你想玩的游戏吧！', 3000, true);
            if (window.GameManager) {
                GameManager.openGameSelector();
            }
        });

        $('.waifu-tool .fui-background').off('click.live2d').on('click.live2d', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('点击背景按钮');
            showMessage('切换背景欣赏模式~', 2000, true);
            toggleBackgroundMode();
        });

        $('.waifu-tool .fui-wallpaper').off('click.live2d').on('click.live2d', function (e) {
            e.preventDefault();
            e.stopPropagation();
            showMessage('为你换一张美丽的背景图片~', 2000, true);
            changeBackground();
        });

        // 鼠标交互
        $(document).on('mouseover', '#live2d', function () {
            var texts = ['你好呀~', '欢迎来到我的世界！', '今天过得怎么样？', '按 B 键进入背景欣赏模式哦~', '想看美丽的背景吗？按 B 键试试！', '按 N 键可以切换背景图片呢~', '按 N 键可以查看我的b50哦~', '想要换个背景吗？试试按 N 键！', '按 T 键可以切换鼠标轨迹效果呢✨', '想玩游戏吗？点击我旁边的游戏按钮🎮', '点击🖼️按钮可以进入背景欣赏模式哦~', '点击🌄按钮可以换背景图片呢~'];
            var text = texts[Math.floor(Math.random() * texts.length)];
            showMessage(text, 3000);
        });

        $(document).on('click', '#live2d', function () {
            var texts = ['是…是不是想摸我呀？', 'kyaa~好害羞！', '请…请轻一点…', '按 B 键可以进入背景欣赏模式呢~', '想要纯净的背景体验吗？试试按 B 键！', '按 N 键能换背景图片哦~', '想看不同的风景吗？按 N 键试试！', '按 T 键可以切换鼠标轨迹效果呢✨', '无聊的话可以玩玩游戏哦🎮', '来挑战一下2048游戏吧！', '试试点击🖼️按钮进入背景欣赏模式~', '点击🌄按钮可以换个美丽的背景哦~'];
            var text = texts[Math.floor(Math.random() * texts.length)];
            showMessage(text, 3000, true);
        });

        // 拖拽功能
        var isDragging = false;
        var dragOffset = { x: 0, y: 0 };

        $('.waifu').on('mousedown', function (e) {
            // 防止在点击工具栏时触发拖拽
            if ($(e.target).closest('.waifu-tool').length > 0) {
                return;
            }

            isDragging = true;
            var waifuPos = $(this).offset();
            dragOffset.x = e.clientX - waifuPos.left;
            dragOffset.y = e.clientY - waifuPos.top;

            // 改变鼠标样式
            $(this).css('cursor', 'url(static/assets/img/cursor-grabbing.svg) 16 16, grabbing');

            // 防止文本选择
            e.preventDefault();
        });

        $(document).on('mousemove', function (e) {
            if (isDragging) {
                var newX = e.clientX - dragOffset.x;
                var newY = e.clientY - dragOffset.y;

                // 限制拖拽范围，防止拖出屏幕
                var windowWidth = $(window).width();
                var windowHeight = $(window).height();
                var waifuWidth = $('.waifu').outerWidth();
                var waifuHeight = $('.waifu').outerHeight();

                newX = Math.max(0, Math.min(newX, windowWidth - waifuWidth));
                newY = Math.max(0, Math.min(newY, windowHeight - waifuHeight));

                // 实时更新位置
                $('.waifu').css({
                    'position': 'fixed',
                    'left': newX + 'px',
                    'top': newY + 'px',
                    'right': 'auto',
                    'bottom': 'auto'
                });
            }

            // 鼠标轨迹
            createMouseTrail(e.clientX, e.clientY);
        });

        $(document).on('mouseup', function () {
            if (isDragging) {
                isDragging = false;
                $('.waifu').css('cursor', 'url(static/assets/img/cursor-grab.svg) 16 16, grab');
            }
        });

        // 键盘快捷键支持
        $(document).off('keydown.live2d').on('keydown.live2d', function (e) {
            // 确保不在输入框中
            if (!$(e.target).is('input, textarea, [contenteditable]')) {
                console.log('键盘事件:', e.key);
                if (e.key === 'b' || e.key === 'B') {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('按下B键，切换背景模式');
                    toggleBackgroundMode();
                } else if (e.key === 'n' || e.key === 'N') {
                    e.preventDefault();
                    e.stopPropagation();
                    changeBackground();
                } else if (e.key === 't' || e.key === 'T') {
                    e.preventDefault();
                    e.stopPropagation();
                    mouseTrailEnabled = !mouseTrailEnabled;
                    if (typeof showMessage === 'function') {
                        showMessage(mouseTrailEnabled ? '鼠标轨迹已开启✨' : '鼠标轨迹已关闭', 2000, true);
                    }
                }
            }
        });
    }

    // 初始化欢迎消息
    function initWelcomeMessage() {
        var text;
        var now = (new Date()).getHours();
        if (now > 23 || now <= 5) {
            text = '你是夜猫子呀？这么晚还不睡觉，明天起的来嘛';
        } else if (now > 5 && now <= 7) {
            text = '早上好！一日之计在于晨，美好的一天就要开始了';
        } else if (now > 7 && now <= 9) {
            text = '上午好！工作顺利嘛，不要久坐，多起来走动走动哦！';
        } else if (now > 11 && now <= 13) {
            text = '中午了，工作了一个上午，现在是午餐时间！';
        } else if (now > 13 && now <= 14) {
            text = '午后很容易犯困呢，还是休息一下吧~';
        } else if (now > 14 && now <= 16) {
            text = '忙碌的下午，一起努力吧！';
        } else if (now > 17 && now <= 19) {
            text = '傍晚了！窗外夕阳的景色很美丽呢，最美不过夕阳红~';
        } else if (now > 19 && now <= 21) {
            text = '晚上好，今天过得怎么样？';
        } else if (now > 22 && now <= 24) {
            text = '已经这么晚了呀，早点休息吧，晚安~';
        } else {
            text = '嗨~ master快来逗我玩吧！';
        }

        setTimeout(function () {
            showMessage(text, 6000);
        }, 2000);
    }

    // 初始化模型
    function initModel() {
        // 确保Live2D库和canvas元素都已准备就绪
        function waitForLive2D() {
            var canvas = document.getElementById('live2d');
            if (typeof loadlive2d !== 'undefined' && canvas) {
                var modelId = localStorage.getItem('modelId') || 1;
                var modelTexturesId = localStorage.getItem('modelTexturesId') || 87;
                console.log('初始化Live2D模型，modelId:', modelId, 'texturesId:', modelTexturesId);

                // 确保canvas可见
                canvas.style.display = 'block';
                canvas.style.visibility = 'visible';

                // 立即加载模型，减少延迟
                loadModel(modelId, modelTexturesId);

                // 在模型加载完成后自动执行一次静默换装，确保模型显示
                setTimeout(function() {
                    console.log('自动执行静默换装以确保模型显示');
                    loadRandModel(true); // 传入true启用静默模式，不显示换装消息
                }, 3000); // 等待3秒确保模型完全加载
            } else {
                console.log('等待Live2D库和DOM元素加载...', {
                    loadlive2d: typeof loadlive2d !== 'undefined',
                    canvas: !!canvas
                });
                setTimeout(waitForLive2D, 200);
            }
        }

        // 减少初始延迟，提高响应速度
        setTimeout(waitForLive2D, 100);
    }

    // 初始化函数
    function init() {
        injectWaifuHTML();
        bindEvents();

        $(document).ready(function () {
            // 重置到默认位置
            resetToDefaultPosition();

            // 设置初始鼠标样式
            $('.waifu').css('cursor', 'url(static/assets/img/cursor-grab.svg) 16 16, grab');

            // 初始化欢迎消息
            initWelcomeMessage();
            changeBackground();
            // 初始化模型
            initModel();
        });
    }

    // 暴露公共API
    window.Live2DWaifu = {
        init: init,
        showMessage: showMessage,
        hideMessage: hideMessage,
        loadModel: loadModel,
        loadRandModel: loadRandModel,
        loadOtherModel: loadOtherModel,
        toggleBackgroundMode: toggleBackgroundMode,
        changeBackground: changeBackground,
        resetToDefaultPosition: resetToDefaultPosition
    };

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();