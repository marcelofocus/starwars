import Utils from './Utils.js';

export default class Meteor {
    constructor(game, size = 'large', x = null, y = null) {
        this.game = game;
        this.size = size; // 'large', 'medium', 'small'

        // Size-based properties
        if (size === 'large') {
            this.radius = Utils.random(40, 60);
            this.health = 3;
            this.maxHealth = 3;
        } else if (size === 'medium') {
            this.radius = Utils.random(25, 35);
            this.health = 2;
            this.maxHealth = 2;
        } else { // small
            this.radius = Utils.random(15, 20);
            this.health = 1;
            this.maxHealth = 1;
        }

        this.x = x !== null ? x : this.game.width + this.radius;
        this.y = y !== null ? y : Utils.random(0, this.game.height);
        this.vx = Utils.random(-4, -8);
        this.vy = Utils.random(-2, 2);
        this.rotation = 0;
        this.rotationSpeed = Utils.random(-0.05, 0.05);
        this.markedForDeletion = false;
        this.damage = this.size === 'large' ? 20 : (this.size === 'medium' ? 15 : 10);

        // Procedural Rock Shape
        this.vertices = [];
        const segments = 12;
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const r = this.radius * (0.8 + Math.random() * 0.4); // 80-120% radius
            this.vertices.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }
    }

    update(deltaTime) {
        this.x += this.vx * (deltaTime / 16);
        this.y += this.vy * (deltaTime / 16);
        this.rotation += this.rotationSpeed;

        if (this.x + this.radius < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw Rock Body
        ctx.fillStyle = '#666666';
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();

        // Shading (Gradient)
        const gradient = ctx.createRadialGradient(-this.radius / 2, -this.radius / 2, 0, 0, 0, this.radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Craters
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.radius * 0.3, -this.radius * 0.2, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-this.radius * 0.2, this.radius * 0.4, this.radius * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    takeDamage(amount = 1) {
        this.health -= amount;

        if (this.health <= 0) {
            this.markedForDeletion = true;
            return true; // Destroyed
        }
        return false; // Still alive
    }

    fragment() {
        const fragments = [];

        if (this.size === 'large') {
            // Spawn 2 medium meteors
            for (let i = 0; i < 2; i++) {
                fragments.push(new Meteor(this.game, 'medium', this.x, this.y));
            }
        } else if (this.size === 'medium') {
            // Spawn 2 small meteors
            for (let i = 0; i < 2; i++) {
                fragments.push(new Meteor(this.game, 'small', this.x, this.y));
            }
        }
        // Small meteors don't fragment

        return fragments;
    }
}
