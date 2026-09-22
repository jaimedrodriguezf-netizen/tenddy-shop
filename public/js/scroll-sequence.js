/**
 * AYME INDUSTRIAS PET - Scroll-Driven Image Sequence Engine
 * Renderizado de 144 fotogramas en Canvas 60fps con precarga ultrarrápida
 */

class ScrollSequenceManager {
    constructor() {
        this.track = document.getElementById('scroll-sequence-track');
        this.canvas = document.getElementById('sequence-canvas');
        this.stepIntro = document.getElementById('sequence-step-intro');
        this.step1 = document.getElementById('sequence-step-1');
        this.step2 = document.getElementById('sequence-step-2');
        this.progressFill = document.getElementById('sequence-progress-bar');
        this.telemetryProgress = document.getElementById('telemetry-progress-val');
        this.telemetryFrame = document.getElementById('telemetry-frame-val');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        this.totalFrames = 144;
        this.images = [];
        this.loadedCount = 0;
        this.targetProgress = 0;
        this.currentProgress = 0;
        this.currentFrameIndex = 1;
        this.isReady = false;

        this.init();
    }

    init() {
        if (!this.track || !this.canvas) return;

        this.preloadFrames();
        this.setupResize();
        this.setupScrollListener();
        this.startRenderLoop();
    }

    preloadFrames() {
        for (let i = 1; i <= this.totalFrames; i++) {
            const img = new Image();
            const frameNumber = String(i).padStart(4, '0');
            img.src = `/assets/sequence/frame_${frameNumber}.jpg`;
            
            img.onload = () => {
                this.loadedCount++;
                if (i === 1) {
                    this.isReady = true;
                    this.drawFrame(1);
                }
            };
            this.images[i] = img;
        }
    }

    setupResize() {
        const resize = () => {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            this.canvas.width = (rect.width || window.innerWidth) * dpr;
            this.canvas.height = (rect.height || window.innerHeight) * dpr;

            if (this.ctx) {
                this.ctx.imageSmoothingEnabled = true;
                this.ctx.imageSmoothingQuality = 'high';
            }
            this.drawFrame(this.currentFrameIndex);
        };

        resize();
        window.addEventListener('resize', resize);
    }

    setupScrollListener() {
        const update = () => this.calculateProgress();
        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    calculateProgress() {
        if (!this.track) return;

        const rect = this.track.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const totalScrollable = rect.height - windowHeight;

        if (totalScrollable <= 0) return;

        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));

        this.targetProgress = progress;
    }

    startRenderLoop() {
        const render = () => {
            // Suavizado dinámico (lerp) para responder al scroll hacia arriba y abajo
            this.currentProgress += (this.targetProgress - this.currentProgress) * 0.32;

            // Calcular índice exacto de fotograma (1 a 144)
            const frameIndex = Math.min(
                this.totalFrames,
                Math.max(1, Math.floor(this.currentProgress * (this.totalFrames - 1)) + 1)
            );

            if (frameIndex !== this.currentFrameIndex) {
                this.currentFrameIndex = frameIndex;
                this.drawFrame(frameIndex);
            }

            this.updateUI(this.currentProgress, frameIndex);

            requestAnimationFrame(render);
        };

        requestAnimationFrame(render);
    }

    drawFrame(index) {
        if (!this.ctx || !this.images[index]) return;

        const img = this.images[index];
        if (!img.complete || img.naturalWidth === 0) return;

        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;

        // Cover fit para llenar la pantalla manteniendo proporción
        const scale = Math.max(cw / iw, ch / ih);
        const nw = iw * scale;
        const nh = ih * scale;
        const ox = (cw - nw) / 2;
        const oy = (ch - nh) / 2;

        this.ctx.clearRect(0, 0, cw, ch);
        this.ctx.drawImage(img, ox, oy, nw, nh);
    }

    updateUI(progress, frameIndex) {
        // Barra lateral
        if (this.progressFill) {
            this.progressFill.style.height = `${progress * 100}%`;
        }

        // Telemetría en HUD
        if (this.telemetryProgress) {
            this.telemetryProgress.textContent = `${Math.round(progress * 100)}%`;
        }

        if (this.telemetryFrame) {
            this.telemetryFrame.textContent = `FR-${String(frameIndex).padStart(4, '0')} / 0144`;
        }

        // Fase 0: Intro (0.0 a 0.20)
        if (this.stepIntro) {
            if (progress <= 0.22) {
                const opacity = progress > 0.12 ? (0.22 - progress) / 0.10 : 1;
                this.stepIntro.style.opacity = Math.max(0, Math.min(1, opacity));
                this.stepIntro.style.transform = `translateY(${((1 - opacity) * -20)}px)`;
                this.stepIntro.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
            } else {
                this.stepIntro.style.opacity = '0';
                this.stepIntro.style.transform = 'translateY(-25px)';
                this.stepIntro.style.pointerEvents = 'none';
            }
        }

        // Fase 1: Control Térmico (0.24 a 0.58)
        if (this.step1) {
            if (progress >= 0.22 && progress <= 0.58) {
                const opacity = progress < 0.32 ? (progress - 0.22) / 0.10 : (progress > 0.48 ? (0.58 - progress) / 0.10 : 1);
                this.step1.style.opacity = Math.max(0, Math.min(1, opacity));
                this.step1.style.transform = `translateY(${((1 - opacity) * 20)}px)`;
                this.step1.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
            } else {
                this.step1.style.opacity = '0';
                this.step1.style.transform = 'translateY(25px)';
                this.step1.style.pointerEvents = 'none';
            }
        }

        // Fase 2: Soplado & Bi-orientación (0.60 a 0.98)
        if (this.step2) {
            if (progress >= 0.58 && progress <= 0.98) {
                const opacity = progress < 0.68 ? (progress - 0.58) / 0.10 : (progress > 0.88 ? (0.98 - progress) / 0.10 : 1);
                this.step2.style.opacity = Math.max(0, Math.min(1, opacity));
                this.step2.style.transform = `translateY(${((1 - opacity) * 20)}px)`;
                this.step2.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
            } else {
                this.step2.style.opacity = '0';
                this.step2.style.transform = 'translateY(25px)';
                this.step2.style.pointerEvents = 'none';
            }
        }
    }
}

window.ScrollSequenceManager = ScrollSequenceManager;
if (document.readyState === "complete" || document.readyState === "interactive") {
    window.scrollSequenceManager = new ScrollSequenceManager();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        window.scrollSequenceManager = new ScrollSequenceManager();
    });
}