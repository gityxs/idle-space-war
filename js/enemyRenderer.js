// Enemy rendering system
window.enemyRenderer = {
    // Draw enemy with clear colors and visible HP indicator
    drawEnemy: function (ctx, x, y, radius, baseColor, hpRatio) {
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

        // Draw enemy base using shadow-adjusted color
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        const baseDarkR = Math.max(120, rFinal - 20);
        const baseDarkG = Math.max(20, gFinal - 30);
        const baseDarkB = Math.max(20, bFinal - 30);
        ctx.fillStyle = `rgba(${baseDarkR}, ${baseDarkG}, ${baseDarkB}, ${Math.max(0.3, baseAlpha)})`; // Shadow-affected base
        ctx.fill();

        // Draw HP indicator (pie chart style) - only remaining HP portion
        if (hpRatio > 0) {
            const endAngle = -Math.PI / 2; // Start from top
            const startAngle = endAngle - (2 * Math.PI * hpRatio);

            // Remaining HP with shadow-adjusted color
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

        const highlightR = Math.min(255, rFinal + 60 * shadowIntensity);
        const highlightG = Math.min(255, gFinal + 80 * shadowIntensity);
        const highlightB = Math.min(255, bFinal + 80 * shadowIntensity);
        const midR = Math.min(255, rFinal + 30 * shadowIntensity);
        const midG = Math.min(255, gFinal + 40 * shadowIntensity);
        const midB = Math.min(255, bFinal + 40 * shadowIntensity);

        gradient.addColorStop(0, `rgba(${highlightR}, ${highlightG}, ${highlightB}, ${0.8 * baseAlpha})`);  // Shadow-affected highlight
        gradient.addColorStop(0.5, `rgba(${midR}, ${midG}, ${midB}, ${0.4 * baseAlpha})`); // Shadow-affected mid tone
        gradient.addColorStop(1, `rgba(${rFinal}, ${gFinal}, ${bFinal}, 0.0)`);   // Fade to shadow-affected color

        // Apply highlight only to HP portion
        if (hpRatio > 0) {
            const endAngle = -Math.PI / 2;
            const startAngle = endAngle - (2 * Math.PI * hpRatio);

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.arc(x, y, radius, startAngle, endAngle, false);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Add subtle shadow-adjusted rim for definition
        const rimR = Math.min(255, rFinal + 25 * shadowIntensity);
        const rimG = Math.min(255, gFinal + 25 * shadowIntensity);
        const rimB = Math.min(255, bFinal + 25 * shadowIntensity);
        ctx.strokeStyle = `rgba(${rimR}, ${rimG}, ${rimB}, ${Math.min(0.3, baseAlpha * 0.5)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.restore();
    }
};