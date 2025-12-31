// Game Configuration
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 1200;
canvas.height = 600;

// Game State
let gameState = 'start'; // 'start', 'playing', 'paused', 'gameover'
let score = 0;
let highScore = localStorage.getItem('c9YasuoHighScore') || 0;
let gameSpeed = 3;
let obstaclesPassed = 0;
let lastObstacleHit = '';
let animationFrameId = null;

// Update high score display
document.getElementById('highscore').textContent = highScore;

// Load player GIF animation
const playerGif = new Image();
playerGif.src = 'yasuo.gif';
let imageLoaded = false;
playerGif.onload = () => {
    imageLoaded = true;
    // Redraw initial screen
    drawBackground();
    player.draw();
};

// Player (Yasuo) Object
const player = {
    x: 150,
    y: canvas.height - 150,
    width: 80,
    height: 80,
    velocityY: 0,
    gravity: 0.6,
    jumpPower: -12,
    maxJumpPower: -15,
    isJumping: false,
    color: '#00d9ff',
    draw() {
        // Draw GIF animation if loaded, otherwise draw placeholder
        if (imageLoaded) {
            ctx.save();

            // Draw a solid background circle behind sprite
            ctx.fillStyle = '#1a2f4f';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 + 5, 0, Math.PI * 2);
            ctx.fill();

            // Add glow effect
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#00d9ff';

            // Draw GIF (it will animate automatically)
            ctx.drawImage(
                playerGif,
                this.x, this.y,
                this.width, this.height
            );

            ctx.restore();
            ctx.shadowBlur = 0;

            // Wind effect when jumping
            if (this.isJumping) {
                ctx.fillStyle = 'rgba(0, 217, 255, 0.3)';
                ctx.fillRect(this.x - 20, this.y + 20, 15, 40);
                ctx.fillRect(this.x - 35, this.y + 25, 15, 30);
            }
        } else {
            // Fallback: draw simple shape
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.shadowBlur = 0;
        }
    },
    update() {
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Ground collision
        if (this.y + this.height >= canvas.height - 50) {
            this.y = canvas.height - 50 - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }

        // Ceiling collision
        if (this.y <= 0) {
            this.y = 0;
            this.velocityY = 0;
        }
    },
    jump() {
        if (!this.isJumping) {
            this.velocityY = this.jumpPower;
            this.isJumping = true;
        } else if (this.velocityY > this.maxJumpPower) {
            // Allow continuous jumping while holding mouse
            this.velocityY -= 0.8;
        }
    }
};

// Load obstacle GIF animations
const obstacleImages = {};
const obstacleImagePaths = {
    'leesin': 'assets/leesin/leesin.gif',
    'lux': 'assets/lux/lux.gif',
    'blitzcrank': 'assets/blitzcrank/blitzcrank.gif',
    'thresh': 'assets/thresh/thresh.gif',
    'zed': 'assets/zed/zed.gif'
};

let obstacleImagesLoaded = 0;
const totalObstacleImages = Object.keys(obstacleImagePaths).length;

// Load all obstacle GIF animations
Object.keys(obstacleImagePaths).forEach(key => {
    const img = new Image();
    img.src = obstacleImagePaths[key];
    img.onload = () => {
        obstacleImagesLoaded++;
    };
    obstacleImages[key] = img;
});

// Obstacle Types (Enemy Skills)
const obstacleTypes = [
    {
        name: '🥋 Lee Sin Q',
        imageKey: 'leesin',
        color: '#ff6b35',
        width: 70,
        height: 70,
        yPosition: 'middle', // 'ground', 'middle', 'high'
    },
    {
        name: '✨ Lux Q',
        imageKey: 'lux',
        color: '#ffd93d',
        width: 70,
        height: 70,
        yPosition: 'high',
    },
    {
        name: '⚡ Blitz Hook',
        imageKey: 'blitzcrank',
        color: '#4ecdc4',
        width: 70,
        height: 70,
        yPosition: 'middle',
    },
    {
        name: '⛓️ Thresh Q',
        imageKey: 'thresh',
        color: '#95e1d3',
        width: 70,
        height: 70,
        yPosition: 'ground',
    },
    {
        name: '🌀 Zed Shadow',
        imageKey: 'zed',
        color: '#9b59b6',
        width: 70,
        height: 70,
        yPosition: 'high',
    }
];

// Obstacles Array
let obstacles = [];

// Create Obstacle
function createObstacle() {
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    let yPos;

    switch(type.yPosition) {
        case 'ground':
            yPos = canvas.height - 50 - type.height;
            break;
        case 'middle':
            yPos = canvas.height - 200;
            break;
        case 'high':
            yPos = canvas.height - 350;
            break;
        default:
            yPos = canvas.height - 150;
    }

    obstacles.push({
        x: canvas.width,
        y: yPos,
        width: type.width,
        height: type.height,
        color: type.color,
        name: type.name,
        imageKey: type.imageKey,
        passed: false
    });
}

