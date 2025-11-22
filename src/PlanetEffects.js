/**
 * Planet Power-Up Visual Effects Module
 * Provides animated visual effects for planet power-ups
 */

export default class PlanetEffects {
    /**
     * Draw animated fuel gas particles
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} radius - Planet radius
     */
    static drawFuelEffect(ctx, radius) {
        const time = Date.now() / 1000;

        // Floating gas particles (yellow/orange)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time;
            const dist = radius * 0.6 + Math.sin(time * 2 + i) * 10;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist * 0.5; // Elliptical

            const alpha = 0.6 + Math.sin(time * 4 + i) * 0.3;
            const color = 170 + Math.sin(time * 3 + i) * 50;

            ctx.fillStyle = `rgba(255, ${color}, 0, ${alpha})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffaa00';
            ctx.beginPath();
            ctx.arc(px, py, 3 + Math.sin(time * 5 + i) * 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    /**
     * Draw pulsing shield energy rings
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} radius - Planet radius
     */
    static drawShieldEffect(ctx, radius) {
        const time = Date.now() / 1000;

        // Pulsing cyan energy rings
        for (let i = 0; i < 3; i++) {
            const pulse = Math.sin(time * 3 + i) * 0.3 + 0.7;
            const ringRadius = radius * (0.4 + i * 0.15) * pulse;
            const alpha = 0.8 - i * 0.2;

            ctx.strokeStyle = `rgba(0, 243, 255, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f3ff';
            ctx.beginPath();
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    /**
     * Draw electric weapon sparks
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} radius - Planet radius
     */
    static drawWeaponEffect(ctx, radius) {
        const time = Date.now() / 1000;

        // Electric sparks/lightning
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffff00';

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + time * 2;
            const length = radius * 0.5;
            const jitter = Math.sin(time * 10 + i) * 5;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(
                Math.cos(angle) * length + jitter,
                Math.sin(angle) * length + jitter
            );
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    /**
     * Draw animated rapid fire flames
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} radius - Planet radius
     */
    static drawRapidFireEffect(ctx, radius) {
        const time = Date.now() / 1000;

        // Animated flames
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const flicker = Math.sin(time * 8 + i) * 0.3 + 0.7;
            const dist = radius * 0.4 * flicker;
            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist - 10 * flicker; // Rise upward

            // Radial gradient for flame effect
            const gradient = ctx.createRadialGradient(px, py, 0, px, py, 10);
            gradient.addColorStop(0, `rgba(255, 200, 0, ${flicker})`); // Bright center
            gradient.addColorStop(0.5, `rgba(255, 100, 0, ${flicker * 0.7})`); // Orange
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)'); // Fade to transparent

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(px, py, 8 * flicker, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Main render function - draws appropriate effect based on planet type
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} type - Planet type ('FUEL', 'SHIELD', 'WEAPON', 'RAPID_FIRE')
     * @param {number} radius - Planet radius
     */
    static render(ctx, type, radius) {
        switch (type) {
            case 'FUEL':
                this.drawFuelEffect(ctx, radius);
                break;
            case 'SHIELD':
                this.drawShieldEffect(ctx, radius);
                break;
            case 'WEAPON':
                this.drawWeaponEffect(ctx, radius);
                break;
            case 'RAPID_FIRE':
                this.drawRapidFireEffect(ctx, radius);
                break;
            default:
                // No effect for 'NONE' type
                break;
        }
    }
}
