import Utils from './Utils.js';
import Projectile from './Projectile.js';

export default class Boss {
    constructor(game, level = 1) {
        this.game = game;
        this.level = level;
        this.width = 200;
        this.height = 120;
        this.x = game.width + 100; // Start off-screen
        this.y = game.height / 2 - this.height / 2;
        this.speedX = 2 + (level * 0.5);
        this.speedY = 2 + (level * 0.2);
        this.health = 500 + (level * 200);
        this.maxHealth = this.health;
        this.markedForDeletion = false;

        this.state = 'ENTERING'; // ENTERING, FIGHTING, DYING
        this.targetX = game.width - 300; // Target position for fighting

        this.shootTimer = 0;
        this.shootInterval = Math.max(20, 100 - (level * 10)); // Faster shooting per level
        this.angle = 0; // For movement pattern

        this.attackPattern = 0;
        this.attackTimer = 0;
        this.changeAttackInterval = 3000; // Change attack every 3s

        // Destructible Cannons
        this.cannons = [
            { id: 1, x: 40, y: 20, width: 30, height: 15, health: 100, maxHealth: 100, active: true, color: '#888' }, // Top
            { id: 2, x: 40, y: this.height - 35, width: 30, height: 15, health: 100, maxHealth: 100, active: true, color: '#888' }  // Bottom
        ];
    }

    update(deltaTime) {
        if (this.state === 'ENTERING') {
            if (this.x > this.targetX) {
                this.x -= this.speedX;
            } else {
                this.state = 'FIGHTING';
            }
        } else if (this.state === 'FIGHTING') {
            // Hover pattern (Sine wave)
            this.angle += 0.02 + (this.level * 0.005);
            this.y += Math.sin(this.angle) * this.speedY;

            // Clamp to screen
            this.y = Utils.clamp(this.y, 50, this.game.height - this.height - 50);

            // Attack Logic
            this.attackTimer += deltaTime;
            if (this.attackTimer > this.changeAttackInterval) {
                this.attackPattern = (this.attackPattern + 1) % 3; // Cycle 0, 1, 2
                this.attackTimer = 0;
            }

            this.shootTimer += deltaTime;
            if (this.shootTimer > this.shootInterval) {
                // Only active cannons shoot
                const activeCannons = this.cannons.filter(c => c.active);

                if (activeCannons.length > 0) {
                    if (this.attackPattern === 0) this.shootSingle(activeCannons);
                    else if (this.attackPattern === 1) this.shootSpread(activeCannons);
                    else if (this.attackPattern === 2) this.shootRapid(activeCannons);
                } else {
                    // Main body backup fire (weaker) if all cannons dead
                    if (Math.random() > 0.8) this.fireProjectile(0, 8, this.x, this.y + this.height / 2);
                }

                this.shootTimer = 0;
            }
        }
    }

    checkCollision(projectile) {
        // Check Cannons first
        for (let cannon of this.cannons) {
            if (!cannon.active) continue;

            const cannonBounds = {
                x: this.x + cannon.x,
                y: this.y + cannon.y,
                width: cannon.width,
                height: cannon.height
            };

            if (Utils.checkCollision(projectile, cannonBounds)) {
                cannon.health -= projectile.damage;
                if (cannon.health <= 0) {
                    cannon.active = false;
                    this.game.audio.playExplosionSound();
                    this.game.world.createExplosion(cannonBounds.x + cannonBounds.width / 2, cannonBounds.y + cannonBounds.height / 2, 15, '#ffaa00');
                } else {
                    this.game.world.createExplosion(projectile.x, projectile.y, 3, '#ffaa00');
                }
                return true; // Hit handled
            }
        }

        // Check Main Body
        if (Utils.checkCollision(projectile, this.getBounds())) {
            this.health -= projectile.damage;
            this.game.world.createExplosion(projectile.x, projectile.y, 5, '#ff0000');
            return true;
        }

        return false;
    }

    shootSingle(cannons) {
        cannons.forEach(c => {
            this.fireProjectile(0, 10, this.x + c.x, this.y + c.y + c.height / 2);
        });
    }

