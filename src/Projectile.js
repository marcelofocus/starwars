export default class Projectile {
    constructor(x, y, vx, vy, type = 'DEFAULT') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 10;
        this.height = 4;
        this.speed = 10;
        this.damage = 1;
        this.color = '#00ff41'; // Rebel Green Neon (Star Wars style)
        this.markedForDeletion = false;
        this.type = type;

        if (this.type === 'POWER') {
            this.width = 20;
            this.height = 6;
            this.damage = 3;
            this.color = '#00d9ff'; // Power Cyan-Blue (strong shots)
        } else if (this.type === 'ENEMY') {
            this.width = 10;
            this.height = 4;
            this.damage = 10; // High damage to player
            this.color = '#ff0033'; // Imperial Red (Empire lasers)
        }
    }

    update(deltaTime) {
        this.x += this.vx * (deltaTime / 16);
        this.y += this.vy * (deltaTime / 16);
    }

    draw(ctx) {
        // Star Wars-style laser beams (elongated rectangles with intense glow)
        const beamLength = this.type === 'POWER' ? 20 : 15;
        const beamWidth = this.type === 'POWER' ? 3 : 2;

        // Intense glow for laser effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Core beam (bright)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y - beamWidth / 2, beamLength, beamWidth);

        // Outer glow (softer, wider)
        ctx.globalAlpha = 0.4;
        ctx.fillRect(this.x - 1, this.y - beamWidth / 2 - 1, beamLength + 2, beamWidth + 2);

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }
}
