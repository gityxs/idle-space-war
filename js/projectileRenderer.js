// Projectile rendering and physics system
window.projectileRenderer = {
    projectiles: [],

    // Add a new projectile with curved trajectory
    addProjectile: function (startX, startY, endX, endY, isHit, isCritical, isInstantKill) {
        const projectile = {
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            currentX: startX,
            currentY: startY,
            progress: 0,
            speed: 400, // pixels per second (reduced from 800 for better visibility)
            lifetime: 0.8, // seconds (increased for longer flight time)
            age: 0,
            isHit: isHit,
            isCritical: isCritical,
            isInstantKill: isInstantKill,
            length: 35, // projectile length (increased from 20 for better visibility)
            active: true,
            // Calculate curved path parameters
            useCurvedPath: true,
            planetRadius: 70 // Default planet radius
        };
        this.projectiles.push(projectile);
    },

    // Calculate curved path along sphere surface
    calculateCurvedPosition: function (startX, startY, endX, endY, progress, planetRadius) {
        // Calculate the center-relative positions
        const startRadius = Math.sqrt(startX * startX + startY * startY);
        const endRadius = Math.sqrt(endX * endX + endY * endY);

        // If both points are on the sphere surface, use spherical interpolation
        if (Math.abs(startRadius - planetRadius) < 10 && Math.abs(endRadius - planetRadius) < 10) {
            // Spherical linear interpolation (slerp)
            const startAngle = Math.atan2(startY, startX);
            const endAngle = Math.atan2(endY, endX);

            // Handle angle wrapping
            let angleDiff = endAngle - startAngle;
            if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            const currentAngle = startAngle + angleDiff * progress;
            const currentRadius = planetRadius + (startRadius - planetRadius) * (1 - progress) + (endRadius - planetRadius) * progress;

            return {
                x: Math.cos(currentAngle) * currentRadius,
                y: Math.sin(currentAngle) * currentRadius
            };
        } else {
            // Fallback to linear interpolation for non-surface points
            return {
                x: startX + (endX - startX) * progress,
                y: startY + (endY - startY) * progress
            };
        }
    },

    // Update projectile positions and remove expired ones
    updateProjectiles: function (deltaTime) {
        this.projectiles = this.projectiles.filter(projectile => {
            if (!projectile.active) return false;

            projectile.age += deltaTime;

            // Calculate distance and direction
            const dx = projectile.endX - projectile.startX;
            const dy = projectile.endY - projectile.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Update progress based on speed
            const moveDistance = projectile.speed * deltaTime;
            projectile.progress = Math.min(1, projectile.progress + (moveDistance / distance));

            // Update current position using curved path if enabled
            if (projectile.useCurvedPath) {
                const curvedPos = this.calculateCurvedPosition(
                    projectile.startX, projectile.startY,
                    projectile.endX, projectile.endY,
                    projectile.progress, projectile.planetRadius
                );
                projectile.currentX = curvedPos.x;
                projectile.currentY = curvedPos.y;
            } else {
                // Linear interpolation fallback
                projectile.currentX = projectile.startX + dx * projectile.progress;
                projectile.currentY = projectile.startY + dy * projectile.progress;
            }

            // Remove if expired or reached target
            if (projectile.age >= projectile.lifetime || projectile.progress >= 1) {
                projectile.active = false;
                return false;
            }

            return true;
        });
    },

    // Draw all active projectiles
    drawProjectiles: function (ctx) {
        this.projectiles.forEach(projectile => {
            if (!projectile.active) return;

            // Calculate tail position for curved trajectory
            let tailX, tailY;

            if (projectile.useCurvedPath && projectile.progress > 0.05) {
                // Calculate position slightly behind current position along curved path
                const tailProgress = Math.max(0, projectile.progress - 0.05);
                const tailPos = this.calculateCurvedPosition(
                    projectile.startX, projectile.startY,
                    projectile.endX, projectile.endY,
                    tailProgress, projectile.planetRadius
                );
                tailX = tailPos.x;
                tailY = tailPos.y;
            } else {
                // Fallback to linear tail calculation
                const dx = projectile.endX - projectile.startX;
                const dy = projectile.endY - projectile.startY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance === 0) return; // Avoid division by zero

                // Normalize direction vector
                const dirX = dx / distance;
                const dirY = dy / distance;

                // Calculate projectile tail position
                tailX = projectile.currentX - dirX * projectile.length;
                tailY = projectile.currentY - dirY * projectile.length;
            }

            // Set projectile color based on attack type (enhanced visibility)
            let color = 'rgba(100, 150, 255, 0.9)'; // Default blue laser (increased opacity)
            let width = 3; // Increased base width

            if (projectile.isInstantKill) {
                color = 'rgba(255, 50, 50, 0.95)'; // Red for instant kill
                width = 5; // Thicker for instant kill
            } else if (projectile.isCritical) {
                color = 'rgba(255, 215, 0, 0.9)'; // Gold for critical
                width = 4; // Thicker for critical
            } else if (!projectile.isHit) {
                color = 'rgba(150, 150, 150, 0.7)'; // Gray for miss (increased opacity)
                width = 2.5; // Slightly thicker for miss
            }

            // Draw projectile as a line with enhanced glow effect
            ctx.shadowBlur = 12; // Increased glow
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(projectile.currentX, projectile.currentY);
            ctx.stroke();

            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        });
    }
};