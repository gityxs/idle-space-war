// Ship rendering and trail system
window.shipRenderer = {
    shipTrails: new Map(),

    // Update ship trail history for thruster effects with spherical interpolation
    updateShipTrail: function (shipId, x, y, color) {
        if (!this.shipTrails.has(shipId)) {
            this.shipTrails.set(shipId, {
                positions: [],
                color: color,
                lastPosition: {x, y}
            });
        }

        const trail = this.shipTrails.get(shipId);
        const lastPos = trail.lastPosition;

        // Calculate distance moved since last frame
        const dx = x - lastPos.x;
        const dy = y - lastPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only add trail points if ship is moving significantly
        if (distance > 1.5) {
            // If we have a previous position, interpolate between last and current position
            // to create smooth spherical trail segments
            if (trail.positions.length > 0) {
                const lastTrailPos = trail.positions[trail.positions.length - 1];
                const interpolationSteps = Math.ceil(distance / 3.0); // Add intermediate points for smoothness

                for (let step = 1; step <= interpolationSteps; step++) {
                    const t = step / interpolationSteps;

                    // Use spherical interpolation for smooth curved paths
                    const interpX = lastTrailPos.x + (x - lastTrailPos.x) * t;
                    const interpY = lastTrailPos.y + (y - lastTrailPos.y) * t;

                    trail.positions.push({
                        x: interpX,
                        y: interpY,
                        timestamp: performance.now() - (interpolationSteps - step) * 16, // Stagger timestamps
                        alpha: 1.0
                    });
                }
            } else {
                // First position
                trail.positions.push({
                    x: x,
                    y: y,
                    timestamp: performance.now(),
                    alpha: 1.0
                });
            }

            // Update color in case it changed (for depth effects)
            trail.color = color;
            trail.lastPosition = {x, y};

            // Limit trail length
            const maxTrailLength = 20; // Increased for smoother trails
            if (trail.positions.length > maxTrailLength) {
                trail.positions.shift();
            }
        }

        // Age and fade existing trail points
        const currentTime = performance.now();
        const trailLifetime = 1000; // Increased to 1000ms for better visibility

        trail.positions = trail.positions.filter(pos => {
            const age = currentTime - pos.timestamp;
            pos.alpha = Math.max(0, 1 - (age / trailLifetime));
            return pos.alpha > 0.01;
        });
    },

    // Draw ship thruster trail with smooth curves
    drawShipTrail: function (ctx, shipId) {
        const trail = this.shipTrails.get(shipId);
        if (!trail || trail.positions.length < 3) return; // Need at least 3 points for smooth curves

        ctx.save();

        // Parse base ship color
        const rgbaMatch = trail.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!rgbaMatch) {
            ctx.restore();
            return;
        }

        const [, r, g, b, alphaStr] = rgbaMatch;
        const baseAlpha = alphaStr ? parseFloat(alphaStr) : 1.0;

        // Make trail color slightly more orange/yellow for thruster effect
        const thrusterR = Math.min(255, r + 30);
        const thrusterG = Math.min(255, g + 15);
        const thrusterB = Math.max(0, b - 20);

        // Draw trail as smooth curve using quadratic curves
        for (let i = 1; i < trail.positions.length - 1; i++) {
            const prevPos = trail.positions[i - 1];
            const currPos = trail.positions[i];
            const nextPos = trail.positions[i + 1];

            // Calculate trail segment properties
            const segmentAlpha = currPos.alpha;
            const trailAlpha = segmentAlpha * baseAlpha * 0.8; // Slightly more visible

            if (trailAlpha < 0.02) continue;

            // Create thruster-like width that tapers from new to old
            const trailWidth = Math.max(0.8, 5.0 * segmentAlpha);

            // Draw smooth curve segment using quadratic curve
            ctx.beginPath();
            ctx.moveTo(prevPos.x, prevPos.y);

            // Calculate control point for smooth curve
            const cpX = currPos.x;
            const cpY = currPos.y;
            const endX = (currPos.x + nextPos.x) / 2;
            const endY = (currPos.y + nextPos.y) / 2;

            ctx.quadraticCurveTo(cpX, cpY, endX, endY);

            ctx.strokeStyle = `rgba(${thrusterR}, ${thrusterG}, ${thrusterB}, ${trailAlpha})`;
            ctx.lineWidth = trailWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            // Add inner bright core for thruster effect
            if (segmentAlpha > 0.4) {
                ctx.beginPath();
                ctx.moveTo(prevPos.x, prevPos.y);
                ctx.quadraticCurveTo(cpX, cpY, endX, endY);

                const coreR = Math.min(255, thrusterR + 60);
                const coreG = Math.min(255, thrusterG + 60);
                const coreB = Math.min(255, thrusterB + 40);

                ctx.strokeStyle = `rgba(${coreR}, ${coreG}, ${coreB}, ${trailAlpha * 0.7})`;
                ctx.lineWidth = Math.max(0.5, trailWidth * 0.3);
                ctx.stroke();
            }
        }

        // Handle the last segment separately
        if (trail.positions.length >= 2) {
            const lastTwo = trail.positions.slice(-2);
            const prevPos = lastTwo[0];
            const currPos = lastTwo[1];

            const segmentAlpha = currPos.alpha;
            const trailAlpha = segmentAlpha * baseAlpha * 0.8;

            if (trailAlpha >= 0.02) {
                const trailWidth = Math.max(0.8, 5.0 * segmentAlpha);

                ctx.beginPath();
                ctx.moveTo(prevPos.x, prevPos.y);
                ctx.lineTo(currPos.x, currPos.y);

                ctx.strokeStyle = `rgba(${thrusterR}, ${thrusterG}, ${thrusterB}, ${trailAlpha})`;
                ctx.lineWidth = trailWidth;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Core for last segment
                if (segmentAlpha > 0.4) {
                    ctx.beginPath();
                    ctx.moveTo(prevPos.x, prevPos.y);
                    ctx.lineTo(currPos.x, currPos.y);

                    const coreR = Math.min(255, thrusterR + 60);
                    const coreG = Math.min(255, thrusterG + 60);
                    const coreB = Math.min(255, thrusterB + 40);

                    ctx.strokeStyle = `rgba(${coreR}, ${coreG}, ${coreB}, ${trailAlpha * 0.7})`;
                    ctx.lineWidth = Math.max(0.5, trailWidth * 0.3);
                    ctx.stroke();
                }
            }
        }

        ctx.restore();
    },

    // Draw ship with clear colors and visible attack progress indicator
    drawShip: function (ctx, x, y, radius, baseColor, attackRatio) {
        ctx.save();

        // Parse base color to extract RGB values and alpha (depth)
        const rgbaMatch = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!rgbaMatch) return; // Fallback if color parsing fails

        const [, r, g, b, alphaStr] = rgbaMatch;
        const baseAlpha = alphaStr ? parseFloat(alphaStr) : 1.0;

        // Calculate shadow effect based on depth (alpha from CanvasDrawer)
        // Alpha 0.2 = behind planet (dark shadow), Alpha 1.0 = in front (bright)
        const shadowIntensity = Math.max(0.2, baseAlpha); // Minimum 20% brightness
        const rFinal = Math.round(r * shadowIntensity);
        const gFinal = Math.round(g * shadowIntensity);
        const bFinal = Math.round(b * shadowIntensity);

        // Draw ship base using shadow-adjusted color
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        const baseDarkR = Math.max(30, rFinal - 30);
        const baseDarkG = Math.max(60, gFinal - 20);
        const baseDarkB = Math.max(100, bFinal);
        ctx.fillStyle = `rgba(${baseDarkR}, ${baseDarkG}, ${baseDarkB}, ${Math.max(0.3, baseAlpha)})`; // Shadow-affected base
        ctx.fill();

        // Draw attack progress indicator (pie chart style) - only charged portion
        if (attackRatio > 0) {
            const endAngle = -Math.PI / 2; // Start from top
            const startAngle = endAngle - (2 * Math.PI * attackRatio);

            // Charged portion with shadow-adjusted color
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, radius, startAngle, endAngle, false);
            ctx.closePath();
            ctx.fillStyle = `rgba(${rFinal}, ${gFinal}, ${bFinal}, ${baseAlpha})`;
            ctx.fill();
        }

        // Create shadow-adjusted gradient for 3D effect (only on filled area)
        const gradient = ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, 0,  // Highlight position
            x, y, radius * 0.8                      // Smaller radius for subtle effect
        );

        const highlightR = Math.min(255, rFinal + 80 * shadowIntensity);
        const highlightG = Math.min(255, gFinal + 80 * shadowIntensity);
        const highlightB = Math.min(255, bFinal + 60 * shadowIntensity);
        const midR = Math.min(255, rFinal + 40 * shadowIntensity);
        const midG = Math.min(255, gFinal + 40 * shadowIntensity);
        const midB = Math.min(255, bFinal + 30 * shadowIntensity);

        gradient.addColorStop(0, `rgba(${highlightR}, ${highlightG}, ${highlightB}, ${0.8 * baseAlpha})`);  // Shadow-affected highlight
        gradient.addColorStop(0.5, `rgba(${midR}, ${midG}, ${midB}, ${0.4 * baseAlpha})`); // Shadow-affected mid tone
        gradient.addColorStop(1, `rgba(${rFinal}, ${gFinal}, ${bFinal}, 0.0)`);   // Fade to shadow-adjusted color

        // Apply highlight only to charged portion
        if (attackRatio > 0) {
            const endAngle = -Math.PI / 2;
            const startAngle = endAngle - (2 * Math.PI * attackRatio);

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, radius, startAngle, endAngle, false);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Add subtle shadow-adjusted rim for definition
        const rimR = Math.min(255, rFinal + 30 * shadowIntensity);
        const rimG = Math.min(255, gFinal + 30 * shadowIntensity);
        const rimB = Math.min(255, bFinal + 30 * shadowIntensity);
        ctx.strokeStyle = `rgba(${rimR}, ${rimG}, ${rimB}, ${Math.min(0.4, baseAlpha * 0.6)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.restore();
    }
};