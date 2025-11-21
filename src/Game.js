import Player from './Player.js';
import World from './World.js';
import AudioSystem from './Audio.js';
import Utils from './Utils.js';

export default class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.player = new Player(this);
        this.world = new World(this);
        this.audio = new AudioSystem();

        this.state = 'MENU'; // MENU, PLAYING, GAMEOVER
        this.score = 0;
        this.highScore = localStorage.getItem('cosmic_highscore') || 0;

        this.input = {
            keys: {},
            mouseX: 0,
            mouseY: 0,
            useMouse: false,
            mouseDown: false,
            gamepadIndex: null,
            gamepadAxes: [],
            gamepadButtons: []
        };

        this.lastTime = 0;

        // UI Elements
        this.ui = {
            menu: document.getElementById('main-menu'),
            hud: document.getElementById('hud'),
            gameOver: document.getElementById('game-over'),
            score: document.getElementById('score-display'),
            finalScore: document.getElementById('final-score-display'),
            highScore: document.getElementById('high-score-display'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            fuelBar: document.getElementById('fuel-bar-fill'),
            livesDisplay: document.getElementById('lives-display')
        };

        console.log("Game Initialized");
        console.log("Start Button:", this.ui.startBtn);
        console.log("Menu:", this.ui.menu);

        // Resize listener
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        });

        this.selectedShip = 'X-WING';
        this.setupShipSelection();
        this.renderMenuShips();
    }

    init() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.setupInputs();

        this.ui.highScore.textContent = this.highScore;

        // Start loop
        requestAnimationFrame(this.loop.bind(this));
    }

    setupInputs() {
        window.addEventListener('keyup', (e) => this.input.keys[e.key] = false);

        window.addEventListener('mousemove', (e) => {
            this.input.useMouse = true;
            this.input.mouseX = e.clientX;
            this.input.mouseY = e.clientY;
        });

        window.addEventListener('mousedown', () => this.input.mouseDown = true);
        window.addEventListener('mouseup', () => this.input.mouseDown = false);

        if (this.ui.startBtn) {
            this.ui.startBtn.addEventListener('click', () => {
                console.log("Start Button Clicked");
                this.startGame();
            });
        }
        if (this.ui.restartBtn) {
            this.ui.restartBtn.addEventListener('click', () => {
                console.log("Restart Button Clicked");
                this.startGame();
            });
        }

        // Gamepad Events
        window.addEventListener("gamepadconnected", (e) => {
            console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
                e.gamepad.index, e.gamepad.id,
                e.gamepad.buttons.length, e.gamepad.axes.length);
            this.input.gamepadIndex = e.gamepad.index;
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            console.log("Gamepad disconnected from index %d: %s",
                e.gamepad.index, e.gamepad.id);
            if (this.input.gamepadIndex === e.gamepad.index) {
                this.input.gamepadIndex = null;
            }
        });
    }

    renderMenuShips() {
        const canvases = document.querySelectorAll('.ship-canvas');
        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');

            const type = canvas.getAttribute('data-type');
            const width = canvas.width;
            const height = canvas.height;

            // Clear
            ctx.clearRect(0, 0, width, height);

            // Center context
            ctx.save();
            ctx.translate(width / 2, height / 2);

            // Scale up for preview (since canvas is 200x160, we have more room)
            ctx.scale(1.5, 1.5);

            // Center the ship drawing
            ctx.translate(-this.player.width / 2, -this.player.height / 2);

            const originalType = this.player.shipType;
            this.player.shipType = type;

            // Mock player position
            const originalX = this.player.x;
            const originalY = this.player.y;
            this.player.x = 0;
            this.player.y = 0;

            if (type === 'X-WING') this.player.drawXWing(ctx);
            else if (type === 'A-WING') this.player.drawAWing(ctx);
            else if (type === 'Y-WING') this.player.drawYWing(ctx);

            // Restore
            this.player.shipType = originalType;
            this.player.x = originalX;
            this.player.y = originalY;

            ctx.restore();
        });
    }

    setupShipSelection() {
        const shipOptions = document.querySelectorAll('.ship-option');
        shipOptions.forEach(option => {
            option.addEventListener('click', () => {
                console.log("Ship Selected:", option.dataset.ship);
                // Remove selected from all
                shipOptions.forEach(o => o.classList.remove('selected'));
                // Add to clicked
                option.classList.add('selected');
                // Update state
                this.selectedShip = option.dataset.ship;

                // Re-render to update selection visual if needed, or just rely on CSS
                // CSS handles the border/glow.
            });
        });
    }

    pollGamepad() {
        if (this.input.gamepadIndex !== null) {
            const gamepad = navigator.getGamepads()[this.input.gamepadIndex];
            if (gamepad) {
                // Gamepad polling logic here if needed for menu navigation
                // For now, just basic input handling is in Player.js
            }
        }
    }

    startGame() {
        this.state = 'PLAYING';
        this.score = 0;
        this.world.reset();

        // Re-initialize player with selected ship
        this.player = new Player(this, this.selectedShip);

        this.player.y = this.height / 2;
        this.player.x = 100;

        this.ui.menu.classList.add('hidden');
        this.ui.menu.classList.remove('active');
        this.ui.gameOver.classList.add('hidden');
        this.ui.gameOver.classList.remove('active');
        this.ui.hud.classList.remove('hidden');
        this.ui.hud.classList.add('active');

        this.audio.init();
        this.audio.playStartSound();
        this.audio.playMusic();
    }

    gameOver() {
        this.state = 'GAMEOVER';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('cosmic_highscore', this.highScore);
        }

        this.ui.finalScore.textContent = this.score;
        this.ui.highScore.textContent = this.highScore;

        this.ui.hud.classList.add('hidden');
        this.ui.gameOver.classList.remove('hidden');
        this.ui.gameOver.classList.add('active');

        this.audio.playCrashSound();
    }

    update(deltaTime) {
        this.pollGamepad();
        if (this.state === 'PLAYING') {
            this.player.update(this.input, deltaTime);
            this.world.update(deltaTime);

            // Collision Detection
            const playerBounds = this.player.getBounds();
            // Shrink hitbox slightly for forgiveness
            playerBounds.x += 5;
            playerBounds.width -= 10;
            playerBounds.y += 5;
            playerBounds.height -= 10;

            for (const enemy of this.world.enemies) {
                if (Utils.checkCollision(playerBounds, enemy)) {
                    this.world.createExplosion(enemy.x, enemy.y, 20, '#ff0000');
                    enemy.markedForDeletion = true;

                    // Full invincibility during shield OR respawn
                    if (!this.player.shieldActive && !this.player.isRespawning) {
                        this.player.loseLife();
                    }
                    break;
                }
            }

            this.ui.score.textContent = this.score;

            // Update Lives Display
            const hearts = '♥ '.repeat(Math.max(0, this.player.lives)).trim();
            this.ui.livesDisplay.textContent = hearts || '✕';

            // Update Fuel Bar
            const fuelPercent = (this.player.fuel / this.player.maxFuel) * 100;
            this.ui.fuelBar.style.width = `${fuelPercent}%`;

            // Fuel Warning
            if (fuelPercent < 20) {
                this.ui.fuelBar.style.background = '#f00';
            } else {
                this.ui.fuelBar.style.background = 'linear-gradient(90deg, #ffaa00, #ff4400)';
            }
        }
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#050510';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.world.draw(this.ctx);

        if (this.state === 'PLAYING') {
            this.player.draw(this.ctx);
        }
    }

    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }
}
