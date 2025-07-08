// Planet and ring rendering system
window.planetRenderer = {
    // Draw cinematic planet with color-preserving gradients and atmospheric effects
    drawPlanet: function (ctx, x, y, radius, baseColor, rotationY) {
        ctx.save();

        // Use provided baseColor or fallback to default
        const base = baseColor || 'rgba(180, 120, 100, 1)';

        // Create sophisticated radial gradient for cinematic planet surface
        const gradient = ctx.createRadialGradient(
            x - radius * 0.25, y - radius * 0.25, 0,  // Highlight position (top-left)
            x, y, radius                               // Outer circle
        );

        // Cinematic gradient using color-preserving functions
        gradient.addColorStop(0.00, colorUtils.setAlpha(colorUtils.lightenColor(base, 60), 0.95)); // Bright highlight
        gradient.addColorStop(0.35, colorUtils.setAlpha(colorUtils.lightenColor(base, 20), 0.60)); // Mid-tone
        gradient.addColorStop(0.70, colorUtils.setAlpha(colorUtils.darkenColor(base, 30), 0.40));   // Shadow areas
        gradient.addColorStop(1.00, colorUtils.setAlpha(colorUtils.darkenColor(base, 60), 0.25));   // Deep terminator

        // Draw main planet sphere
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add soft atmospheric glow extending beyond planet
        const glowGradient = ctx.createRadialGradient(
            x, y, radius * 0.95,   // Inner glow starts near surface
            x, y, radius * 1.3     // Extended atmospheric glow
        );
        glowGradient.addColorStop(0.0, colorUtils.setAlpha(base, 0.05));  // Subtle inner glow
        glowGradient.addColorStop(0.6, colorUtils.setAlpha(base, 0.02));  // Fade to space
        glowGradient.addColorStop(1.0, 'rgba(0,0,0,0)');           // Transparent edge

        // Draw atmospheric glow
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.3, 0, 2 * Math.PI);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Draw Saturn-like planetary rings with proper 3D rotation
        this.drawPlanetaryRings(ctx, x, y, radius, base, rotationY);

        // Subtle rim lighting with moderate intensity
        // Main rim light - soft outer edge
        ctx.strokeStyle = colorUtils.setAlpha(colorUtils.lightenColor(base, 30), 0.25);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Secondary rim light - very subtle inner glow
        ctx.strokeStyle = colorUtils.setAlpha(colorUtils.lightenColor(base, 15), 0.15);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(x, y, radius - 0.5, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.restore();
    },

    // 3D projection function matching CanvasDrawer.Project
    project3D: function (position, xRotationRadians, yRotationRadians, zRotationRadians) {
        // X軸回転（pitch）
        const cosX = Math.cos(xRotationRadians);
        const sinX = Math.sin(xRotationRadians);
        const y1 = position.y * cosX - position.z * sinX;
        const z1 = position.y * sinX + position.z * cosX;

        // Y軸回転（yaw）
        const cosY = Math.cos(yRotationRadians);
        const sinY = Math.sin(yRotationRadians);
        const x2 = position.x * cosY + z1 * sinY;
        const z2 = -position.x * sinY + z1 * cosY;

        // Z軸回転（roll）
        const cosZ = Math.cos(zRotationRadians);
        const sinZ = Math.sin(zRotationRadians);
        const x3 = x2 * cosZ - y1 * sinZ;
        const y3 = x2 * sinZ + y1 * cosZ;

        // 射影結果（Zは深度として保持）
        return {x: x3, y: y3, z: z2};
    },

    // Draw Saturn-like planetary rings with proper 3D rotation using CanvasDrawer logic
    drawPlanetaryRings: function (ctx, cx, cy, planetRadius, baseColor, rotationY) {
        ctx.save();

        // Ring system parameters - Saturn-like proportions  
        const innerRadius = planetRadius * 1.15;  // Start closer to planet
        const outerRadius = planetRadius * 3.0;   // Extend slightly further
        const ringCount = 6;                     // Fewer, thicker bands
        const ringWidth = (outerRadius - innerRadius) / ringCount;
        
        // Use themed ring color from colorUtils
        const ringColor = 'rgba(255, 255, 255, 1)';  // Default white rings

        // Match BattlePage.razor rotation constants
        const xRotationRadians = 2 * Math.PI / 24.0; // 1/12回転
        const yRotationRadians = rotationY || 0;
        const zRotationRadians = 0;

        // Create ring points in XZ plane (Y=0, since Y is rotation axis)
        const ringPoints = [];
        const numPoints = 64; // Points per ring

        for (let ring = 0; ring < ringCount; ring++) {
            const ringRadius = innerRadius + (ring * ringWidth) + (ringWidth * 0.5);
            const ringOpacity = 0.15 * (1 - ring / ringCount); // Increased opacity for visibility

            const points = [];
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2;
                const x = Math.cos(angle) * ringRadius;
                const z = Math.sin(angle) * ringRadius;
                const y = 0; // XZ plane

                // Apply 3D projection
                const projected = this.project3D({x, y, z}, xRotationRadians, yRotationRadians, zRotationRadians);

                // Calculate depth-based alpha like CanvasDrawer
                const alpha = 0.2 + 0.8 * ((projected.z + planetRadius) / (2 * planetRadius));
                const clampedAlpha = Math.max(0, Math.min(1, alpha));

                points.push({
                    x: cx + projected.x,
                    y: cy + projected.y,
                    z: projected.z,
                    alpha: clampedAlpha,
                    opacity: ringOpacity * clampedAlpha
                });
            }
            ringPoints.push(points);
        }

        // Draw rings from back to front for proper depth sorting
        const sortedRings = ringPoints.map((points, ringIndex) => ({points, ringIndex}))
            .sort((a, b) => {
                const avgZA = a.points.reduce((sum, p) => sum + p.z, 0) / a.points.length;
                const avgZB = b.points.reduce((sum, p) => sum + p.z, 0) / b.points.length;
                return avgZA - avgZB; // Back to front
            });

        // Draw each ring
        sortedRings.forEach(({points, ringIndex}) => {
            if (points.length < 2) return;

            // Calculate average opacity for this ring
            const avgOpacity = points.reduce((sum, p) => sum + p.opacity, 0) / points.length;
            if (avgOpacity < 0.01) return; // Skip nearly invisible rings

            // Draw ring as connected path
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();

            // Set ring appearance - much thicker Saturn-like bands with light white color
            ctx.strokeStyle = colorUtils.setAlpha(ringColor, avgOpacity);
            ctx.lineWidth = Math.max(2.0, ringWidth * 0.8 * Math.sqrt(avgOpacity)); // Much thicker
            ctx.globalAlpha = 0.4 + (Math.sin(ringIndex * 0.7) * 0.15); // More visible
            ctx.stroke();
        });

        // Add Cassini Division (gap effect)
        const cassiniRadius = innerRadius + (outerRadius - innerRadius) * 0.65;
        const cassiniPoints = [];
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const x = Math.cos(angle) * cassiniRadius;
            const z = Math.sin(angle) * cassiniRadius;
            const y = 0;

            const projected = this.project3D({x, y, z}, xRotationRadians, yRotationRadians, zRotationRadians);
            const alpha = 0.2 + 0.8 * ((projected.z + planetRadius) / (2 * planetRadius));
            const clampedAlpha = Math.max(0, Math.min(1, alpha));

            cassiniPoints.push({
                x: cx + projected.x,
                y: cy + projected.y,
                alpha: clampedAlpha
            });
        }

        // Draw Cassini Division as dark gap
        if (cassiniPoints.length > 2) {
            const avgAlpha = cassiniPoints.reduce((sum, p) => sum + p.alpha, 0) / cassiniPoints.length;

            ctx.beginPath();
            ctx.moveTo(cassiniPoints[0].x, cassiniPoints[0].y);
            for (let i = 1; i < cassiniPoints.length; i++) {
                ctx.lineTo(cassiniPoints[i].x, cassiniPoints[i].y);
            }
            ctx.closePath();
            ctx.strokeStyle = `rgba(2, 4, 8, ${0.4 * avgAlpha})`; // Darker gap with near-black
            ctx.lineWidth = Math.max(1.5, ringWidth * 0.9 * avgAlpha); // Thicker gap
            ctx.globalAlpha = 1;
            ctx.stroke();
        }

        ctx.restore();
    },

    // Draw orbital rings around planet for cinematic depth (kept for compatibility)
    drawOrbits: function (ctx, cx, cy, baseRadius, radii, color) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 6]); // Subtle dashed effect

        radii.forEach(r => {
            // Only draw partial orbits to avoid cluttering the view
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 1.5); // 3/4 circle
            ctx.stroke();
        });

        ctx.setLineDash([]); // Reset line dash
        ctx.restore();
    }
};