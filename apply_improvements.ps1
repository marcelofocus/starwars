# Safe File Editor - Apply Planet Effects and Forward Weapons
# This script makes precise line-by-line edits to avoid corruption

Write-Host "`n=== Applying Game Improvements ===`n" -ForegroundColor Cyan

# Step 1: Replace emoji icons with PlanetEffects in World.js
Write-Host "1. Updating World.js (Planet Animations)..." -ForegroundColor Yellow

$worldFile = "src\World.js"
$worldContent = Get-Content $worldFile -Raw

# Replace the emoji block (lines 516-524) with PlanetEffects.render()
$oldEmoj world = @"
            // Power-up icons
            if (planet.type !== 'NONE') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.font = `${planet.radius * 0.5}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const icons = { FUEL: '⛽', SHIELD: '🛡️', WEAPON: '⚡', RAPID_FIRE: '🔥' };
                ctx.fillText(icons[planet.type] || '❓', 0, 0);
            }
"@

$newPlanetEffects = @"
            // Animated Power-up Effects
            PlanetEffects.render(ctx, planet.type, planet.radius);
"@

if ($worldContent -match [regex]::Escape($oldEmojiWorld)) {
    $worldContent = $worldContent -replace [regex]::Escape($oldEmojiWorld), $newPlanetEffects
    $worldContent | Set-Content $worldFile -NoNewline
    Write-Host "   ✓ Planet animations applied!" -ForegroundColor Green
} else {
    Write-Host "   × Emoji block not found (may already be updated)" -ForegroundColor Red
}

# Step 2: Update Player.shoot() method to fire straight
Write-Host "`n2. Updating Player.js (Forward-Only Weapons)..." -ForegroundColor Yellow

$playerFile = "src\Player.js"
$playerLines = Get-Content $playerFile

# Find shoot() method start (around line 178)
$shootStart = -1
for ($i = 0; $i -lt $playerLines.Count; $i++) {
    if ($playerLines[$i] -match "^\s*shoot\(dirX = 1, dirY = 0\)") {
        $shootStart = $i
        break
    }
}

if ($shootStart -ge 0) {
    # Find shoot() method end (next closing brace at same indent level)
    $shootEnd = -1
    for ($i = $shootStart + 1; $i -lt $playerLines.Count; $i++) {
        if ($playerLines[$i] -match "^\s{4}\}$") { # Class-level closing brace
            $shootEnd = $i
            break
        }
    }
    
    if ($shootEnd -gt $shootStart) {
        # Replace entire shoot() method
        $newShootMethod = @'
    shoot(dirX = 1, dirY = 0) {
        this.game.audio.playShootSound();
        const x = this.x + this.width / 2;
        const y = this.y + this.height / 2;
        const speed = 15;
        const offsetY = 5; // Vertical spacing

        // Always shoot straight forward
        dirX = 1;
        dirY = 0;

        if (this.weaponLevel === 1) {
            this.game.world.addProjectile(new Projectile(x, y, dirX * speed, dirY * speed));
        } else if (this.weaponLevel === 2) {
            this.game.world.addProjectile(new Projectile(x, y - offsetY, dirX * speed, dirY * speed));
            this.game.world.addProjectile(new Projectile(x, y + offsetY, dirX * speed, dirY * speed));
        } else if (this.weaponLevel === 3) {
            this.game.world.addProjectile(new Projectile(x, y, dirX * speed, dirY * speed, 'POWER'));
            this.game.world.addProjectile(new Projectile(x, y - offsetY, dirX * speed, dirY * speed));
            this.game.world.addProjectile(new Projectile(x, y + offsetY, dirX * speed, dirY * speed));
        } else if (this.weaponLevel === 4) {
            this.game.world.addProjectile(new Projectile(x, y - offsetY * 1.5, dirX * speed, dirY * speed, 'POWER'));
            this.game.world.addProjectile(new Projectile(x, y - offsetY * 0.5, dirX * speed, dirY * speed));
            this.game.world.addProjectile(new Projectile(x, y + offsetY * 0.5, dirX * speed, dirY * speed));
            this.game.world.addProjectile(new Projectile(x, y + offsetY * 1.5, dirX * speed, dirY * speed, 'POWER'));
        } else if (this.weaponLevel >= 5) {
            this.game.world.addProjectile(new Projectile(x, y, dirX * speed * 1.5, dirY * speed, 'POWER'));
            this.game.world.addProjectile(new Projectile(x, y - offsetY * 2, dirX * speed, dirY * speed, 'POWER'));
            this.game.world.addProjectile(new Projectile(x, y - offsetY, dirX * speed, dirY * speed));
            this.game.world.addProjectile(new Projectile(x, y + offsetY, dirX * speed, dirY * speed));
            this.game.world.addProjectile(new Projectile(x, y + offsetY * 2, dirX * speed, dirY * speed, 'POWER'));
        }
    }
'@
        
        # Remove old method and insert new one
        $before = $playerLines[0..($shootStart - 1)]
        $after = $playerLines[($shootEnd + 1)..($playerLines.Count - 1)]
        $newContent = $before + $newShootMethod.Split("`n") + $after
        
        $newContent | Set-Content $playerFile
        Write-Host "   ✓ Forward-only weapons applied!" -ForegroundColor Green
    } else {
        Write-Host "   × Could not find shoot() end" -ForegroundColor Red
    }
} else {
    Write-Host "   × Could not find shoot() method" -ForegroundColor Red
}

Write-Host "`n=== Done! Reload the game (F5) to see changes ===`n" -ForegroundColor Cyan
