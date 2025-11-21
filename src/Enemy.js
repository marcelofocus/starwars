import Utils from './Utils.js';
import Projectile from './Projectile.js';

export default class Enemy {
    constructor(game) {
        this.game = game;
        this.width = 40;
        this.height = 40;
        this.x = this.game.width;
        this.y = Utils.random(0, this.game.height - this.height);
        this.vx = Utils.random(-3, -6);
        this.vy = Utils.random(-1, 1);
        this.markedForDeletion = false;
        this.color = '#ff0055';
        this.health = 1;
        this.scoreValue = 100;
        this.type = 'DRONE';

        // Randomize type
        if (Math.random() > 0.8) {
            this.type = 'INTERCEPTOR';
            this.width = 30;
            this.height = 20;
            this.vx = -8;
            this.color = '#ffaa00';
            this.health = 2;
            this.scoreValue = 200;
        } else if (Math.random() > 0.95) {
            this.type = 'TANK';
            this.width = 60;
            this.height = 60;
            this.vx = -2;
            this.color = '#ff0000';
            this.health = 5;
            this.scoreValue = 500;
        }
    }

    update(deltaTime) {
        this.x += this.vx * (deltaTime / 16);
        this.y += this.vy * (deltaTime / 16);

        // Simple sine wave movement for Drones
        if (this.type === 'DRONE') {
            this.y += Math.sin(this.x * 0.01) * 2;
        }

        // Interceptors track player slightly
        if (this.type === 'INTERCEPTOR') {
            if (this.game.player.y > this.y) this.vy += 0.1;
            else this.vy -= 0.1;
            this.vy = Utils.clamp(this.vy, -2, 2);
        }

        // Shooting Logic
        if (Math.random() < 0.005) { // 0.5% chance per frame
            this.shoot();
        }

        // Check bounds
        if (this.x + this.width < 0) this.markedForDeletion = true;
    }

    shoot() {
        if (this.x > 0 && this.x < this.game.width) {
            this.game.world.addProjectile(new Projectile(this.x, this.y + this.height / 2, -10, 0, 'ENEMY'));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = '#aaaaaa';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00ff00'; // Green glow for TIEs

        if (this.type === 'DRONE') {
            // TIE Fighter (Standard)
            // Center Pod
            ctx.beginPath();
            ctx.arc(this.width / 2, this.height / 2, 8, 0, Math.PI * 2);
            ctx.fill();
            // Wings (Hexagons)
            ctx.fillStyle = '#222';
            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 2;

            // Left Wing
            ctx.fillRect(0, 0, 4, this.height);
            ctx.strokeRect(0, 0, 4, this.height);

            // Right Wing
            ctx.fillRect(this.width - 4, 0, 4, this.height);
            ctx.strokeRect(this.width - 4, 0, 4, this.height);

            // Struts
            ctx.beginPath();
            ctx.moveTo(4, this.height / 2);
            ctx.lineTo(this.width - 4, this.height / 2);
            ctx.stroke();

        } else if (this.type === 'INTERCEPTOR') {
            // TIE Interceptor
            ctx.fillStyle = '#222';
            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 2;

            // Center Pod
            ctx.beginPath();
            ctx.arc(this.width / 2, this.height / 2, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#aaa';
            ctx.fill();

            // Wings (Pointy)
            ctx.beginPath();
            // Left
            ctx.moveTo(10, this.height / 2);
            ctx.lineTo(0, 0);
            ctx.lineTo(5, this.height / 2);
            ctx.lineTo(0, this.height);
            ctx.lineTo(10, this.height / 2);
            // Right
            ctx.moveTo(this.width - 10, this.height / 2);
            ctx.lineTo(this.width, 0);
            ctx.lineTo(this.width - 5, this.height / 2);
            ctx.lineTo(this.width, this.height);
            ctx.lineTo(this.width - 10, this.height / 2);
            ctx.fillStyle = '#222';
            ctx.fill();
            ctx.stroke();

        } else if (this.type === 'TANK') {
            // TIE Bomber / Heavy
            // Double Pod
            ctx.fillStyle = '#aaa';
            ctx.beginPath();
        }
        ctx.restore();
    }
}
