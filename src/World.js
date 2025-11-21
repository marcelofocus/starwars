import Utils from './Utils.js';
import Enemy from './Enemy.js';
import Meteor from './Meteor.js';
import Boss from './Boss.js';

export default class World {
    constructor(game) {
        this.game = game;
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.meteors = [];
        this.boss = null;
        this.bossSpawned = false;
        this.bossLevel = 1;
        this.nextBossScore = 10000;

        this.bgOffset = 0;
        this.enemyTimer = 0;
        this.enemyInterval = 1500;
        this.meteorTimer = 0;
        this.meteorInterval = 2000;
        this.speed = 5;

        this.stars = [];
        this.planets = [];
        this.nebulae = [];
        this.initBackground();
        this.planetTimer = 0;
    }

    initBackground() {
        for (let i = 0; i < 300; i++) {
            this.stars.push({
                x: Math.random() * this.game.width,
                y: Math.random() * this.game.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.5
            });
        }

        for (let i = 0; i < 5; i++) {
            this.nebulae.push({
                x: Math.random() * this.game.width,
                y: Math.random() * this.game.height,
                radius: Utils.random(200, 400),
                color: `hsla(${Utils.random(220, 320)}, 60%, 50%, 0.1)`
            });
        }
    }

    update(deltaTime) {
        // Update stars
        this.stars.forEach(star => {
            star.x -= (this.speed * star.speed * 0.1) * (deltaTime / 16);
            if (star.x < 0) {
                star.x = this.game.width;
                star.y = Math.random() * this.game.height;
            }
        });

        // Update planets
        this.planetTimer += deltaTime;
        const hasFuelPlanet = this.planets.some(p => p.type === 'FUEL');
        if (this.game.player.fuel < 30 && !hasFuelPlanet && this.planetTimer > 1000) {
            this.spawnPlanet(true);
            this.planetTimer = 0;
        }

        if (this.planetTimer > 10000) {
            this.spawnPlanet();
            this.planetTimer = 0;
        }

        this.planets.forEach((planet, index) => {
            planet.x -= (this.speed * planet.speed) * (deltaTime / 16);
            if (planet.x + planet.radius < 0) {
                this.planets.splice(index, 1);
            }

            if (planet.type !== 'NONE') {
                const dx = this.game.player.x - planet.x;
                const dy = this.game.player.y - planet.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < planet.radius + this.game.player.width) {
                    if (planet.type === 'WEAPON') {
                        planet.type = 'NONE';
                        if (this.game.player.weaponLevel < this.game.player.maxWeaponLevel) {
                            this.game.player.weaponLevel++;
                            this.game.audio.playCollectSound();
                        }
                    } else if (planet.type === 'RAPID_FIRE') {
                        planet.type = 'NONE';
                        this.game.player.activateRapidFire(10000);
                        this.game.audio.playCollectSound();
                    } else if (planet.type === 'SHIELD') {
                        this.game.player.activateShield(10000);
                        this.game.audio.playShieldMusic();
                        planet.type = 'NONE';
                    } else if (planet.type === 'FUEL') {
                        this.game.player.refuel(50);
                        this.game.audio.startRefuelSound();
                        planet.type = 'NONE';
                    }
                }
            }
        });

        // Boss logic
        if (!this.bossSpawned && this.game.score >= this.nextBossScore) {
            this.boss = new Boss(this.game, this.bossLevel);
            this.bossSpawned = true;
            this.enemies.forEach(e => e.markedForDeletion = true);
            this.game.audio.playBossMusic();
        }