    shootSpread(cannons) {
        cannons.forEach(c => {
            this.fireProjectile(0, 10, this.x + c.x, this.y + c.y + c.height / 2);
            this.fireProjectile(-0.2, 10, this.x + c.x, this.y + c.y + c.height / 2);
            this.fireProjectile(0.2, 10, this.x + c.x, this.y + c.y + c.height / 2);
        });
    }

    shootRapid(cannons) {
        // Random cannon fires
        const c = cannons[Math.floor(Math.random() * cannons.length)];
        this.fireProjectile((Math.random() - 0.5) * 0.5, 12, this.x + c.x, this.y + c.y + c.height / 2);
    }

    fireProjectile(angleOffset, speed, startX, startY) {
        const player = this.game.player;
        const dx = player.x - startX;
        const dy = player.y - startY;
        const angle = Math.atan2(dy, dx);

        const finalAngle = angle + angleOffset;
        const vx = Math.cos(finalAngle) * speed;
        const vy = Math.sin(finalAngle) * speed;

        this.game.world.addProjectile(new Projectile(startX, startY, vx, vy, 'ENEMY'));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Boss Body (Star Destroyer Wedge)
        const gradient = ctx.createLinearGradient(0, 0, this.width, 0);
        gradient.addColorStop(0, '#222');
        gradient.addColorStop(0.5, '#444');
        gradient.addColorStop(1, '#222');

        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;

        // Main Hull (Wedge)
        ctx.beginPath();
        ctx.moveTo(this.width, this.height / 2); // Nose
        ctx.lineTo(0, 0); // Top Rear
        ctx.lineTo(20, this.height / 2); // Rear Center indentation
        ctx.lineTo(0, this.height); // Bottom Rear
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Superstructure (Bridge Tower)
        ctx.fillStyle = '#333';
        ctx.fillRect(20, this.height / 2 - 15, 40, 30);
        ctx.fillStyle = '#111';
        ctx.fillRect(30, this.height / 2 - 5, 20, 10); // Bridge Window

        // Draw Cannons
        this.cannons.forEach(c => {
            if (c.active) {
                ctx.fillStyle = '#555';
                ctx.fillRect(c.x, c.y, c.width, c.height);

                // Barrel
                ctx.fillStyle = '#222';
                ctx.fillRect(c.x + c.width, c.y + c.height / 2 - 2, 10, 4);

                // Health indicator for cannon
                ctx.fillStyle = c.health < 50 ? 'red' : 'lime';
                ctx.fillRect(c.x, c.y - 5, c.width * (c.health / c.maxHealth), 3);
            } else {
                // Destroyed Cannon
                ctx.fillStyle = '#111';
                ctx.fillRect(c.x, c.y, c.width, c.height);
                // Smoke/Fire effect could be added here in update loop, but for simple draw:
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.beginPath(); ctx.arc(c.x + c.width / 2, c.y + c.height / 2, 10, 0, Math.PI * 2); ctx.fill();
            }
        });

        // Engine Glow (Massive Rear Engines)
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00aaff'; // Blue Ion Engines
        ctx.fillStyle = '#fff';

        // Three main engines
        ctx.beginPath();
        ctx.arc(0, this.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, this.height / 2 - 20, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, this.height / 2 + 20, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Health Bar (Integrated)
        const barWidth = this.width;
        const barHeight = 6;
        const healthPercent = Math.max(0, this.health / this.maxHealth);

        ctx.fillStyle = '#000';
        ctx.fillRect(0, -15, barWidth, barHeight);

        ctx.fillStyle = this.health < this.maxHealth * 0.3 ? '#ff0000' : '#00ff00';
        ctx.fillRect(0, -15, barWidth * healthPercent, barHeight);

        // Level Indicator
        ctx.fillStyle = '#aaa';
        ctx.font = '12px Arial';
        ctx.fillText(`CLASS ${this.level} DESTROYER`, 0, -20);

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}
