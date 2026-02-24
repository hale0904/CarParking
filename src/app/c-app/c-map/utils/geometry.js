export const pointInPolygon = (point, vs) => {
    // ray-casting algorithm based on
    // https://github.com/substack/point-in-polygon
    // vs is array of [x, y, x, y] or [{x, y}] or [[x,y]]
    // Our points array is usually [x1, y1, x2, y2, ...]

    let x = point.x, y = point.y;

    let inside = false;
    for (let i = 0, j = vs.length - 2; i < vs.length; j = i, i += 2) {
        let xi = vs[i], yi = vs[i + 1];
        let xj = vs[j], yj = vs[j + 1];

        let intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

export const isPolygonInsidePolygon = (innerPolygon, outerPolygon) => {
    // innerPolygon = [x1, y1, x2, y2, ...]
    // outerPolygon = [x1, y1, x2, y2, ...]
    for (let i = 0; i < innerPolygon.length; i += 2) {
        if (!pointInPolygon({ x: innerPolygon[i], y: innerPolygon[i + 1] }, outerPolygon)) {
            return false;
        }
    }
    return true;
};
