/**
 * AYME INDUSTRIAS PET - Scroll-Driven Experience & Telemetry Engine
 * Optimizado para alto rendimiento: control de telemetría y fases de soplado sobre video continuo.
 * Elimina la precarga ociosa de 32MB de imágenes JPEG y el bucle continuo innecesario de 60fps.
 */

class ScrollSequenceManager {
    constructor() {
        this.track = document.getElementById('scroll-sequence-track');
        this.stepIntro = document.getElementById('sequence-step-intro');
        this.step1 = document.getElementById('sequence-step-1');
        this.step2 = document.getElementById('sequence-step-2');
        this.progressFill = document.getElementById('sequence-progress-bar');
        this.telemetryProgress = document.getElementById('telemetry-progress-val');
        this.telemetryFrame = document.getElementById('telemetry-frame-val');
        
        this.totalFrames = 144;
        this.targetProgress = 0;
        this.currentProgress = 0;
        this.currentFrameIndex = 1;
        this.ticking = false;

        this.init();
    }

    init() {
        if (!this.track) return;

        this.setupScrollListener();
        this.calculateProgress();
        this.updateUI(0, 1);
    }

    setupScrollListener() {
        const onScroll = () => {
            this.calculateProgress();
            if (!this.ticking) {
                this.ticking = true;
                requestAnimationFrame(() => {
                    this.tick();
                    this.ticking = false;
                });
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        onScroll();
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

    tick() {
        // Suavizado dinámico (lerp)
        const diff = this.targetProgress - this.currentProgress;
        if (Math.abs(diff) < 0.001) {
            this.currentProgress = this.targetProgress;
        } else {
            this.currentProgress += diff * 0.35;
            // Si aún no converge, continuar animando
            requestAnimationFrame(() => this.tick());
        }

        const frameIndex = Math.min(
            this.totalFrames,
            Math.max(1, Math.floor(this.currentProgress * (this.totalFrames - 1)) + 1)
        );

        this.currentFrameIndex = frameIndex;
        this.updateUI(this.currentProgress, frameIndex);
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