export function getWindAtmosphereTarget(wind, mistConfig) {
    const direction = wind?.getDirectionVector?.() || { dx: 0, dy: -1 };
    const strength = Number.isFinite(wind?.strength) ? Math.max(0, wind.strength) : 0;
    const speed = mistConfig.CALM_DRIFT_SPEED + strength * mistConfig.STRENGTH_DRIFT_SCALE;
    const alpha = mistConfig.BASE_ALPHA + strength * mistConfig.STRENGTH_ALPHA_SCALE;

    return {
        velocityX: direction.dx * speed,
        velocityY: direction.dy * speed,
        alpha
    };
}

export function parseTileKey(tileKey) {
    const [xRaw, yRaw] = tileKey.split(',');
    return {
        x: Number.parseInt(xRaw, 10),
        y: Number.parseInt(yRaw, 10)
    };
}

export function buildVisibilityDistanceMap(width, height, visibleTiles) {
    const distances = new Int16Array(width * height);
    distances.fill(-1);

    if (!visibleTiles || visibleTiles.size === 0) {
        return distances;
    }

    const queueX = [];
    const queueY = [];
    let head = 0;

    for (const tileKey of visibleTiles) {
        const { x, y } = parseTileKey(tileKey);
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const index = y * width + x;
        if (distances[index] !== -1) continue;
        distances[index] = 0;
        queueX.push(x);
        queueY.push(y);
    }

    const directions = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
    ];

    while (head < queueX.length) {
        const x = queueX[head];
        const y = queueY[head];
        head++;

        const currentDistance = distances[y * width + x];
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

            const neighborIndex = ny * width + nx;
            if (distances[neighborIndex] !== -1) continue;

            distances[neighborIndex] = currentDistance + 1;
            queueX.push(nx);
            queueY.push(ny);
        }
    }

    return distances;
}

export function getFogOpacityForDistance(distance, fogVisuals) {
    if (!Number.isFinite(distance) || distance <= 0) return 0;
    if (distance <= fogVisuals.FRONTIER_DISTANCE) {
        return fogVisuals.FRONTIER_ALPHA;
    }
    if (distance <= fogVisuals.MID_DISTANCE) {
        return fogVisuals.MID_ALPHA;
    }
    return fogVisuals.DEEP_ALPHA;
}

export function hasUnseenNeighbor(x, y, visibleTiles, width, height) {
    const directions = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
    ];

    for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (!visibleTiles.has(`${nx},${ny}`)) {
            return true;
        }
    }

    return false;
}