// Draw Obstacle
function drawObstacles() {
    obstacles.forEach(obstacle => {
        const img = obstacleImages[obstacle.imageKey];

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.save();

            // Draw background circle for visibility
            ctx.fillStyle = obstacle.color;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, obstacle.width/2 + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Add glow effect
            ctx.shadowBlur = 15;
            ctx.shadowColor = obstacle.color;

            // Draw GIF (it will animate automatically)
            ctx.drawImage(
                img,
                obstacle.x, obstacle.y,
                obstacle.width, obstacle.height
            );

            ctx.restore();
            ctx.shadowBlur = 0;

            // Draw skill name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(obstacle.name, obstacle.x + obstacle.width/2, obstacle.y - 8);
            ctx.textAlign = 'left';
        } else {
            // Fallback: draw colored rectangle if image not loaded
            ctx.fillStyle = obstacle.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            ctx.shadowBlur = 0;

            // Draw skill name
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.fillText(obstacle.name, obstacle.x, obstacle.y - 5);
        }
    });
}

// Update Obstacles
function updateObstacles() {
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;

        // Check if obstacle is passed
        if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
            obstacle.passed = true;
            score += 10;
            obstaclesPassed++;

            // Increase speed every 5 obstacles
            if (obstaclesPassed % 5 === 0) {
                gameSpeed += 0.5;
                document.getElementById('speed').textContent = (gameSpeed / 3).toFixed(1) + 'x';
            }

            document.getElementById('score').textContent = score;
        }

        // Remove off-screen obstacles
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
        }
    });

    // Create new obstacles
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 300) {
        createObstacle();
    }
}

// Collision Detection
function checkCollision() {
    for (let obstacle of obstacles) {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
            lastObstacleHit = obstacle.name;
            return true;
        }
    }
    return false;
}

// Draw Background
function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2a3f5f');
    gradient.addColorStop(0.5, '#1a2f4f');
    gradient.addColorStop(1, '#0f1f3f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137 + frameCount) % canvas.width;
        const y = (i * 73) % (canvas.height - 100);
        ctx.fillRect(x, y, 2, 2);
    }

    // Ground
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Ground detail
    ctx.fillStyle = '#00d9ff';
    ctx.fillRect(0, canvas.height - 52, canvas.width, 2);
}

// Draw HUD on Canvas
function drawHUD() {
    // Distance marker
    ctx.fillStyle = 'rgba(0, 217, 255, 0.2)';
    ctx.fillRect(10, 10, 200, 40);
    ctx.fillStyle = '#00d9ff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Obstacles Dodged: ${obstaclesPassed}`, 20, 35);
}

// Frame counter for animations
let frameCount = 0;

// Game Loop
let isMouseDown = false;

function gameLoop() {
    if (gameState !== 'playing') return;

    frameCount++;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw
    drawBackground();
    drawHUD();
    player.draw();
    drawObstacles();

    // Update
    if (isMouseDown) {
        player.jump();
    }
    player.update();
    updateObstacles();

    // Check collision
    if (checkCollision()) {
        gameOver();
        return;
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

// Start Game
function startGame() {
    gameState = 'playing';
    score = 0;
    gameSpeed = 3;
    obstaclesPassed = 0;
    obstacles = [];
    player.y = canvas.height - 150;
    player.velocityY = 0;
    player.isJumping = false;

    document.getElementById('score').textContent = '0';
    document.getElementById('speed').textContent = '1.0x';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('homeBtn').style.display = 'block';
    document.getElementById('pauseBtn').style.display = 'block';

    gameLoop();
}

// Pause Game
function pauseGame() {
    if (gameState !== 'playing') return;

    gameState = 'paused';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    // Update pause screen stats
    document.getElementById('pauseScore').textContent = score;
    document.getElementById('pauseObstacles').textContent = obstaclesPassed;
    document.getElementById('pauseSpeed').textContent = (gameSpeed / 3).toFixed(1) + 'x';

    document.getElementById('pauseScreen').classList.remove('hidden');
    document.getElementById('pauseBtn').textContent = '▶️ RESUME';
}

// Resume Game
function resumeGame() {
    if (gameState !== 'paused') return;

    gameState = 'playing';
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('pauseBtn').textContent = '⏸️ PAUSE';
    gameLoop();
}

// Toggle Pause
function togglePause() {
    if (gameState === 'playing') {
        pauseGame();
    } else if (gameState === 'paused') {
        resumeGame();
    }
}

// Go to Home Screen
function goHome() {
    gameState = 'start';
    obstacles = [];
    player.y = canvas.height - 150;
    player.velocityY = 0;
    player.isJumping = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('gameOver').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('homeBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'none';

    // Redraw initial screen
    drawBackground();
    player.draw();
}

// Game Over
function gameOver() {
    gameState = 'gameover';

    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('c9YasuoHighScore', highScore);
        document.getElementById('highscore').textContent = highScore;
    }

    document.getElementById('finalScore').textContent = score;
    document.getElementById('obstacleHit').textContent = lastObstacleHit;
    document.getElementById('gameOver').classList.remove('hidden');
}

// Event Listeners
canvas.addEventListener('mousedown', (e) => {
    if (gameState === 'playing') {
        isMouseDown = true;
    }
});

canvas.addEventListener('mouseup', (e) => {
    isMouseDown = false;
});

canvas.addEventListener('mouseleave', (e) => {
    isMouseDown = false;
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('homeBtn').addEventListener('click', goHome);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resumeBtn').addEventListener('click', resumeGame);
document.getElementById('pauseHomeBtn').addEventListener('click', goHome);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing' || gameState === 'paused') {
            togglePause();
        }
    }
});

// Touch support for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'playing') {
        isMouseDown = true;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isMouseDown = false;
});

// Initial draw
drawBackground();
player.draw();
