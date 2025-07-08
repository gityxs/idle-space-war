// Main canvas rendering system with modular architecture
window.canvasInterop = {
    currentRotationY: 0, // Track current planet rotation for particle projection
    lastFrameTime: performance.now(),
    currentPlanetIndex: 0, // Track current planet for theming

    drawPositions: function (canvasId, planet, ships, enemies, axes, rotationY, planetIndex = 0) {
        // Store current rotation for particle calculations
        if (rotationY !== undefined) {
            this.currentRotationY = rotationY;
        }
        
        // Store current planet index for theming
        if (planetIndex !== undefined) {
            this.currentPlanetIndex = planetIndex;
        }

        const canvas = document.getElementById(canvasId);
        const rect = canvas.getBoundingClientRect();

        // ✅ 実描画サイズをCSSサイズに合わせる
        canvas.width = rect.width;
        canvas.height = rect.height;

        if (canvas && canvas.getContext) {
            const ctx = canvas.getContext('2d');
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // Get planet theme for current planet
            const planetTheme = colorUtils.getPlanetTheme(this.currentPlanetIndex);

            // Clear canvas and set themed background
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = planetTheme.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(centerX, centerY);

            // Initialize and draw themed starfield background
            spaceRenderer.initializeStars(canvas.width, canvas.height);
            spaceRenderer.drawStars(ctx, canvas.width, canvas.height);

            // Draw themed background
            spaceRenderer.drawThemedBackground(ctx, canvas.width, canvas.height, planetTheme);

            // 座標軸を描画
            if (axes) {
                ctx.strokeStyle = 'rgba(47, 79, 80, 0.7)';
                ctx.lineWidth = 1.0;

                const drawAxis = ({start, end}, color) => {
                    ctx.beginPath();
                    ctx.moveTo(start.x, start.y);
                    ctx.lineTo(end.x, end.y);
                    ctx.strokeStyle = color;
                    ctx.stroke();
                };

                drawAxis(axes.x, 'rgba(47, 79, 80, 0.7)');
                drawAxis(axes.y, 'rgba(47, 79, 80, 0.7)');
                drawAxis(axes.z, 'rgba(47, 79, 80, 0.7)');
            }

            // Planet rendering with themed color
            planetRenderer.drawPlanet(ctx, planet.x, planet.y, planet.radius, planetTheme.planet, rotationY);

            // Ship rendering with thruster trails
            ships.forEach((ship, shipIndex) => {
                const attackRatio = 1 - Math.max(0, Math.min(1, ship.attackIntervalRatio ?? 1)); // Clamp between 0 and 1
                const centerX = ship.x;
                const centerY = ship.y;
                const radius = 5;

                // Track ship position for thruster trail
                const shipId = `ship_${shipIndex}`;
                shipRenderer.updateShipTrail(shipId, centerX, centerY, ship.color);

                // Draw thruster trail first (behind ship)
                shipRenderer.drawShipTrail(ctx, shipId);

                // --- 攻撃範囲を描画 ---
                if (ship.attackRange !== undefined) {
                    ctx.beginPath();
                    ctx.arc(ship.x, ship.y, ship.attackRange, 0, 2 * Math.PI);
                    ctx.strokeStyle = changeAlpha(ship.color, 0.3);
                    ctx.lineWidth = 1;
                    ctx.setLineDash([4, 4]); // 破線
                    ctx.stroke();
                    ctx.setLineDash([]); // リセット
                }

                // Draw 3D ship with gradient and attack progress (on top of trail)
                shipRenderer.drawShip(ctx, centerX, centerY, radius, ship.color, attackRatio);
            });

            // Enemy rendering (only draw enemies with HP > 0)
            enemies.forEach(enemy => {
                const hpRatio = Math.max(0, Math.min(1, enemy.hpRatio ?? 1)); // Clamp between 0 and 1

                // Only draw enemies that are still alive
                if (hpRatio > 0) {
                    const centerX = enemy.x;
                    const centerY = enemy.y;
                    const radius = 5;

                    // Draw 3D enemy with gradient and HP indicator
                    enemyRenderer.drawEnemy(ctx, centerX, centerY, radius, enemy.color, hpRatio);
                }
            });

            // Check for enemy deaths and trigger particle effects
            particleRenderer.checkEnemyDeaths(enemies);

            // Calculate deltaTime once for consistent frame timing
            const currentTime = performance.now();
            const deltaTime = (currentTime - this.lastFrameTime) / 1000;
            this.lastFrameTime = currentTime;

            // Update and draw projectiles
            projectileRenderer.updateProjectiles(deltaTime);
            projectileRenderer.drawProjectiles(ctx);

            // Update and draw particles
            particleRenderer.updateParticles(deltaTime);
            particleRenderer.drawParticles(ctx);

            // Apply cinematic grain and vignette effects last
            spaceRenderer.drawGrainAndVignette(ctx, canvas.width, canvas.height);

            ctx.restore();
        } else {
            console.warn('canvas with id ' + canvasId + ' not found');
        }
    },

    // Legacy support methods for backward compatibility
    addProjectile: function(startX, startY, endX, endY, isHit, isCritical, isInstantKill) {
        projectileRenderer.addProjectile(startX, startY, endX, endY, isHit, isCritical, isInstantKill);
    },

    // Update planet theme when planet changes
    setPlanetIndex: function(planetIndex) {
        if (this.currentPlanetIndex !== planetIndex) {
            this.currentPlanetIndex = planetIndex;
            // Reset stars to regenerate with new theme
            spaceRenderer.resetStars();
        }
    },

    // Legacy color functions for backward compatibility
    lightenColor: function(color, percent) {
        return colorUtils.lightenColor(color, percent);
    },

    darkenColor: function(color, percent) {
        return colorUtils.darkenColor(color, percent);
    },

    setAlpha: function(color, alpha) {
        return colorUtils.setAlpha(color, alpha);
    },

    rgbToHsl: function(r, g, b) {
        return colorUtils.rgbToHsl(r, g, b);
    },

    hslToRgb: function(h, s, l) {
        return colorUtils.hslToRgb(h, s, l);
    }
};

// Window resize handler
window.addEventListener('resize', () => {
    const canvas = document.getElementById("battleCanvas");
    if (canvas) {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        // Reinitialize stars for new canvas size
        spaceRenderer.starsInitialized = false;

        // Clear noise canvas to regenerate for new size
        spaceRenderer.noiseCanvas = null;
    }
});

// Utility function for drawing axes (kept for compatibility)
function drawAxes(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const axisLength = Math.min(width, height) / 2 * 0.8;

    ctx.save();
    ctx.strokeStyle = 'rgba(47, 79, 80, 0.7)';
    ctx.lineWidth = 1.0;

    // X軸を描画（左右方向）
    ctx.beginPath();
    ctx.moveTo(centerX - axisLength, centerY);
    ctx.lineTo(centerX + axisLength, centerY);
    ctx.stroke();

    // Y軸を描画（上下方向）
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - axisLength);
    ctx.lineTo(centerX, centerY + axisLength);
    ctx.stroke();

    // Z軸を描画（左下から右上への斜め方向）
    const zAxisOffsetX = axisLength * Math.cos(Math.PI / 4);
    const zAxisOffsetY = axisLength * Math.sin(Math.PI / 4);

    ctx.beginPath();
    ctx.moveTo(centerX - zAxisOffsetX, centerY + zAxisOffsetY);
    ctx.lineTo(centerX + zAxisOffsetX, centerY - zAxisOffsetY);
    ctx.stroke();

    ctx.restore();
}