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

// Load player sprite sheet
const playerSpriteSheet = new Image();
playerSpriteSheet.src = 'Gemini_Generated_Image_uv3my3uv3my3uv3m.png';
let imageLoaded = false;
playerSpriteSheet.onload = () => {
    imageLoaded = true;
    // Redraw initial screen
    drawBackground();
    player.draw();
};

// Sprite animation config
const spriteConfig = {
    frameWidth: 0,  // Will be calculated after image loads
    frameHeight: 0,
    cols: 3,
    rows: 2,
    totalFrames: 6,
    currentFrame: 0,
    frameCounter: 0,
    frameSpeed: 8,  // Higher = slower animation
    jumpFrameSpeed: 4  // Faster animation when jumping
};

// Calculate sprite dimensions once image loads
playerSpriteSheet.onload = () => {
    imageLoaded = true;
    spriteConfig.frameWidth = playerSpriteSheet.width / spriteConfig.cols;
    spriteConfig.frameHeight = playerSpriteSheet.height / spriteConfig.rows;
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
        // Draw sprite animation if loaded, otherwise draw placeholder
        if (imageLoaded) {
            // Calculate which frame to show
            const frameSpeed = this.isJumping ? spriteConfig.jumpFrameSpeed : spriteConfig.frameSpeed;

            spriteConfig.frameCounter++;
            if (spriteConfig.frameCounter >= frameSpeed) {
                spriteConfig.frameCounter = 0;
                spriteConfig.currentFrame = (spriteConfig.currentFrame + 1) % spriteConfig.totalFrames;
            }

            // Calculate source position in sprite sheet
            const col = spriteConfig.currentFrame % spriteConfig.cols;
            const row = Math.floor(spriteConfig.currentFrame / spriteConfig.cols);
            const sx = col * spriteConfig.frameWidth;
            const sy = row * spriteConfig.frameHeight;

            // Ensure full opacity
            ctx.globalAlpha = 1.0;

            // Method 1: Draw with compositing to remove transparency
            ctx.save();

            // Draw a solid background circle/rectangle behind sprite
            ctx.fillStyle = '#1a2f4f';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 + 5, 0, Math.PI * 2);
            ctx.fill();

            // Add glow effect
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#00d9ff';

            // Draw current frame from sprite sheet
            ctx.drawImage(
                playerSpriteSheet,
                sx, sy,  // Source x, y
                spriteConfig.frameWidth, spriteConfig.frameHeight,  // Source width, height
                this.x, this.y,  // Destination x, y
                this.width, this.height  // Destination width, height
            );

            ctx.restore();
            ctx.shadowBlur = 0;

            // Wind effect when jumping
            if (this.isJumping) {
                ctx.fillStyle = 'rgba(0, 217, 255, 0.3)';
                ctx.fillRect(this.x - 20, this.y + 20, 15, 40);
                ctx.fillRect(this.x - 35, this.y + 25, 15, 30);
            }

            // Reset global alpha
            ctx.globalAlpha = 1.0;
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

// Load obstacle images
const obstacleImages = {};
const obstacleImagePaths = {
    'leesin': 'assets/leesin/leesin.png',
    'lux': 'assets/lux/lux.png',
    'blitzcrank': 'assets/blitzcrank/blitzcrank.png',
    'thresh': 'assets/thresh/thresh.png',
    'zed': 'assets/zed/zed.png'
};

let obstacleImagesLoaded = 0;
const totalObstacleImages = Object.keys(obstacleImagePaths).length;

// Load all obstacle images
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
        spriteFrame: 0, // Which frame to show (0-5)
    },
    {
        name: '✨ Lux Q',
        imageKey: 'lux',
        color: '#ffd93d',
        width: 70,
        height: 70,
        yPosition: 'high',
        spriteFrame: 1,
    },
    {
        name: '⚡ Blitz Hook',
        imageKey: 'blitzcrank',
        color: '#4ecdc4',
        width: 70,
        height: 70,
        yPosition: 'middle',
        spriteFrame: 2,
    },
    {
        name: '⛓️ Thresh Q',
        imageKey: 'thresh',
        color: '#95e1d3',
        width: 70,
        height: 70,
        yPosition: 'ground',
        spriteFrame: 3,
    },
    {
        name: '🌀 Zed Shadow',
        imageKey: 'zed',
        color: '#9b59b6',
        width: 70,
        height: 70,
        yPosition: 'high',
        spriteFrame: 4,
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
        spriteFrame: type.spriteFrame,
        passed: false
    });
}

// Draw Obstacle
function drawObstacles() {
    obstacles.forEach(obstacle => {
        const img = obstacleImages[obstacle.imageKey];

        if (img && img.complete) {
            // Calculate sprite sheet frame position (3x2 grid)
            const cols = 3;
            const rows = 2;
            const frameWidth = img.width / cols;
            const frameHeight = img.height / rows;

            const frameIndex = obstacle.spriteFrame % 6; // 0-5
            const col = frameIndex % cols;
            const row = Math.floor(frameIndex / cols);
            const sx = col * frameWidth;
            const sy = row * frameHeight;

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

            // Draw sprite frame
            ctx.drawImage(
                img,
                sx, sy,
                frameWidth, frameHeight,
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
