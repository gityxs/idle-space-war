// Particle system for explosions and effects
window.particleRenderer = {
    particles: [],
    previousEnemies: new Map(),
    explodedEnemyIds: new Set(),

    // Check for enemy deaths and trigger particle effects
    checkEnemyDeaths: function (enemies) {
        const current = new Map();

        // === 1) 今フレームの敵リストを収集 =========================
        enemies.forEach((e, idx) => {
            // Use simpler but consistent ID generation
            const id = e.id ?? `enemy_${idx}`;
            current.set(id, {
                x: e.x,
                y: e.y,
                color: e.color,
                hpRatio: e.hpRatio
            });
        });

        // === 2) 「生→死」を検出して爆発エフェクトを1回だけ再生 ======================
        this.previousEnemies.forEach((prev, id) => {
            if (this.explodedEnemyIds.has(id)) return;      // 既に爆発済み

            const cur = current.get(id);
            
            // HPが0以下になった場合のみ爆発エフェクトを再生
            if (prev.hpRatio > 0 && cur && cur.hpRatio <= 0) {
                // console.log(`Enemy ${id} defeated: HP ${prev.hpRatio} -> ${cur.hpRatio}, creating explosion at (${cur.x}, ${cur.y})`);
                this.addSimpleParticleExplosion(cur.x, cur.y, cur.color);
                this.explodedEnemyIds.add(id);
            }
            // 敵が完全に消失した場合（前フレームで生きていたが現フレームに存在しない）
            else if (prev.hpRatio > 0 && !cur) {
                // console.log(`Enemy ${id} disappeared: was alive with HP ${prev.hpRatio}, creating explosion at (${prev.x}, ${prev.y})`);
                this.addSimpleParticleExplosion(prev.x, prev.y, prev.color);
                this.explodedEnemyIds.add(id);
            }
        });

        // === 3) 次フレーム用に保存 ===============================
        this.previousEnemies = current;

        // === 4) 自動クリーンアップ：敵が長時間いない場合のみ ===
        if (current.size === 0) {
            this._emptyFrames = (this._emptyFrames || 0) + 1;
            if (this._emptyFrames > 60) {                // 60フレーム（約1秒）無敵ならリセット
                // console.log(`Clearing explodedEnemyIds after ${this._emptyFrames} empty frames`);
                this.explodedEnemyIds.clear();
                this._emptyFrames = 0;
            }
        } else {
            this._emptyFrames = 0;
        }
    },

    // Reset explosion tracking for tier/planet changes
    resetExplosionTracking: function() {
        // console.log(`Resetting explosion tracking. Previous exploded count: ${this.explodedEnemyIds.size}`);
        this.explodedEnemyIds.clear();
        this.previousEnemies.clear();
        this._emptyFrames = 0;
        // console.log('Explosion tracking reset complete');
    },

    // Simple 2D particle explosion - reliable and straightforward
    addSimpleParticleExplosion: function (centerX, centerY, color) {
        const particleCount = 8;
        const baseSpeed = 100;
        const baseLifetime = 1.0;

        // console.log(`Creating ${particleCount} particles at ${centerX}, ${centerY}`);

        for (let i = 0; i < particleCount; i++) {
            // Simple 2D radial spread
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = baseSpeed + (Math.random() - 0.5) * 40;
            const size = 2 + Math.random() * 2;

            const particle = {
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                maxSize: size,
                color: color,
                lifetime: baseLifetime,
                age: 0,
                active: true
            };

            this.particles.push(particle);
            // console.log(`Created particle ${i}: position(${particle.x}, ${particle.y}), velocity(${particle.vx}, ${particle.vy}), color: ${particle.color}`);
        }

        // console.log(`Total particles after creation: ${this.particles.length}`);
    },

    // Update particle positions and remove expired ones
    updateParticles: function (deltaTime) {
        // console.log(`Updating ${this.particles.length} particles, deltaTime: ${deltaTime}`);

        // Enhanced cleanup: limit total particles to prevent performance issues
        if (this.particles.length > 100) {
            // Remove oldest particles first
            this.particles.sort((a, b) => b.age - a.age);
            this.particles = this.particles.slice(0, 50);
        }

        this.particles = this.particles.filter(particle => {
            if (!particle.active) return false;

            particle.age += deltaTime;

            // Calculate life ratio for fading effects
            const lifeRatio = particle.age / particle.lifetime;

            // Early removal if too old
            if (lifeRatio >= 1.0) {
                // console.log(`Removing particle due to age: ${particle.age}/${particle.lifetime}`);
                particle.active = false;
                return false;
            }

            // Update 2D position with velocity
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;

            // Apply deceleration (frame-rate independent)
            const decelerationFactor = Math.pow(0.95, deltaTime * 60); // Normalize for 60 FPS
            particle.vx *= decelerationFactor;
            particle.vy *= decelerationFactor;

            // Apply fade out effect based on lifetime
            particle.size = particle.maxSize * (1 - lifeRatio * 0.7); // Gradual size reduction

            // Remove particles that are too small
            if (particle.size < 0.3) {
                // console.log(`Removing particle due to small size: ${particle.size}`);
                particle.active = false;
                return false;
            }

            return true;
        });

        // console.log(`After update: ${this.particles.length} particles remaining`);
    },

    // Draw all active particles - simple and reliable 2D rendering
    drawParticles: function (ctx) {
        const activeParticles = this.particles.filter(p => p.active && p.size > 0);

        // console.log(`Drawing ${activeParticles.length} active particles`);

        activeParticles.forEach((particle, index) => {
            // Calculate fade alpha based on lifetime
            const lifeRatio = particle.age / particle.lifetime;
            const fadeAlpha = Math.max(0, 1 - lifeRatio);

            // Parse base color and apply fade alpha
            let particleColor = particle.color;
            if (particleColor.includes('rgba')) {
                // Extract RGB values and apply fade alpha
                const rgbaMatch = particleColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
                if (rgbaMatch) {
                    particleColor = `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${fadeAlpha})`;
                }
            } else if (particleColor.includes('rgb')) {
                const rgbMatch = particleColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (rgbMatch) {
                    particleColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${fadeAlpha})`;
                }
            }

            if (fadeAlpha < 0.01) return; // Skip nearly invisible particles

            // Simple glow effect
            const glowIntensity = Math.min(4, particle.size);

            // Draw particle as a circle with glow
            ctx.shadowBlur = glowIntensity;
            ctx.shadowColor = particleColor;
            ctx.fillStyle = particleColor;

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            ctx.fill();

            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';

            // console.log(`Drew particle ${index}: pos(${particle.x.toFixed(1)}, ${particle.y.toFixed(1)}), size: ${particle.size.toFixed(1)}, alpha: ${fadeAlpha.toFixed(2)}`);
        });
    }
};