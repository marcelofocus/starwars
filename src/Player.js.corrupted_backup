import Utils from './Utils.js';
import Projectile from './Projectile.js';

export default class Player {
    constructor(game, shipType = 'X-WING') {
        this.game = game;
        this.shipType = shipType;
        this.width = 50;
        this.height = 30;
        this.x = 100;
        this.y = game.height / 2;
        this.vy = 0;
        this.vx = 0;
        this.friction = 0.9;
        this.color = '#00f3ff';

        // Ship Stats
        this.speed = 5;
        this.shootInterval = 200;
        this.weaponLevel = 1;
        this.maxWeaponLevel = 5; // Increased from 3
        this.rapidFireActive = false;
        this.fuel = 100;
        this.maxFuel = 100;
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.lastShot = 0;
        this.lastLowFuelSound = 0;
        this.refuelTimer = 0;

        // Lives System
        this.lives = 3;
        this.isRespawning = false;
        this.respawnTimer = 0;
        this.blinkTimer = 0;

        if (this.shipType === 'A-WING') {
            this.game.audio.playMusic(); // Return to normal music
        }
    }

    update(input, deltaTime) {
        // Fuel Consumption
        this.fuel -= deltaTime * 0.002; // Consumes 2 fuel per second (50s autonomy)
        if (this.fuel <= 0) {
            this.fuel = 0;
            this.game.gameOver();
            return;
        }

        // Refuel Sound Logic
        if (this.refuelTimer > 0) {
            this.refuelTimer -= deltaTime;
            this.game.audio.startRefuelSound();
        } else {
            this.game.audio.stopRefuelSound();
        }

        // Low Fuel Warning
        if (this.fuel < 25 && this.fuel > 0) {
            if (!this.lastLowFuelSound || Date.now() - this.lastLowFuelSound > 1000) {
                this.blinkTimer = 0;
            }
        }

        // Mouse/Touch follow
        if (input.useMouse) {
            // Smoothly interpolate towards mouse position
            this.targetY = input.mouseY;
            this.targetX = input.mouseX;

            // Clamp target to screen bounds
            this.targetX = Utils.clamp(this.targetX, 0, this.game.width - this.width);
            this.targetY = Utils.clamp(this.targetY, 0, this.game.height - this.height);

            this.x = Utils.lerp(this.x, this.targetX, 0.1);
            this.y = Utils.lerp(this.y, this.targetY, 0.1);
        } else {
            // Keyboard controls
            if (input.keys.ArrowUp || input.keys.w) this.vy -= 1;
            if (input.keys.ArrowDown || input.keys.s) this.vy += 1;
            if (input.keys.ArrowLeft || input.keys.a) this.vx -= 1;
            if (input.keys.ArrowRight || input.keys.d) this.vx += 1;

            this.vx *= this.friction;
            this.vy *= this.friction;
        }

        // Gamepad Movement (Direct Velocity)
        if (input.gamepadAxes.length >= 2) {
            const axisX = input.gamepadAxes[0];
            const axisY = input.gamepadAxes[1];
            const deadzone = 0.1;

            if (Math.abs(axisX) > deadzone || Math.abs(axisY) > deadzone) {
                this.vx = 0;
                this.vy = 0;

                if (Math.abs(axisX) > deadzone) this.vx = axisX * 2;
                if (Math.abs(axisY) > deadzone) this.vy = axisY * 2;

                input.useMouse = false;
            }
        }

        // Apply velocity
        if (!input.useMouse) {
            this.x += this.vx * this.speed;
            this.y += this.vy * this.speed;

            if (this.y > this.game.height - this.height) { this.y = this.game.height - this.height; this.vy = 0; }
            if (this.y < 0) { this.y = 0; this.vy = 0; }
            if (this.x < 0) { this.x = 0; this.vx = 0; }
            if (this.x > this.game.width - this.width) { this.x = this.game.width - this.width; this.vx = 0; }
        }

        // Shooting
        let isShooting = input.mouseDown || input.keys[' '];
        let shootDirX = 1;
        let shootDirY = 0;

        if (input.gamepadButtons.length > 0) {
            if (input.gamepadButtons[0]?.pressed || input.gamepadButtons[5]?.pressed || input.gamepadButtons[7]?.pressed) {
                isShooting = true;
            }
        }

        if (input.gamepadAxes.length >= 4) {
            const aimX = input.gamepadAxes[2];
            const aimY = input.gamepadAxes[3];
            const deadzone = 0.1;

            if (Math.abs(aimX) > deadzone || Math.abs(aimY) > deadzone) {
                isShooting = true;
                const magnitude = Math.sqrt(aimX * aimX + aimY * aimY);

                refuel(amount) {
                    this.fuel = Math.min(this.fuel + amount, this.maxFuel);
                    this.refuelTimer = 100; // Keep sound alive for 100ms
                }

                shoot(dirX = 1, dirY = 0) {
                    this.game.audio.playShootSound();
                    const x = this.x + this.width / 2;
                    const y = this.y + this.height / 2;
                    const speed = 15;

                    // Force horizontal shooting unless using gamepad aim stick
                    // If dirY is very small, it's from keyboard/mouse, force horizontal
                    if (Math.abs(dirY) < 0.3) {
                        dirX = 1;
                        dirY = 0;
                    }

                    if (this.weaponLevel === 1) {
                        this.game.world.addProjectile(new Projectile(x, y, dirX * speed, dirY * speed));
                    } else if (this.weaponLevel === 2) {
                        const angle = Math.atan2(dirY, dirX);
                        const spread = 0.2;
                        this.game.world.addProjectile(new Projectile(x, y, Math.cos(angle - spread) * speed, Math.sin(angle - spread) * speed));
                        this.game.world.addProjectile(new Projectile(x, y, Math.cos(angle + spread) * speed, Math.sin(angle + spread) * speed));
                    } else if (this.weaponLevel >= 3) {
                        const angle = Math.atan2(dirY, dirX);
                        const spread = 0.3;
                        this.game.world.addProjectile(new Projectile(x, y, dirX * speed, dirY * speed, 'POWER'));
                        this.game.world.addProjectile(new Projectile(x, y, Math.cos(angle - spread) * speed, Math.sin(angle - spread) * speed));
                        this.game.world.addProjectile(new Projectile(x, y, Math.cos(angle + spread) * speed, Math.sin(angle + spread) * speed));
                    }
                }

                draw(ctx) {
                    // Skip drawing during blink (creates flashing effect)
                    if (this.isRespawning && Math.floor(this.blinkTimer / 100) % 2 === 0) {
                        return; // Don't draw on even blink cycles
                    }

                    ctx.save();
                    ctx.translate(this.x, this.y);

                    // Shield Effect
                    if (this.shieldActive) {
                        ctx.strokeStyle = `rgba(0, 243, 255, ${Math.abs(Math.sin(Date.now() / 200))})`;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(this.width / 2, this.height / 2, this.width, 0, Math.PI * 2);
                        ctx.stroke();
                    }

                    if (this.shipType === 'X-WING') this.drawXWing(ctx);
                    else if (this.shipType === 'A-WING') this.drawAWing(ctx);
                    else if (this.shipType === 'Y-WING') this.drawYWing(ctx);

                    ctx.restore();
                }

                drawXWing(ctx) {
                    // Engine Glow
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#ff4400';
                    ctx.fillStyle = 'rgba(255, 68, 0, 0.6)';
                    ctx.beginPath(); ctx.arc(0, 5, 4 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(0, this.height - 5, 4 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(5, 2, 3, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(5, this.height - 2, 3, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;

                    // Fuselage
                    const gradient = ctx.createLinearGradient(0, 0, this.width, 0);
                    gradient.addColorStop(0, '#888'); gradient.addColorStop(0.4, '#eee'); gradient.addColorStop(1, '#888');
                    ctx.fillStyle = gradient;
                    ctx.beginPath(); ctx.moveTo(0, this.height / 2 - 3); ctx.lineTo(this.width, this.height / 2); ctx.lineTo(0, this.height / 2 + 3); ctx.fill();

                    // Cockpit
                    ctx.fillStyle = '#111';
                    ctx.beginPath(); ctx.moveTo(this.width * 0.2, this.height / 2 - 4); ctx.lineTo(this.width * 0.4, this.height / 2 - 4); ctx.lineTo(this.width * 0.35, this.height / 2 - 8); ctx.lineTo(this.width * 0.25, this.height / 2 - 8); ctx.fill();
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.beginPath(); ctx.moveTo(this.width * 0.25, this.height / 2 - 7); ctx.lineTo(this.width * 0.3, this.height / 2 - 5); ctx.lineTo(this.width * 0.26, this.height / 2 - 5); ctx.fill();

                    // Wings
                    ctx.fillStyle = '#ccc'; ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(10, this.height / 2 - 2); ctx.lineTo(this.width * 0.8, 0); ctx.lineTo(this.width * 0.9, 0); ctx.lineTo(this.width * 0.2, this.height / 2 - 2); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = '#333'; ctx.fillRect(this.width * 0.9, -2, 10, 4); ctx.fillStyle = '#ff0000'; ctx.fillRect(this.width * 0.9 + 10, -1, 2, 2);
                    ctx.fillStyle = '#ccc';
                    ctx.beginPath(); ctx.moveTo(10, this.height / 2 + 2); ctx.lineTo(this.width * 0.8, this.height); ctx.lineTo(this.width * 0.9, this.height); ctx.lineTo(this.width * 0.2, this.height / 2 + 2); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = '#333'; ctx.fillRect(this.width * 0.9, this.height - 2, 10, 4); ctx.fillStyle = '#ff0000'; ctx.fillRect(this.width * 0.9 + 10, this.height - 1, 2, 2);

                    // Markings
                    ctx.strokeStyle = '#cc0000'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(this.width * 0.4, 5); ctx.lineTo(this.width * 0.6, 2); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(this.width * 0.4, this.height - 5); ctx.lineTo(this.width * 0.6, this.height - 2); ctx.stroke();

                    // R2
                    ctx.fillStyle = '#0000ff'; ctx.beginPath(); ctx.arc(this.width * 0.15, this.height / 2, 3, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#fff'; ctx.fillRect(this.width * 0.15 - 1, this.height / 2 - 1, 2, 2);
                }

                drawAWing(ctx) {
                    ctx.shadowBlur = 15; ctx.shadowColor = '#ff4400';
                    ctx.fillStyle = '#ff8800'; ctx.beginPath(); ctx.arc(0, this.height * 0.3, 3, 0, Math.PI * 2); ctx.arc(0, this.height * 0.7, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
                    ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.moveTo(0, this.height * 0.3); ctx.lineTo(this.width, this.height / 2); ctx.lineTo(0, this.height * 0.7); ctx.closePath(); ctx.fill();
                    ctx.fillStyle = '#cc0000'; ctx.beginPath(); ctx.moveTo(10, this.height * 0.35); ctx.lineTo(this.width * 0.6, this.height / 2); ctx.lineTo(10, this.height * 0.65); ctx.fill();
                    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(this.width * 0.4, this.height / 2, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
                }

                drawYWing(ctx) {
                    ctx.shadowBlur = 15; ctx.shadowColor = '#ffaa00';
                    ctx.fillStyle = '#ddd'; ctx.fillRect(0, 0, this.width * 0.8, 6); ctx.fillRect(0, this.height - 6, this.width * 0.8, 6);
                    ctx.fillStyle = '#ffaa00'; ctx.fillRect(0, 1, 2, 4); ctx.fillRect(0, this.height - 5, 2, 4); ctx.shadowBlur = 0;
                    ctx.fillStyle = '#eee'; ctx.fillRect(this.width * 0.2, this.height / 2 - 4, this.width * 0.8, 8);
                    ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(this.width * 0.9, this.height / 2, 6, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ddaa00'; ctx.fillRect(this.width * 0.3, this.height / 2 - 2, this.width * 0.4, 4);
                }

                getBounds() {
                    return {
                        x: this.x,
                        y: this.y,
                        width: this.width,
                        height: this.height
                    };
                }

                loseLife() {
                    this.lives--;
                    if (this.lives > 0) {
                        this.respawn();
                    } else {
                        this.game.gameOver();
                    }
                }

                respawn() {
                    // Reset stats for new life
                    this.weaponLevel = 1;
                    this.fuel = 100;

                    // Activate respawn invincibility
                    this.isRespawning = true;
                    this.respawnTimer = 3000; // 3 seconds of blinking invincibility
                    this.blinkTimer = 0;

                    // Play respawn sound (optional)
                    this.game.audio.playTone(880, 'square', 0.1);
                }
            }