        if (this.boss) {
            this.boss.update(deltaTime);
            if (this.boss.health <= 0) {
                // Store coordinates before clearing boss
                const bossX = this.boss.x + this.boss.width / 2;
                const bossY = this.boss.y + this.boss.height / 2;

                this.createExplosion(bossX, bossY, 100, '#ff0000');
                this.boss = null;
                this.bossSpawned = false;
                this.game.score += 5000 * this.bossLevel;

                this.bossLevel++;
                this.nextBossScore += 3000;
                this.speed += 1;
                this.enemyInterval = Math.max(200, this.enemyInterval - 100);

                this.createCelebration(bossX, bossY);
                this.game.audio.playMusic();
            }
        } else {
            this.enemyTimer += deltaTime;
            if (this.enemyTimer > this.enemyInterval) {
                this.spawnEnemy();
                this.enemyTimer = 0;
                if (this.enemyInterval > 500) this.enemyInterval -= 20;
                this.speed += 0.005;
            }

            this.meteorTimer += deltaTime;
            if (this.meteorTimer > this.meteorInterval) {
                this.meteors.push(new Meteor(this.game));
                this.meteorTimer = 0;
                this.meteorInterval = Utils.random(1000, 3000);
            }
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime);
            if (enemy.markedForDeletion) {
                this.enemies.splice(i, 1);
            }
        }

        // Update meteors
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const meteor = this.meteors[i];
            meteor.update(deltaTime);
            if (meteor.markedForDeletion) {
                this.meteors.splice(i, 1);
                continue;
            }

            const playerBounds = this.game.player.getBounds();
            playerBounds.x += 10;
            playerBounds.width -= 20;
            playerBounds.y += 10;
            playerBounds.height -= 20;

            const meteorBounds = {
                x: meteor.x - meteor.radius * 0.8,
                y: meteor.y - meteor.radius * 0.8,
                width: meteor.radius * 1.6,
                height: meteor.radius * 1.6
            };

            if (Utils.checkCollision({ x: meteorBounds.x, y: meteorBounds.y, width: meteorBounds.width, height: meteorBounds.height }, playerBounds)) {
                meteor.markedForDeletion = true;
                this.createExplosion(meteor.x, meteor.y, 30, '#ff8800');
                this.game.audio.playExplosionSound();

                if (!this.game.player.shieldActive && !this.game.player.isRespawning) {
                    this.game.player.loseLife();
                }
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(deltaTime);
            if (p.x > this.game.width || p.x < 0 || p.y > this.game.height || p.y < 0) {
                p.markedForDeletion = true;
            }

            if (p.markedForDeletion) {
                this.projectiles.splice(i, 1);
                continue;
            }
        }

        // Projectile vs projectile
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p1 = this.projectiles[i];
            if (p1.markedForDeletion || p1.type === 'ENEMY') continue;

            for (let j = this.projectiles.length - 1; j >= 0; j--) {
                const p2 = this.projectiles[j];
                if (i === j || p2.markedForDeletion || p2.type !== 'ENEMY') continue;

                if (Utils.checkCollision(p1, p2)) {
                    p1.markedForDeletion = true;
                    p2.markedForDeletion = true;
                    this.createExplosion(p1.x, p1.y, 3, '#ffaa00');
                    break;
                }
            }
        }

        // Collisions
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            if (p.markedForDeletion) continue;

            if (p.type === 'ENEMY') {
                const playerBounds = this.game.player.getBounds();
                playerBounds.x += 10;
                playerBounds.width -= 20;
                playerBounds.y += 5;
                playerBounds.height -= 10;

                if (Utils.checkCollision(p, playerBounds)) {
                    p.markedForDeletion = true;
                    this.createExplosion(p.x, p.y, 5, p.color);

                    if (!this.game.player.shieldActive && !this.game.player.isRespawning) {
                        this.game.player.loseLife();
                    }
                }
            } else {
                // Player projectile vs enemies
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (Utils.checkCollision(p, enemy)) {
                        enemy.health -= p.damage;
                        p.markedForDeletion = true;
                        this.createExplosion(p.x, p.y, 5, p.color);

                        if (enemy.health <= 0) {
                            enemy.markedForDeletion = true;
                            this.game.score += enemy.scoreValue;
                            this.game.audio.playExplosionSound();
                            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 20, enemy.color);
                            if (Math.random() > 0.9) this.game.player.weaponLevel = Math.min(this.game.player.weaponLevel + 1, 3);
                        }
                        break;
                    }
                }

                // Player projectile vs boss
                if (this.boss) {
                    if (this.boss.checkCollision(p)) {
                        p.markedForDeletion = true;
                    }
                }
            }

            // Player projectile vs meteors
            if (p.type !== 'ENEMY') {
                for (let k = this.meteors.length - 1; k >= 0; k--) {
                    const meteor = this.meteors[k];
                    const meteorBounds = {
                        x: meteor.x - meteor.radius,
                        y: meteor.y - meteor.radius,
                        width: meteor.radius * 2,
                        height: meteor.radius * 2
                    };

                    if (Utils.checkCollision(p, meteorBounds)) {
                        p.markedForDeletion = true;

                        const destroyed = meteor.takeDamage(1);

                        if (destroyed) {
                            const points = meteor.size === 'large' ? 50 : (meteor.size === 'medium' ? 30 : 20);
                            this.game.score += points;

                            const fragments = meteor.fragment();
                            this.meteors.push(...fragments);

                            this.createExplosion(meteor.x, meteor.y, 20, '#ff8800');
                            this.game.audio.playExplosionSound();
                        } else {
                            this.createExplosion(p.x, p.y, 5, '#aaa');
                        }

                        break;
                    }
                }
            }
        }

        // Update particles
        this.particles.forEach((p, index) => {
            if (p.isFlash) {
                p.size *= p.decay;
                p.life -= deltaTime;
            } else {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= deltaTime;
                p.size *= (p.decay || 1);
            }

            if (p.life <= 0 || p.size < 0.5) this.particles.splice(index, 1);
        });
    }

    spawnPlanet(forceFuel = false) {
        const radius = Utils.random(50, 150);
        const rand = Math.random();
        let type = 'NONE';

        if (forceFuel || this.game.player.fuel < 30) {
            type = 'FUEL';
        } else {
            if (rand < 0.35) {
                type = 'FUEL';
            } else if (rand < 0.55) {
                type = 'SHIELD';
            } else if (rand < 0.80) {
                type = 'WEAPON';
            } else if (rand < 0.95) {
                type = 'RAPID_FIRE';
            } else {
                type = 'NONE';
            }
        }

        this.planets.push({
            x: this.game.width + radius,
            y: Utils.random(radius, this.game.height - radius),
            radius: radius,
            color: `hsl(${Utils.random(0, 360)}, 70%, 50%)`,
            speed: 0.5,
            type: type,
            hasRings: Math.random() > 0.5,
            ringColor: `hsla(${Utils.random(0, 360)}, 40%, 60%, 0.6)`,
            ringAngle: Utils.random(-0.5, 0.5)
        });
    }

    spawnEnemy() {
        this.enemies.push(new Enemy(this.game));
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    createCelebration(x, y) {
        this.createExplosion(x, y, 200, '#ffaa00');
        this.createExplosion(x, y, 100, '#ffffff');

        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Utils.random(-15, 15),
                vy: Utils.random(-15, 15),
                size: Utils.random(5, 15),
                color: `hsl(${Utils.random(0, 360)}, 100%, 50%)`,
                life: Utils.random(1000, 2000),
                decay: 0.98
            });
        }
    }

    createExplosion(x, y, particleCount, baseColor) {
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Utils.random(-5, 5),
                vy: Utils.random(-5, 5),
                size: Utils.random(2, 8),
                color: baseColor,
                life: Utils.random(200, 600),
                decay: 0.95
            });
        }

        this.particles.push({
            x: x,
            y: y,
            size: 50,
            color: '#ffffff',
            life: 100,
            isFlash: true,
            decay: 0.8
        });
    }

    reset() {
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.meteors = [];
        this.boss = null;
        this.bossSpawned = false;
        this.bossLevel = 1;
        this.nextBossScore = 10000;
        this.enemyTimer = 0;
        this.enemyInterval = 1500;
        this.meteorTimer = 0;
        this.meteorInterval = 2000;
        this.speed = 5;
        this.planetTimer = 0;
        this.planets = [];
    }

    draw(ctx) {
        // Draw nebulae
        this.nebulae.forEach(nebula => {
            const gradient = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius);
            gradient.addColorStop(0, nebula.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.game.width, this.game.height);
        });

        // Draw stars
        this.stars.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });

        // Draw planets
        this.planets.forEach(planet => {
            ctx.save();
            ctx.translate(planet.x, planet.y);

            // Multi-band Saturn-style rings configuration
            const ringRadii = [
                { inner: planet.radius * 1.3, outer: planet.radius * 1.5, alpha: 0.6 },
                { inner: planet.radius * 1.55, outer: planet.radius * 1.75, alpha: 0.4 },
                { inner: planet.radius * 1.8, outer: planet.radius * 1.95, alpha: 0.3 }
            ];

            // BACK HALF of rings (behind planet)
            if (planet.hasRings) {
                ctx.save();
                ctx.rotate(planet.ringAngle);

                ringRadii.forEach(ring => {
                    ctx.beginPath();
                    // Bottom half: π to 2π (behind planet)
                    ctx.ellipse(0, 0, ring.outer, ring.outer * 0.15, 0, Math.PI, Math.PI * 2);
                    ctx.ellipse(0, 0, ring.inner, ring.inner * 0.15, 0, Math.PI * 2, Math.PI, true);
                    ctx.closePath();

                    const ringColor = planet.ringColor.replace(/[\d.]+\)$/, `${ring.alpha * 0.7})`); // Darker behind
                    ctx.fillStyle = ringColor;
                    ctx.fill();
                    ctx.strokeStyle = ringColor.replace(/[\d.]+\)$/, `${ring.alpha * 0.5})`);
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                });

                ctx.restore();
            }

            // Draw planet body
            const gradient = ctx.createRadialGradient(0, 0, planet.radius * 0.3, 0, 0, planet.radius);
            gradient.addColorStop(0, planet.color);
            gradient.addColorStop(1, '#000');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, planet.radius, 0, Math.PI * 2);
            ctx.fill();

            // FRONT HALF of rings (in front of planet)
            if (planet.hasRings) {
                ctx.save();
                ctx.rotate(planet.ringAngle);

                ringRadii.forEach(ring => {
                    ctx.beginPath();
                    // Top half: 0 to π (in front of planet)
                    ctx.ellipse(0, 0, ring.outer, ring.outer * 0.15, 0, 0, Math.PI);
                    ctx.ellipse(0, 0, ring.inner, ring.inner * 0.15, 0, Math.PI, 0, true);
                    ctx.closePath();

                    const ringColor = planet.ringColor.replace(/[\d.]+\)$/, `${ring.alpha})`);
                    ctx.fillStyle = ringColor;
                    ctx.fill();
                    ctx.strokeStyle = ringColor.replace(/[\d.]+\)$/, `${ring.alpha * 0.7})`);
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                });

                ctx.restore();
            }

            // Power-up icons
            if (planet.type !== 'NONE') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.font = `${planet.radius * 0.5}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const icons = { FUEL: '⛽', SHIELD: '🛡️', WEAPON: '⚡', RAPID_FIRE: '🔥' };
                ctx.fillText(icons[planet.type] || '�', 0, 0);
            }

            ctx.restore();
        });

        // Draw meteors
        this.meteors.forEach(meteor => meteor.draw(ctx));

        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(ctx));

        // Draw boss
        if (this.boss) this.boss.draw(ctx);

        // Draw projectiles
        this.projectiles.forEach(p => p.draw(ctx));

        // Draw particles
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life / 600;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}
