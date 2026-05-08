import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as PIXI from 'pixi.js';

const PixiLayer = forwardRef(({ 
    imageSrc, 
    zoom = 1,
    meshWarpActive, 
    warpRadius, 
    warpIntensity, 
    lassoMode, 
    freehandMode, 
    onSaveHistory,
    onLassoFinishedChange
}, ref) => {
    const pixiContainerRef = useRef(null);
    const canvasRef = useRef(null);
    const pixiAppRef = useRef(null);
    const pixiGeometryRef = useRef(null);
    const brushGraphicRef = useRef(null);
    const meshWarpActiveRef = useRef(meshWarpActive);
    const warpParams = useRef({ radius: warpRadius, intensity: warpIntensity });
    const zoomRef = useRef(zoom);

    // Lasso state
    const [lassoPoints, setLassoPoints] = useState([]);
    const [lassoFinished, setLassoFinished] = useState(false);
    const [lassoCursor, setLassoCursor] = useState({ x: 0, y: 0 });
    const lassoRef = useRef({ points: [], finished: false });
    const isFreehandDrawingRef = useRef(false);
    
    const lassoModeRef = useRef(lassoMode);
    const freehandModeRef = useRef(freehandMode);

    // Sync refs
    useEffect(() => { meshWarpActiveRef.current = meshWarpActive; }, [meshWarpActive]);
    useEffect(() => { warpParams.current = { radius: warpRadius, intensity: warpIntensity }; }, [warpRadius, warpIntensity]);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    useEffect(() => { lassoModeRef.current = lassoMode; }, [lassoMode]);
    useEffect(() => { freehandModeRef.current = freehandMode; }, [freehandMode]);
    useEffect(() => { onLassoFinishedChange?.(lassoFinished); }, [lassoFinished, onLassoFinishedChange]);

    // ── Imperative API ────────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
        getGeometryData: () => {
            return pixiGeometryRef.current ? pixiGeometryRef.current.buffers[0].data.slice() : null;
        },
        setGeometryData: (data) => {
            if (pixiGeometryRef.current && data) {
                pixiGeometryRef.current.buffers[0].data.set(data);
                pixiGeometryRef.current.buffers[0].update();
            }
        },
        takeSnapshot: async () => {
            if (!pixiAppRef.current) return null;
            const app = pixiAppRef.current;
            const pixiB64 = await app.renderer.extract.base64(app.stage, 'image/jpeg', 1.0);
            
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => {
                    const c = document.createElement('canvas');
                    c.width = img.width; c.height = img.height;
                    const ctx = c.getContext('2d');
                    ctx.translate(0, img.height);
                    ctx.scale(1, -1);
                    ctx.drawImage(img, 0, 0);
                    resolve(c.toDataURL('image/jpeg', 1.0));
                };
                img.src = pixiB64;
            });
        },
        applyLassoWarp: (dx, dy) => {
            if (!lassoRef.current.finished || !pixiGeometryRef.current || !pixiAppRef.current) return;
            const verts = pixiGeometryRef.current.buffers[0].data;
            const poly = lassoRef.current.points;
            const pixiCanvas = pixiAppRef.current.canvas;
            const offsetX = parseFloat(pixiCanvas.style.left) || 0;
            const offsetY = parseFloat(pixiCanvas.style.top) || 0;
            
            let modified = false;
            for (let i = 0; i < verts.length; i += 2) {
                const vx = verts[i] + offsetX;
                const vy = verts[i + 1] + offsetY;
                if (pointInPolygon(vx, vy, poly)) {
                    verts[i] += dx;
                    verts[i + 1] += dy;
                    modified = true;
                }
            }
            if (modified) pixiGeometryRef.current.buffers[0].update();
        },
        clearLasso: () => {
            lassoRef.current = { points: [], finished: false };
            isFreehandDrawingRef.current = false;
            setLassoPoints([]);
            setLassoFinished(false);
            setLassoCursor({ x: 0, y: 0 });
        },
        getApp: () => pixiAppRef.current
    }));

    // ── Lasso utilities ─────────────────────────────────────────────────────────
    const pointInPolygon = (px, py, poly) => {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].x, yi = poly[i].y;
            const xj = poly[j].x, yj = poly[j].y;
            const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    const handleLassoClick = useCallback((e) => {
        if (!lassoModeRef.current || lassoRef.current.finished) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoomRef.current;
        const y = (e.clientY - rect.top) / zoomRef.current;
        const points = lassoRef.current.points;
        if (points.length >= 3) {
            const dist = Math.hypot(x - points[0].x, y - points[0].y);
            if (dist < 15) {
                lassoRef.current.finished = true;
                setLassoFinished(true);
                setLassoPoints([...points]);
                return;
            }
        }
        const newPoints = [...points, { x, y }];
        lassoRef.current.points = newPoints;
        setLassoPoints(newPoints);
    }, []);

    const handleLassoDoubleClick = useCallback((e) => {
        if (!lassoModeRef.current || lassoRef.current.finished) return;
        const trimmed = lassoRef.current.points.slice(0, -1);
        if (trimmed.length < 3) return;
        lassoRef.current.points = trimmed;
        lassoRef.current.finished = true;
        setLassoPoints(trimmed);
        setLassoFinished(true);
    }, []);

    const handleLassoMouseMove = useCallback((e) => {
        if (!lassoModeRef.current || lassoRef.current.finished) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setLassoCursor({ 
            x: (e.clientX - rect.left) / zoomRef.current, 
            y: (e.clientY - rect.top) / zoomRef.current 
        });
    }, []);

    const handleFreehandMouseDown = useCallback((e) => {
        if (!freehandModeRef.current || lassoRef.current.finished) return;
        lassoRef.current = { points: [], finished: false };
        setLassoPoints([]);
        setLassoFinished(false);
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoomRef.current;
        const y = (e.clientY - rect.top) / zoomRef.current;
        lassoRef.current.points = [{ x, y }];
        setLassoPoints([{ x, y }]);
        isFreehandDrawingRef.current = true;
        e.preventDefault();
    }, []);

    const handleFreehandMouseMove = useCallback((e) => {
        if (!freehandModeRef.current || !isFreehandDrawingRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoomRef.current;
        const y = (e.clientY - rect.top) / zoomRef.current;
        const points = lassoRef.current.points;
        if (points.length === 0) return;
        const last = points[points.length - 1];
        if (Math.hypot(x - last.x, y - last.y) < 5) return;
        const newPoints = [...points, { x, y }];
        lassoRef.current.points = newPoints;
        setLassoPoints(newPoints);
    }, []);

    const handleFreehandMouseUp = useCallback(() => {
        if (!freehandModeRef.current || !isFreehandDrawingRef.current) return;
        isFreehandDrawingRef.current = false;
        const points = lassoRef.current.points;
        if (points.length < 3) {
            lassoRef.current = { points: [], finished: false };
            setLassoPoints([]);
            return;
        }
        lassoRef.current.finished = true;
        setLassoFinished(true);
        setLassoPoints([...points]);
    }, []);

    // ── Initialization ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!pixiContainerRef.current || !canvasRef.current) return;

        let cleanupFn = null;
        const container = pixiContainerRef.current;
        const imgEl = new Image();
        imgEl.crossOrigin = 'anonymous';
        imgEl.onload = async () => {
            if (!pixiContainerRef.current || !canvasRef.current) return;

            const cW = container.clientWidth;
            const cH = container.clientHeight;
            const scale = Math.min(cW / imgEl.width, cH / imgEl.height);
            const w = Math.round(imgEl.width * scale);
            const h = Math.round(imgEl.height * scale);
            const left = Math.round((cW - w) / 2);
            const top = Math.round((cH - h) / 2);

            const app = new PIXI.Application();
            await app.init({ 
                canvas: canvasRef.current,
                width: w, 
                height: h, 
                backgroundAlpha: 0, 
                preserveDrawingBuffer: true 
            });

            app.canvas.style.position = 'absolute';
            app.canvas.style.left = `${left}px`;
            app.canvas.style.top = `${top}px`;
            app.canvas.style.zIndex = '1';
            app.canvas.style.pointerEvents = meshWarpActiveRef.current ? 'auto' : 'none';

            pixiAppRef.current = app;

            const texture = await PIXI.Assets.load(imageSrc);
            const rows = 20, cols = 20;
            const vCount = (rows + 1) * (cols + 1);
            const vertices = new Float32Array(vCount * 2);
            const uvs = new Float32Array(vCount * 2);
            const indices = [];

            let i = 0;
            for (let y = 0; y <= rows; y++) {
                for (let x = 0; x <= cols; x++) {
                    vertices[i * 2] = (x / cols) * w;
                    vertices[i * 2 + 1] = (y / rows) * h;
                    uvs[i * 2] = x / cols;
                    uvs[i * 2 + 1] = y / rows;
                    i++;
                }
            }

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const idx = y * (cols + 1) + x;
                    indices.push(idx, idx + 1, idx + cols + 1, idx + 1, idx + cols + 2, idx + cols + 1);
                }
            }

            const geometry = new PIXI.MeshGeometry({
                positions: vertices,
                uvs,
                indices: new Uint32Array(indices)
            });
            pixiGeometryRef.current = geometry;

            const shader = PIXI.Shader.from({
                gl: {
                    vertex: `
                        precision mediump float;
                        attribute vec2 aPosition;
                        attribute vec2 aUV;
                        varying vec2 vUV;
                        void main() {
                          vec2 pos = aPosition / vec2(${w.toFixed(1)}, ${h.toFixed(1)});
                          gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
                          gl_Position.y *= -1.0;
                          vUV = aUV;
                        }`,
                    fragment: `
                        precision mediump float;
                        varying vec2 vUV;
                        uniform sampler2D uSampler;
                        void main() { gl_FragColor = texture2D(uSampler, vUV); }`
                },
                resources: { uSampler: texture.source }
            });

            const mesh = new PIXI.Mesh({ geometry, shader });
            app.stage.addChild(mesh);

            const brushGraphic = new PIXI.Graphics();
            app.stage.addChild(brushGraphic);
            brushGraphicRef.current = brushGraphic;

            let isDragging = false, sx = 0, sy = 0;
            const onDown = (e) => {
                if (lassoModeRef.current || freehandModeRef.current) return;
                const b = app.canvas.getBoundingClientRect();
                sx = (e.clientX - b.left) / zoomRef.current; 
                sy = (e.clientY - b.top) / zoomRef.current;
                isDragging = true;
            };
            const onUp = () => {
                if (isDragging) onSaveHistory?.();
                isDragging = false;
            };
            const onLeave = () => {
                isDragging = false;
                if (brushGraphic) brushGraphic.visible = false;
            };
            const onMove = (e) => {
                const b = app.canvas.getBoundingClientRect();
                const cx = (e.clientX - b.left) / zoomRef.current;
                const cy = (e.clientY - b.top) / zoomRef.current;

                if (brushGraphic && meshWarpActiveRef.current) {
                    brushGraphic.clear()
                        .circle(0, 0, warpParams.current.radius)
                        .stroke({ width: 1, color: 0xffffff, alpha: 0.8 });
                    brushGraphic.position.set(cx, cy);
                    brushGraphic.visible = true;
                }

                if (!isDragging) return;

                const dx = cx - sx, dy = cy - sy;
                const p = warpParams.current;
                const fX = dx * p.intensity * 0.2;
                const fY = dy * p.intensity * 0.2;
                const verts = geometry.buffers[0].data;
                let modified = false;
                for (let i = 0; i < verts.length; i += 2) {
                    const dist = Math.hypot(verts[i] - sx, verts[i + 1] - sy);
                    if (dist < p.radius) {
                        const weight = (p.radius - dist) / p.radius;
                        verts[i] += fX * weight;
                        verts[i + 1] += fY * weight;
                        modified = true;
                    }
                }
                if (modified) geometry.buffers[0].update();
                sx = cx; sy = cy;
            };

            app.canvas.addEventListener('pointerdown', onDown);
            app.canvas.addEventListener('pointerup', onUp);
            app.canvas.addEventListener('pointerleave', onLeave);
            app.canvas.addEventListener('pointermove', onMove);

            cleanupFn = () => {
                app.canvas.removeEventListener('pointerdown', onDown);
                app.canvas.removeEventListener('pointerup', onUp);
                app.canvas.removeEventListener('pointerleave', onLeave);
                app.canvas.removeEventListener('pointermove', onMove);
                app.destroy({ removeView: false, children: true });
                pixiAppRef.current = null;
                pixiGeometryRef.current = null;
                brushGraphicRef.current = null;
            };
        };
        imgEl.src = imageSrc;

        return () => {
            if (cleanupFn) cleanupFn();
            else if (pixiAppRef.current) {
                pixiAppRef.current.destroy({ removeView: false, children: true });
                pixiAppRef.current = null;
            }
        };
    }, [imageSrc]);

    // Handle pointer-events toggle
    useEffect(() => {
        if (pixiAppRef.current?.canvas) {
            pixiAppRef.current.canvas.style.pointerEvents = meshWarpActive ? 'auto' : 'none';
        }
        if (!meshWarpActive && brushGraphicRef.current) {
            brushGraphicRef.current.visible = false;
        }
    }, [meshWarpActive]);

    return (
        <div 
            ref={pixiContainerRef}
            style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
        >
            <canvas ref={canvasRef} />
            {meshWarpActive && (
                <svg
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 3,
                        pointerEvents: (lassoMode || freehandMode) ? 'all' : 'none',
                        cursor: (lassoMode || freehandMode) && !lassoFinished ? 'crosshair' : 'default',
                        overflow: 'visible',
                        userSelect: 'none',
                    }}
                    onClick={lassoMode ? handleLassoClick : undefined}
                    onDoubleClick={lassoMode ? handleLassoDoubleClick : undefined}
                    onMouseDown={freehandMode ? handleFreehandMouseDown : undefined}
                    onMouseUp={freehandMode ? handleFreehandMouseUp : undefined}
                    onMouseMove={(e) => {
                        if (freehandMode) handleFreehandMouseMove(e);
                        else if (lassoMode) handleLassoMouseMove(e);
                    }}
                >
                    {lassoFinished && lassoPoints.length >= 3 && (
                        <polygon
                            points={lassoPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill={freehandMode ? 'rgba(139,92,246,0.12)' : 'rgba(59,130,246,0.12)'}
                            stroke={freehandMode ? '#8b5cf6' : '#3b82f6'}
                            strokeWidth="1.5"
                            strokeDasharray="6,3"
                        />
                    )}
                    {freehandMode && !lassoFinished && lassoPoints.length >= 2 && (
                        <polyline
                            points={lassoPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}
                    {lassoMode && !lassoFinished && lassoPoints.length >= 2 && (
                        <polyline
                            points={lassoPoints.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="1.5"
                            strokeDasharray="6,3"
                        />
                    )}
                    {lassoMode && !lassoFinished && lassoPoints.length >= 1 && (
                        <line
                            x1={lassoPoints[lassoPoints.length - 1].x}
                            y1={lassoPoints[lassoPoints.length - 1].y}
                            x2={lassoCursor.x}
                            y2={lassoCursor.y}
                            stroke="#3b82f6"
                            strokeWidth="1.5"
                            strokeDasharray="4,4"
                            opacity="0.6"
                        />
                    )}
                    {freehandMode && lassoPoints.length >= 1 && !lassoFinished && (
                        <circle cx={lassoPoints[0].x} cy={lassoPoints[0].y} r={5} fill="#8b5cf6" stroke="white" strokeWidth="1.5" />
                    )}
                    {lassoMode && lassoPoints.map((p, idx) => {
                        const isFirst = idx === 0;
                        const canClose = isFirst && lassoPoints.length >= 3 && !lassoFinished;
                        const nearFirst = canClose && Math.hypot(lassoCursor.x - p.x, lassoCursor.y - p.y) < 15;
                        return (
                            <g key={idx}>
                                {nearFirst && (
                                    <circle cx={p.x} cy={p.y} r={12} fill="rgba(59,130,246,0.25)" stroke="#3b82f6" strokeWidth="1" />
                                )}
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={isFirst ? 6 : 4}
                                    fill={isFirst ? '#3b82f6' : 'white'}
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                />
                            </g>
                        );
                    })}
                </svg>
            )}
        </div>
    );
});

export default PixiLayer;
