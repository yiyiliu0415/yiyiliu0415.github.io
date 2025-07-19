// 2048游戏模块
(function() {
    'use strict';

    // 游戏对象
    var game = {
        board: [],
        score: 0,
        bestScore: 0,
        previousState: null,
        size: 4
    };

    // CSS样式已移至独立的game2048.css文件

    // 游戏HTML结构
    function injectGameHTML() {
        var gameHTML = `
        <div class="game-modal" id="game-modal">
            <div class="game-window">
                <div class="game-header">
                    <h2 class="game-title">2048 游戏</h2>
                    <button class="game-close" id="game-close">×</button>
                </div>

                <div class="game-info">
                    <div class="score-container">
                        <div class="score-label">分数</div>
                        <div class="score-value" id="score">0</div>
                    </div>
                    <div class="score-container">
                        <div class="score-label">最高分</div>
                        <div class="score-value" id="best-score">0</div>
                    </div>
                </div>

                <div class="game-controls">
                    <button class="game-btn" id="new-game">新游戏</button>
                    <button class="game-btn" id="undo-move">撤销</button>
                </div>

                <div class="game-board" id="game-board">
                    <div class="grid-container" id="grid-container"></div>
                    <div class="tile-container" id="tile-container"></div>
                    <div class="game-over" id="game-over">
                        <div class="game-over-text" id="game-over-text">游戏结束!</div>
                        <button class="game-btn" onclick="Game2048.startNewGame()">重新开始</button>
                    </div>
                </div>

                <div class="game-instructions">
                    使用方向键或 WASD 键移动方块<br>
                    合并相同数字，目标是达到 2048！
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', gameHTML);
    }

    // 游戏核心函数
    function openGame() {
        var modal = document.getElementById('game-modal');
        if (modal) {
            modal.style.display = 'flex';
            initGame();
        }
    }

    function closeGame() {
        var modal = document.getElementById('game-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function initGame() {
        game.board = [];
        game.score = 0;
        game.bestScore = parseInt(localStorage.getItem('2048-best-score') || '0');

        // 初始化空棋盘
        for (var i = 0; i < game.size; i++) {
            game.board[i] = [];
            for (var j = 0; j < game.size; j++) {
                game.board[i][j] = 0;
            }
        }

        // 创建网格
        createGrid();

        // 添加两个初始方块
        addRandomTile();
        addRandomTile();

        updateDisplay();
    }

    function createGrid() {
        var gridContainer = document.getElementById('grid-container');
        if (!gridContainer) return;
        
        gridContainer.innerHTML = '';

        for (var i = 0; i < game.size; i++) {
            var row = document.createElement('div');
            row.className = 'grid-row';
            for (var j = 0; j < game.size; j++) {
                var cell = document.createElement('div');
                cell.className = 'grid-cell';
                row.appendChild(cell);
            }
            gridContainer.appendChild(row);
        }
    }

    function addRandomTile() {
        var emptyCells = [];
        for (var i = 0; i < game.size; i++) {
            for (var j = 0; j < game.size; j++) {
                if (game.board[i][j] === 0) {
                    emptyCells.push({ x: i, y: j });
                }
            }
        }

        if (emptyCells.length > 0) {
            var randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            game.board[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    function updateDisplay() {
        var tileContainer = document.getElementById('tile-container');
        if (!tileContainer) return;
        
        tileContainer.innerHTML = '';

        for (var i = 0; i < game.size; i++) {
            for (var j = 0; j < game.size; j++) {
                if (game.board[i][j] !== 0) {
                    var tile = document.createElement('div');
                    tile.className = 'tile tile-' + game.board[i][j];
                    tile.textContent = game.board[i][j];
                    tile.style.left = (j * 75 + 2.5) + 'px';
                    tile.style.top = (i * 75 + 2.5) + 'px';
                    tileContainer.appendChild(tile);
                }
            }
        }

        var scoreElement = document.getElementById('score');
        var bestScoreElement = document.getElementById('best-score');
        if (scoreElement) scoreElement.textContent = game.score;
        if (bestScoreElement) bestScoreElement.textContent = game.bestScore;

        if (isGameOver()) {
            var gameOverElement = document.getElementById('game-over');
            var gameOverText = document.getElementById('game-over-text');
            if (gameOverElement) gameOverElement.style.display = 'flex';
            if (gameOverText) {
                if (hasWon()) {
                    gameOverText.textContent = '恭喜！你达到了2048！';
                } else {
                    gameOverText.textContent = '游戏结束！';
                }
            }
        }
    }

    function saveState() {
        game.previousState = {
            board: JSON.parse(JSON.stringify(game.board)),
            score: game.score
        };
    }

    function move(direction) {
        saveState();
        var moved = false;
        var newBoard = JSON.parse(JSON.stringify(game.board));

        if (direction === 'left') {
            for (var i = 0; i < game.size; i++) {
                var row = newBoard[i].filter(function (val) { return val !== 0; });
                for (var j = 0; j < row.length - 1; j++) {
                    if (row[j] === row[j + 1]) {
                        row[j] *= 2;
                        game.score += row[j];
                        row[j + 1] = 0;
                    }
                }
                row = row.filter(function (val) { return val !== 0; });
                while (row.length < game.size) {
                    row.push(0);
                }
                newBoard[i] = row;
            }
        } else if (direction === 'right') {
            for (var i = 0; i < game.size; i++) {
                var row = newBoard[i].filter(function (val) { return val !== 0; });
                for (var j = row.length - 1; j > 0; j--) {
                    if (row[j] === row[j - 1]) {
                        row[j] *= 2;
                        game.score += row[j];
                        row[j - 1] = 0;
                    }
                }
                row = row.filter(function (val) { return val !== 0; });
                while (row.length < game.size) {
                    row.unshift(0);
                }
                newBoard[i] = row;
            }
        } else if (direction === 'up') {
            for (var j = 0; j < game.size; j++) {
                var column = [];
                for (var i = 0; i < game.size; i++) {
                    if (newBoard[i][j] !== 0) {
                        column.push(newBoard[i][j]);
                    }
                }
                for (var i = 0; i < column.length - 1; i++) {
                    if (column[i] === column[i + 1]) {
                        column[i] *= 2;
                        game.score += column[i];
                        column[i + 1] = 0;
                    }
                }
                column = column.filter(function (val) { return val !== 0; });
                while (column.length < game.size) {
                    column.push(0);
                }
                for (var i = 0; i < game.size; i++) {
                    newBoard[i][j] = column[i];
                }
            }
        } else if (direction === 'down') {
            for (var j = 0; j < game.size; j++) {
                var column = [];
                for (var i = 0; i < game.size; i++) {
                    if (newBoard[i][j] !== 0) {
                        column.push(newBoard[i][j]);
                    }
                }
                for (var i = column.length - 1; i > 0; i--) {
                    if (column[i] === column[i - 1]) {
                        column[i] *= 2;
                        game.score += column[i];
                        column[i - 1] = 0;
                    }
                }
                column = column.filter(function (val) { return val !== 0; });
                while (column.length < game.size) {
                    column.unshift(0);
                }
                for (var i = 0; i < game.size; i++) {
                    newBoard[i][j] = column[i];
                }
            }
        }

        // 检查是否有移动
        for (var i = 0; i < game.size; i++) {
            for (var j = 0; j < game.size; j++) {
                if (game.board[i][j] !== newBoard[i][j]) {
                    moved = true;
                    break;
                }
            }
            if (moved) break;
        }

        if (moved) {
            game.board = newBoard;
            addRandomTile();

            if (game.score > game.bestScore) {
                game.bestScore = game.score;
                localStorage.setItem('2048-best-score', game.bestScore.toString());
            }

            updateDisplay();
        }
    }

    function isGameOver() {
        // 检查是否有空格
        for (var i = 0; i < game.size; i++) {
            for (var j = 0; j < game.size; j++) {
                if (game.board[i][j] === 0) {
                    return false;
                }
            }
        }

        // 检查是否可以合并
        for (var i = 0; i < game.size; i++) {
            for (var j = 0; j < game.size; j++) {
                var current = game.board[i][j];
                if ((i < game.size - 1 && current === game.board[i + 1][j]) ||
                    (j < game.size - 1 && current === game.board[i][j + 1])) {
                    return false;
                }
            }
        }

        return true;
    }

    function hasWon() {
        for (var i = 0; i < game.size; i++) {
            for (var j = 0; j < game.size; j++) {
                if (game.board[i][j] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    function startNewGame() {
        var gameOverElement = document.getElementById('game-over');
        if (gameOverElement) gameOverElement.style.display = 'none';
        initGame();
    }

    function undoMove() {
        if (game.previousState) {
            game.board = game.previousState.board;
            game.score = game.previousState.score;
            game.previousState = null;
            updateDisplay();
        }
    }

    // 事件绑定
    function bindEvents() {
        // 游戏按钮事件
        var gameClose = document.getElementById('game-close');
        var newGameBtn = document.getElementById('new-game');
        var undoBtn = document.getElementById('undo-move');
        var gameModal = document.getElementById('game-modal');

        if (gameClose) gameClose.addEventListener('click', closeGame);
        if (newGameBtn) newGameBtn.addEventListener('click', startNewGame);
        if (undoBtn) undoBtn.addEventListener('click', undoMove);

        // 键盘控制
        document.addEventListener('keydown', function (e) {
            var modal = document.getElementById('game-modal');
            if (modal && modal.style.display === 'flex') {
                e.preventDefault();
                switch (e.keyCode) {
                    case 37: // 左箭头
                    case 65:  // A
                        move('left');
                        break;
                    case 38: // 上箭头
                    case 87:  // W
                        move('up');
                        break;
                    case 39: // 右箭头
                    case 68:  // D
                        move('right');
                        break;
                    case 40: // 下箭头
                    case 83:  // S
                        move('down');
                        break;
                    case 27: // ESC
                        closeGame();
                        break;
                }
            }
        });

        // 点击模态框背景关闭
        if (gameModal) {
            gameModal.addEventListener('click', function (e) {
                if (e.target === gameModal) {
                    closeGame();
                }
            });
        }
    }

    // 初始化游戏模块
    function init() {
        injectGameHTML();
        bindEvents();
    }

    // 公开API
    window.Game2048 = {
        init: init,
        openGame: openGame,
        closeGame: closeGame,
        startNewGame: startNewGame,
        undoMove: undoMove
    };

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();