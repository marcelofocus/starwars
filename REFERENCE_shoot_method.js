/**
 * REFERENCE: Player.shoot() - Forward-Only Firing Pattern
 * Replace the shoot() method in src/Player.js (lines ~178-219) with this version
 * 
 * Changes:
 * - Removed angular spread (no Math.atan2, Math.cos, Math.sin)
 * - All shots fire straight forward (horizontal)
 * - Shots spread vertically using offsetY for parallel streams
 * - Ship movement controls direction naturally
 */

shoot(dirX = 1, dirY = 0) {
    this.game.audio.playShootSound();
    const x = this.x + this.width / 2;
    const y = this.y + this.height / 2;
    const speed = 15;
    const offsetY = 5; // Vertical spacing between parallel shots

    // Always shoot straight forward (horizontal)
    dirX = 1;
    dirY = 0;

    if (this.weaponLevel === 1) {
        // Single shot
        this.game.world.addProjectile(new Projectile(x, y, dirX * speed, dirY * speed));
    } else if (this.weaponLevel === 2) {
        // Double shot - parallel horizontal
        this.game.world.addProjectile(new Projectile(x, y - offsetY, dirX * speed, dirY * speed));
        this.game.world.addProjectile(new Projectile(x, y + offsetY, dirX * speed, dirY * speed));
    } else if (this.weaponLevel === 3) {
        // Triple shot - center POWER + two parallel
        this.game.world.addProjectile(new Projectile(x, y, dirX * speed, dirY * speed, 'POWER'));
        this.game.world.addProjectile(new Projectile(x, y - offsetY, dirX * speed, dirY * speed));
        this.game.world.addProjectile(new Projectile(x, y + offsetY, dirX * speed, dirY * speed));
    } else if (this.weaponLevel === 4) {
        // Quad shot - two POWER + two normal, all parallel
        this.game.world.addProjectile(new Projectile(x, y - offsetY * 1.5, dirX * speed, dirY * speed, 'POWER'));
        this.game.world.addProjectile(new Projectile(x, y - offsetY * 0.5, dirX * speed, dirY * speed));
        this.game.world.addProjectile(new Projectile(x, y + offsetY * 0.5, dirX * speed, dirY * speed));
        this.game.world.addProjectile(new Projectile(x, y + offsetY * 1.5, dirX * speed, dirY * speed, 'POWER'));
    } else if (this.weaponLevel >= 5) {
        // MEGA - 5 parallel shots, center is faster POWER
        this.game.world.addProjectile(new Projectile(x, y, dirX * speed * 1.5, dirY * speed, 'POWER')); // Center mega
        this.game.world.addProjectile(new Projectile(x, y - offsetY * 2, dirX * speed, dirY * speed, 'POWER'));
        this.game.world.addProjectile(new Projectile(x, y - offsetY, dirX * speed, dirY * speed));
        this.game.world.addProjectile(new Projectile(x, y + offsetY, dirX * speed, dirY * speed));
        this.game.world.addProjectile(new Projectile(x, y + offsetY * 2, dirX * speed, dirY * speed, 'POWER'));
    }
}
