// Space background and star field rendering
window.spaceRenderer = {
    stars: [],
    starsInitialized: false,
    noiseCanvas: null,

    // Initialize starfield background - enhanced for space immersion
    initializeStars: function (canvasWidth, canvasHeight) {
        if (this.starsInitialized) return;

        const starCount = 400; // More stars for better space feel
        this.stars = [];

        for (let i = 0; i < starCount; i++) {
            // Create different star types
            const starType = Math.random();
            let star;

            if (starType < 0.05) {
                // 5% bright main sequence stars (larger, brighter)
                star = {
                    x: (Math.random() - 0.5) * canvasWidth * 1.8,
                    y: (Math.random() - 0.5) * canvasHeight * 1.8,
                    size: Math.random() * 1.5 + 1.0,              // 1.0-2.5px
                    opacity: Math.random() * 0.4 + 0.6,           // 0.6-1.0
                    twinkleSpeed: Math.random() * 0.02 + 0.01,    // More noticeable twinkling
                    phase: Math.random() * Math.PI * 2,
                    color: this.getStarColor('bright'),
                    type: 'bright'
                };
            } else if (starType < 0.15) {
                // 10% colored stars (red giants, blue giants)
                star = {
                    x: (Math.random() - 0.5) * canvasWidth * 1.6,
                    y: (Math.random() - 0.5) * canvasHeight * 1.6,
                    size: Math.random() * 1.2 + 0.8,              // 0.8-2.0px
                    opacity: Math.random() * 0.3 + 0.4,           // 0.4-0.7
                    twinkleSpeed: Math.random() * 0.015 + 0.005,
                    phase: Math.random() * Math.PI * 2,
                    color: this.getStarColor('colored'),
                    type: 'colored'
                };
            } else {
                // 85% normal distant stars
                star = {
                    x: (Math.random() - 0.5) * canvasWidth * 1.5,
                    y: (Math.random() - 0.5) * canvasHeight * 1.5,
                    size: Math.random() * 0.8 + 0.3,              // 0.3-1.1px
                    opacity: Math.random() * 0.4 + 0.1,           // 0.1-0.5
                    twinkleSpeed: Math.random() * 0.008,          // Very subtle twinkling
                    phase: Math.random() * Math.PI * 2,
                    color: this.getStarColor('normal'),
                    type: 'normal'
                };
            }

            this.stars.push(star);
        }

        this.starsInitialized = true;
    },

    // Get star color based on type
    getStarColor: function (type) {
        switch (type) {
            case 'bright':
                // White/blue-white main sequence stars
                const brightColors = [
                    'rgba(255, 255, 255, 1)',      // White
                    'rgba(240, 248, 255, 1)',      // Alice blue
                    'rgba(248, 248, 255, 1)'       // Ghost white
                ];
                return brightColors[Math.floor(Math.random() * brightColors.length)];

            case 'colored':
                // Red giants, blue supergiants, etc.
                const coloredStars = [
                    'rgba(255, 180, 120, 1)',      // Orange (K-type)
                    'rgba(255, 200, 140, 1)',      // Yellow-orange
                    'rgba(255, 220, 180, 1)',      // Yellow (G-type)
                    'rgba(180, 200, 255, 1)',      // Blue-white (B-type)
                    'rgba(255, 160, 100, 1)'       // Red (M-type)
                ];
                return coloredStars[Math.floor(Math.random() * coloredStars.length)];

            default:
                // Normal white/slightly warm stars
                return 'rgba(255, 255, 255, 1)';
        }
    },

    // Draw enhanced starfield background for space immersion
    drawStars: function (ctx, canvasWidth, canvasHeight) {
        const currentTime = performance.now() / 1000;

        ctx.save();

        this.stars.forEach(star => {
            // Calculate twinkling effect based on star type
            const twinkleIntensity = star.type === 'bright' ? 0.3 : (star.type === 'colored' ? 0.25 : 0.15);
            const twinkle = Math.sin(currentTime * star.twinkleSpeed * Math.PI * 2 + star.phase) * twinkleIntensity + (1 - twinkleIntensity);
            const finalOpacity = star.opacity * twinkle;

            // Parse star color and apply opacity
            const colorMatch = star.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
            if (!colorMatch) return;

            const [, r, g, b] = colorMatch;

            // Draw star with glow effect for brighter stars
            if (star.type === 'bright' || star.type === 'colored') {
                // Add subtle glow for prominent stars
                ctx.shadowBlur = star.size * 1.5;
                ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${finalOpacity * 0.3})`;
            } else {
                ctx.shadowBlur = 0;
            }

            // Draw the star
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalOpacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, 2 * Math.PI);
            ctx.fill();

            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        });

        // Add distant nebula effect (very subtle)
        this.drawDistantNebula(ctx, canvasWidth, canvasHeight);

        ctx.restore();
    },

    // Draw subtle distant nebula clouds for space depth
    drawDistantNebula: function (ctx, canvasWidth, canvasHeight) {
        const time = performance.now() / 10000; // Very slow movement

        ctx.save();
        ctx.globalAlpha = 0.02; // Very subtle
        ctx.globalCompositeOperation = 'screen';

        // Create 2-3 very faint nebula patches
        for (let i = 0; i < 3; i++) {
            const nebulaX = (Math.sin(time + i * 2) * 0.3 + 0.5) * canvasWidth - canvasWidth / 2;
            const nebulaY = (Math.cos(time * 0.7 + i * 1.5) * 0.3 + 0.5) * canvasHeight - canvasHeight / 2;
            const nebulaSize = Math.min(canvasWidth, canvasHeight) * 0.4;

            // Create nebula gradient
            const gradient = ctx.createRadialGradient(
                nebulaX, nebulaY, 0,
                nebulaX, nebulaY, nebulaSize
            );

            // Different nebula colors
            const nebulaColors = [
                'rgba(100, 50, 150, 1)',    // Purple
                'rgba(50, 100, 150, 1)',    // Blue
                'rgba(150, 80, 50, 1)'      // Orange
            ];

            const color = nebulaColors[i];
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.3, color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(nebulaX, nebulaY, nebulaSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    // Generate noise texture for grain effect
    generateNoiseTexture: function (width, height) {
        if (this.noiseCanvas && this.noiseCanvas.width === width && this.noiseCanvas.height === height) {
            return; // Already generated for this size
        }

        this.noiseCanvas = document.createElement('canvas');
        this.noiseCanvas.width = width;
        this.noiseCanvas.height = height;
        const noiseCtx = this.noiseCanvas.getContext('2d');

        const imageData = noiseCtx.createImageData(width, height);
        const data = imageData.data;

        // Generate random noise
        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * 255;
            data[i] = noise;     // R
            data[i + 1] = noise; // G
            data[i + 2] = noise; // B
            data[i + 3] = 25;    // A (low alpha for subtle effect)
        }

        noiseCtx.putImageData(imageData, 0, 0);
    },

    // Draw grain and vignette effects
    drawGrainAndVignette: function (ctx, canvasWidth, canvasHeight) {
        ctx.save();

        // Generate noise texture if needed
        this.generateNoiseTexture(canvasWidth, canvasHeight);

        // Apply grain effect
        if (this.noiseCanvas) {
            ctx.globalAlpha = 0.04; // Very subtle grain
            ctx.globalCompositeOperation = 'overlay';
            ctx.drawImage(this.noiseCanvas, -canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
        }

        // Reset composite operation for vignette
        ctx.globalCompositeOperation = 'multiply';

        // Create vignette gradient
        const vignetteGradient = ctx.createRadialGradient(
            0, 0, 0,  // Center (canvas is translated to center)
            0, 0, Math.max(canvasWidth, canvasHeight) * 0.8
        );
        vignetteGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');    // Center - no darkening
        vignetteGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.9)'); // Slight darkening
        vignetteGradient.addColorStop(1, 'rgba(128, 128, 128, 0.5)');   // Edge darkening

        // Apply vignette
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(-canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);

        ctx.restore();
    },

    // Draw themed background based on planet
    drawThemedBackground: function(ctx, canvasWidth, canvasHeight, planetTheme) {
        ctx.save();
        
        // Apply themed background color
        ctx.fillStyle = planetTheme.background;
        ctx.fillRect(-canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
        
        ctx.restore();
    },

    // Reset stars for new planet theme
    resetStars: function() {
        this.starsInitialized = false;
        this.stars = [];
    }
};