// Color utility functions for cinematic rendering
window.colorUtils = {
    rgbToHsl: function (r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return [h, s, l];
    },

    hslToRgb: function (h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },

    lightenColor: function (color, percent) {
        const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (!rgbaMatch) return color;

        let [, r, g, b] = rgbaMatch.map(Number);
        const [h, s, l] = this.rgbToHsl(r, g, b);
        const newL = Math.min(1, l + percent / 100);
        [r, g, b] = this.hslToRgb(h, s, newL);

        return `rgb(${r}, ${g}, ${b})`;
    },

    darkenColor: function (color, percent) {
        const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (!rgbaMatch) return color;

        let [, r, g, b] = rgbaMatch.map(Number);
        const [h, s, l] = this.rgbToHsl(r, g, b);
        const newL = Math.max(0, l - percent / 100);
        [r, g, b] = this.hslToRgb(h, s, newL);

        return `rgb(${r}, ${g}, ${b})`;
    },

    setAlpha: function (color, alpha) {
        const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (!rgbaMatch) return color;

        const [, r, g, b] = rgbaMatch;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    // Planet color themes for different planets
    getPlanetTheme: function(planetIndex) {
        const themes = [
            {
                name: "Ganymede",
                planet: "rgba(120, 140, 160, 1)",
                background: "rgb(8, 10, 12)",
                rings: "rgba(140, 160, 180, 1)"
            },
            {
                name: "Europa", 
                planet: "rgba(150, 180, 220, 1)",
                background: "rgb(5, 8, 15)",
                rings: "rgba(180, 200, 255, 1)"
            },
            {
                name: "Venus",
                planet: "rgba(255, 200, 100, 1)", 
                background: "rgb(20, 15, 5)",
                rings: "rgba(255, 220, 120, 1)"
            },
            {
                name: "Titan",
                planet: "rgba(180, 140, 100, 1)",
                background: "rgb(12, 10, 8)",
                rings: "rgba(200, 160, 120, 1)"
            },
            {
                name: "Laboratory",
                planet: "rgba(200, 200, 210, 1)",       // 白すぎず少しグレーブルーな惑星
                background: "rgb(210, 210, 220)",       // 明るすぎない灰色系白背景
                rings: "rgba(170, 170, 190, 0.3)"       // 薄い灰紫色リング（透明度で柔らかく）
            }
        ];
        
        return themes[planetIndex % themes.length];
    }
};

// Legacy compatibility functions
function getAlphaFromRgba(rgbaString) {
    const match = rgbaString.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,?\s*([\d\.]+)?\s*\)/);
    if (!match) {
        throw new Error('Invalid RGBA color string');
    }
    return match[1] !== undefined ? parseFloat(match[1]) : 1;
}

function changeAlpha(rgbaStr, newAlpha) {
    const regex = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/;
    const matches = rgbaStr.match(regex);

    if (!matches) {
        throw new Error('無効なRGBA色文字列です');
    }

    const r = matches[1];
    const g = matches[2];
    const b = matches[3];

    return `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
}