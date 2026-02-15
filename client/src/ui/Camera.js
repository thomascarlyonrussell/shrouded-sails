export class Camera {
    constructor() {
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.minZoom = 1;
        this.maxZoom = 3;
    }

    setZoom(level, centerX = 0, centerY = 0) {
        const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        const zoomFactor = clampedZoom / this.zoom;

        this.offsetX = centerX - (centerX - this.offsetX) * zoomFactor;
        this.offsetY = centerY - (centerY - this.offsetY) * zoomFactor;
        this.zoom = clampedZoom;
    }

    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
    }

    reset() {
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    clampToBounds(canvasWidth, canvasHeight, boardWidth, boardHeight) {
        const minOffsetX = Math.min(0, canvasWidth - boardWidth * this.zoom);
        const minOffsetY = Math.min(0, canvasHeight - boardHeight * this.zoom);

        this.offsetX = Math.max(minOffsetX, Math.min(0, this.offsetX));
        this.offsetY = Math.max(minOffsetY, Math.min(0, this.offsetY));
    }

    screenToCanvas(screenX, screenY) {
        return {
            x: (screenX - this.offsetX) / this.zoom,
            y: (screenY - this.offsetY) / this.zoom
        };
    }

    canvasToScreen(canvasX, canvasY) {
        return {
            x: canvasX * this.zoom + this.offsetX,
            y: canvasY * this.zoom + this.offsetY
        };
    }
}
