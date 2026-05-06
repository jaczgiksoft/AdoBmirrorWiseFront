import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Square, Circle, Minus, MousePointer2, Pen, Type, Undo2, Redo2, ArrowUpRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, Download, Save, EyeOff, Lasso, PenLine } from 'lucide-react';
import { fabric } from 'fabric';
import * as PIXI from 'pixi.js';

export default function ImageEditorModal({ imageSrc, imageName, onClose, onSave }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [activeTool, setActiveTool] = useState('select'); // select, draw, line, arrow, circle, square, text
    const [color, setColor] = useState('#ff0000');
    const [brushSize, setBrushSize] = useState(3);

    // History state
    const historyRef = useRef([]);
    const historyIndexRef = useRef(-1);
    const isRestoring = useRef(false);
    const [, forceUpdate] = useState({});

    // Mesh Warp state
    const pixiContainerRef = useRef(null);
    const pixiAppRef = useRef(null);
    const pixiGeometryRef = useRef(null);
    const meshWarpActiveRef = useRef(false);
    const [meshWarpActive, setMeshWarpActive] = useState(false);
    const [warpRadius, setWarpRadius] = useState(50);
    const [warpIntensity, setWarpIntensity] = useState(0.5);
    const warpParams = useRef({ radius: 50, intensity: 0.5 });
    const brushGraphicRef = useRef(null);

    // Lasso selection state (sub-mode within meshWarp)
    const [lassoMode, setLassoMode] = useState(false);
    const lassoModeRef = useRef(false);
    const [lassoPoints, setLassoPoints] = useState([]);
    const [lassoFinished, setLassoFinished] = useState(false);
    const [lassoCursor, setLassoCursor] = useState({ x: 0, y: 0 });
    const lassoRef = useRef({ points: [], finished: false });

    // Freehand lasso state (draw by dragging, mutually exclusive with point lasso)
    const [freehandMode, setFreehandMode] = useState(false);
    const freehandModeRef = useRef(false);
    const isFreehandDrawingRef = useRef(false);

    // Keep meshWarpActiveRef in sync
    useEffect(() => { meshWarpActiveRef.current = meshWarpActive; }, [meshWarpActive]);

    // Keep lassoModeRef in sync
    useEffect(() => { lassoModeRef.current = lassoMode; }, [lassoMode]);

    // Keep freehandModeRef in sync
    useEffect(() => { freehandModeRef.current = freehandMode; }, [freehandMode]);

    useEffect(() => {
        warpParams.current = { radius: warpRadius, intensity: warpIntensity };
    }, [warpRadius, warpIntensity]);

    // State for shape drawing
    const drawingState = useRef({
        isDrawing: false,
        shape: null,
        startX: 0,
        startY: 0,
        textLabel: null // Para las medidas
    });

    // Inicializar Canvas Fabric (capa superior, sin backgroundImage — PixiJS muestra la imagen)
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width,
            height,
            selection: true,
            preserveObjectStacking: true,
            backgroundColor: 'transparent',
        });

        // Canvas transparente: PixiJS (z-index:1) es visible por debajo
        canvas.backgroundColor = 'transparent';
        canvas.renderAll();

        // Posicionar el wrapper de Fabric correctamente (z-index: 2)
        if (canvas.wrapperEl) {
            canvas.wrapperEl.style.position = 'absolute';
            canvas.wrapperEl.style.top = '0';
            canvas.wrapperEl.style.left = '0';
            canvas.wrapperEl.style.zIndex = '2';
            canvas.wrapperEl.style.pointerEvents = 'auto';
        }

        // Configuración de pincel por defecto
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = brushSize;

        setFabricCanvas(canvas);

        const handleResize = () => {};
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.dispose();
        };
    }, [imageSrc]);

    // Actualizar configuración cuando cambian herramientas
    useEffect(() => {
        if (!fabricCanvas) return;

        fabricCanvas.isDrawingMode = (activeTool === 'draw');
        fabricCanvas.freeDrawingBrush.color = color;
        fabricCanvas.freeDrawingBrush.width = brushSize;

        // Deshabilitar selección de objetos si estamos dibujando
        const selectable = activeTool === 'select';
        fabricCanvas.getObjects().forEach(obj => {
            obj.set({
                selectable: selectable,
                evented: selectable
            });
        });

        if (activeTool === 'select') {
            fabricCanvas.defaultCursor = 'default';
        } else if (activeTool === 'text') {
            fabricCanvas.defaultCursor = 'text';
        } else {
            fabricCanvas.defaultCursor = 'crosshair';
            fabricCanvas.discardActiveObject().renderAll();
        }

    }, [activeTool, color, brushSize, fabricCanvas]);

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

    const applyLassoWarp = useCallback((dx, dy) => {
        if (!lassoRef.current.finished || !pixiGeometryRef.current || !pixiAppRef.current) return;
        const verts = pixiGeometryRef.current.buffers[0].data;
        const poly = lassoRef.current.points;
        // Offset: pixi canvas is positioned within container via CSS left/top
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
    }, []);

    const clearLasso = useCallback(() => {
        lassoRef.current = { points: [], finished: false };
        isFreehandDrawingRef.current = false;
        setLassoPoints([]);
        setLassoFinished(false);
        setLassoCursor({ x: 0, y: 0 });
    }, []);

    const handleLassoClick = useCallback((e) => {
        if (!lassoModeRef.current || lassoRef.current.finished) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const points = lassoRef.current.points;
        // Close if clicking near first point (≥3 existing points)
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
        // Remove the duplicate point added by the second click of the double-click
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
        setLassoCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, []);

    // ── Freehand lasso handlers ────────────────────────────────────────────────
    const handleFreehandMouseDown = useCallback((e) => {
        if (!freehandModeRef.current || lassoRef.current.finished) return;
        // Start fresh on each new drag
        lassoRef.current = { points: [], finished: false };
        setLassoPoints([]);
        setLassoFinished(false);
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        lassoRef.current.points = [{ x, y }];
        setLassoPoints([{ x, y }]);
        isFreehandDrawingRef.current = true;
        // Prevent text selection while dragging
        e.preventDefault();
    }, []);

    const handleFreehandMouseMove = useCallback((e) => {
        if (!freehandModeRef.current || !isFreehandDrawingRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const points = lassoRef.current.points;
        if (points.length === 0) return;
        const last = points[points.length - 1];
        // Throttle: only add a point if >5px from the last
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
            // Not enough points — reset
            lassoRef.current = { points: [], finished: false };
            setLassoPoints([]);
            return;
        }
        lassoRef.current.finished = true;
        setLassoFinished(true);
        setLassoPoints([...points]);
    }, []);

    const saveHistory = useCallback(() => {

        if (!fabricCanvas || !pixiGeometryRef.current || isRestoring.current) return;

        const currentState = {
            fabric: fabricCanvas.toJSON(['isLensController', 'pixelatedClone']),
            pixi: pixiGeometryRef.current.buffers[0].data.slice()
        };

        const newHistory = [...historyRef.current.slice(0, historyIndexRef.current + 1), currentState];
        if (newHistory.length > 6) { // 1 base + 5 steps
            newHistory.shift();
        }
        
        historyRef.current = newHistory;
        historyIndexRef.current = newHistory.length - 1;
        forceUpdate({});
    }, [fabricCanvas]);

    const undo = useCallback(() => {
        if (historyIndexRef.current <= 0 || isRestoring.current) return;
        
        isRestoring.current = true;
        historyIndexRef.current--;
        const state = historyRef.current[historyIndexRef.current];
        
        // Restore Fabric
        fabricCanvas.loadFromJSON(state.fabric, () => {
            fabricCanvas.renderAll();
            
            // Restore Pixi
            if (pixiGeometryRef.current) {
                pixiGeometryRef.current.buffers[0].data.set(state.pixi);
                pixiGeometryRef.current.buffers[0].update();
            }
            
            isRestoring.current = false;
            forceUpdate({});
        });
    }, [fabricCanvas]);

    const redo = useCallback(() => {
        if (historyIndexRef.current >= historyRef.current.length - 1 || isRestoring.current) return;
        
        isRestoring.current = true;
        historyIndexRef.current++;
        const state = historyRef.current[historyIndexRef.current];
        
        // Restore Fabric
        fabricCanvas.loadFromJSON(state.fabric, () => {
            fabricCanvas.renderAll();
            
            // Restore Pixi
            if (pixiGeometryRef.current) {
                pixiGeometryRef.current.buffers[0].data.set(state.pixi);
                pixiGeometryRef.current.buffers[0].update();
            }
            
            isRestoring.current = false;
            forceUpdate({});
        });
    }, [fabricCanvas]);

    // Lógica de dibujo con el ratón
    useEffect(() => {
        if (!fabricCanvas) return;

        const handleMouseDown = (o) => {
            if (activeTool === 'select' || activeTool === 'draw') return;

            const pointer = fabricCanvas.getPointer(o.e);
            drawingState.current.isDrawing = true;
            drawingState.current.startX = pointer.x;
            drawingState.current.startY = pointer.y;

            let shape;

            if (activeTool === 'text') {
                const text = new fabric.IText('Doble clic para editar', {
                    left: pointer.x,
                    top: pointer.y,
                    fontFamily: 'Arial',
                    fill: color,
                    fontSize: 24,
                });
                fabricCanvas.add(text);
                fabricCanvas.setActiveObject(text);
                setActiveTool('select');
                drawingState.current.isDrawing = false;
                return;
            }

            const strokeOptions = {
                stroke: color,
                strokeWidth: brushSize,
                fill: 'transparent',
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false
            };

            switch (activeTool) {
                case 'line':
                    shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], strokeOptions);

                    // Texto para la medida
                    const textLabel = new fabric.Text('0.0 mm', {
                        left: pointer.x,
                        top: pointer.y - 20,
                        fontSize: 16,
                        fill: color,
                        originX: 'center',
                        originY: 'center',
                        selectable: false,
                        evented: false,
                        backgroundColor: 'rgba(255,255,255,0.7)'
                    });
                    drawingState.current.textLabel = textLabel;
                    fabricCanvas.add(textLabel);
                    break;
                case 'circle':
                    shape = new fabric.Circle({
                        ...strokeOptions,
                        left: pointer.x,
                        top: pointer.y,
                        radius: 1,
                    });
                    break;
                case 'square':
                    shape = new fabric.Rect({
                        ...strokeOptions,
                        left: pointer.x,
                        top: pointer.y,
                        width: 1,
                        height: 1,
                    });
                    break;
                case 'arrow':
                    // Una flecha simple usando un Path
                    shape = new fabric.Path('M 0 0 L 0 0', {
                        ...strokeOptions,
                        fill: 'transparent',
                    });
                    break;
                case 'censorship':
                    shape = new fabric.Rect({
                        ...strokeOptions,
                        fill: 'rgba(255, 255, 255, 0.1)',
                        stroke: 'transparent',
                        strokeDashArray: [],
                        left: pointer.x,
                        top: pointer.y,
                        width: 1,
                        height: 1,
                        selectable: false,
                        evented: false
                    });
                    break;
            }

            if (shape) {
                drawingState.current.shape = shape;
                fabricCanvas.add(shape);
            }
        };

        const handleMouseMove = (o) => {
            if (!drawingState.current.isDrawing) return;
            const pointer = fabricCanvas.getPointer(o.e);
            const shape = drawingState.current.shape;
            const startX = drawingState.current.startX;
            const startY = drawingState.current.startY;

            if (!shape) return;

            if (activeTool === 'line') {
                shape.set({ x2: pointer.x, y2: pointer.y });

                // Actualizar texto de medida (asumiendo 1px = 0.26mm aprox como ref visual, o ajustar según necesidad)
                const textLabel = drawingState.current.textLabel;
                if (textLabel) {
                    const dist = Math.hypot(pointer.x - startX, pointer.y - startY);
                    // Calibración arbitraria para que se parezca a un mm en pantalla
                    const mm = (dist * 0.264583).toFixed(1);
                    textLabel.set({
                        text: `${mm} mm`,
                        left: (startX + pointer.x) / 2,
                        top: (startY + pointer.y) / 2 - 20,
                    });
                }

            } else if (activeTool === 'circle') {
                const radius = Math.hypot(pointer.x - startX, pointer.y - startY);
                shape.set({ radius });
            } else if (activeTool === 'square' || activeTool === 'censorship') {
                shape.set({
                    width: Math.abs(pointer.x - startX),
                    height: Math.abs(pointer.y - startY),
                    // origin is center, so left/top need adjustment if drawing in different directions
                    left: startX + (pointer.x - startX) / 2,
                    top: startY + (pointer.y - startY) / 2
                });
            } else if (activeTool === 'arrow') {
                // Dibujar flecha (línea con cabeza)
                const dx = pointer.x - startX;
                const dy = pointer.y - startY;
                const angle = Math.atan2(dy, dx);
                const headlen = 15; // longitud de la cabeza de la flecha

                const pathData = [
                    'M', startX, startY,
                    'L', pointer.x, pointer.y,
                    'L', pointer.x - headlen * Math.cos(angle - Math.PI / 6), pointer.y - headlen * Math.sin(angle - Math.PI / 6),
                    'M', pointer.x, pointer.y,
                    'L', pointer.x - headlen * Math.cos(angle + Math.PI / 6), pointer.y - headlen * Math.sin(angle + Math.PI / 6)
                ].join(' ');

                shape.set({ path: new fabric.Path(pathData).path });
                // Reposicionar el centro del path para que rote bien
                const dim = shape._calcDimensions();
                shape.set({
                    left: startX + dx / 2,
                    top: startY + dy / 2,
                    pathOffset: { x: dim.left + dim.width / 2, y: dim.top + dim.height / 2 }
                });
            }

            fabricCanvas.renderAll();
        };

        const handleMouseUp = () => {
            if (drawingState.current.isDrawing) {
                const tool = activeTool;
                drawingState.current.isDrawing = false;

                // Caso especial para censura: snapshot de PixiJS como fuente visual
                if (tool === 'censorship' && drawingState.current.shape) {
                    const guideRect = drawingState.current.shape;
                    const width = guideRect.width;
                    const height = guideRect.height;

                    if (width > 5 && height > 5 && pixiAppRef.current) {
                        // Snapshot de la capa Pixi (imagen real/deformada) como referencia
                        pixiAppRef.current.renderer.extract.base64(
                            pixiAppRef.current.stage, 'image/jpeg', 1.0
                        ).then((pixiB64) => {
                            // Corregir flip vertical del WebGL
                            const flipImg = new Image();
                            flipImg.onload = () => {
                                const tmpC = document.createElement('canvas');
                                tmpC.width = flipImg.width; tmpC.height = flipImg.height;
                                const tmpCtx = tmpC.getContext('2d');
                                tmpCtx.translate(0, flipImg.height);
                                tmpCtx.scale(1, -1);
                                tmpCtx.drawImage(flipImg, 0, 0);
                                const snapshotURL = tmpC.toDataURL('image/jpeg', 1.0);

                                // 1. Rect de control (lente interactiva)
                                const lensRect = new fabric.Rect({
                                    left: guideRect.left,
                                    top: guideRect.top,
                                    width, height,
                                    fill: 'transparent',
                                    stroke: 'transparent',
                                    strokeWidth: 0,
                                    originX: 'center', originY: 'center',
                                    cornerColor: '#3b82f6',
                                    cornerSize: 8,
                                    transparentCorners: false,
                                    isLensController: true
                                });

                                // 2. Máscara de recorte
                                const clipMask = new fabric.Rect({
                                    left: guideRect.left, top: guideRect.top,
                                    width, height,
                                    fill: 'white',
                                    originX: 'center', originY: 'center',
                                    absolutePositioned: true
                                });

                                // 3. Imagen pixelada desde el snapshot de Pixi
                                fabric.Image.fromURL(snapshotURL, (pixiImg) => {
                                    // Alinear la imagen del snapshot con el canvas de Fabric
                                    const pixiCanvas = pixiAppRef.current?.canvas;
                                    const offsetX = pixiCanvas
                                        ? (fabricCanvas.width - pixiCanvas.width) / 2
                                        : 0;
                                    const offsetY = pixiCanvas
                                        ? (fabricCanvas.height - pixiCanvas.height) / 2
                                        : 0;

                                    pixiImg.set({
                                        left: offsetX,
                                        top: offsetY,
                                        selectable: false,
                                        evented: false,
                                        clipPath: clipMask
                                    });

                                    const pixelateFilter = new fabric.Image.filters.Pixelate({ blocksize: 15 });
                                    pixiImg.filters = [pixelateFilter];
                                    pixiImg.applyFilters();

                                    lensRect.pixelatedClone = pixiImg;
                                    fabricCanvas.add(pixiImg);
                                    fabricCanvas.add(lensRect);
                                    fabricCanvas.setActiveObject(lensRect);
                                    fabricCanvas.renderAll();
                                });
                            };
                            flipImg.src = pixiB64;
                        });
                    }

                    fabricCanvas.remove(guideRect);
                    drawingState.current.shape = null;
                    setActiveTool('select');
                    return;
                }


                // Hacer el objeto seleccionable una vez terminado
                if (drawingState.current.shape) {
                    drawingState.current.shape.set({
                        selectable: true,
                        evented: true
                    });
                }
                if (drawingState.current.textLabel) {
                    drawingState.current.textLabel.set({
                        selectable: true,
                        evented: true
                    });

                    // Agrupar línea y texto para que se muevan juntos
                    if (activeTool === 'line') {
                        const group = new fabric.Group([drawingState.current.shape, drawingState.current.textLabel], {
                            selectable: true
                        });
                        fabricCanvas.remove(drawingState.current.shape, drawingState.current.textLabel);
                        fabricCanvas.add(group);
                    }
                }

                drawingState.current.shape = null;
                drawingState.current.textLabel = null;

                saveHistory();

                // Volver a la herramienta de selección después de dibujar una forma (opcional, ayuda al UX)
                if (activeTool !== 'draw') {
                    setActiveTool('select');
                }
            }
        };

        const handleObjectUpdate = (e) => {
            const obj = e.target;
            if (obj && obj.isLensController && obj.pixelatedClone) {
                const mask = obj.pixelatedClone.clipPath;
                if (mask) {
                    mask.set({
                        left: obj.left,
                        top: obj.top,
                        scaleX: obj.scaleX,
                        scaleY: obj.scaleY,
                        width: obj.width,
                        height: obj.height,
                        angle: obj.angle,
                        skewX: obj.skewX,
                        skewY: obj.skewY,
                        originX: obj.originX,
                        originY: obj.originY
                    });
                    mask.setCoords();
                }
                fabricCanvas.renderAll();
            }
        };

        fabricCanvas.on('mouse:down', handleMouseDown);
        fabricCanvas.on('mouse:move', handleMouseMove);
        fabricCanvas.on('mouse:up', handleMouseUp);
        fabricCanvas.on('object:moving', handleObjectUpdate);
        fabricCanvas.on('object:scaling', handleObjectUpdate);
        fabricCanvas.on('object:rotating', handleObjectUpdate);
        fabricCanvas.on('object:modified', saveHistory);

        return () => {
            fabricCanvas.off('mouse:down', handleMouseDown);
            fabricCanvas.off('mouse:move', handleMouseMove);
            fabricCanvas.off('mouse:up', handleMouseUp);
            fabricCanvas.off('object:moving', handleObjectUpdate);
            fabricCanvas.off('object:scaling', handleObjectUpdate);
            fabricCanvas.off('object:rotating', handleObjectUpdate);
            fabricCanvas.off('object:modified', saveHistory);
        };
    }, [fabricCanvas, activeTool, color, brushSize]);

    // Handle Keyboard events (Delete, Undo, Redo, Lasso arrows)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                deleteSelected();
                saveHistory();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && lassoRef.current.finished) {
                e.preventDefault();
                const step = Math.max(1, (warpParams.current?.intensity ?? 0.5) * 5);
                const dirs = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] };
                const [dx, dy] = dirs[e.key];
                applyLassoWarp(dx, dy);
                saveHistory();
            } else if (e.key === 'Escape' && lassoRef.current.points.length > 0) {
                clearLasso();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fabricCanvas, meshWarpActive, undo, redo, saveHistory, applyLassoWarp, clearLasso]);

    // ── Inicializar PixiJS UNA VEZ al montar (capa base, z-index: 1) ───────────
    useEffect(() => {
        if (!pixiContainerRef.current || !containerRef.current) return;

        let cleanupFn = null;

        const container = containerRef.current;
        const imgEl = new Image();
        imgEl.crossOrigin = 'anonymous';
        imgEl.onload = async () => {
            if (!pixiContainerRef.current) return;

            const cW = container.clientWidth;
            const cH = container.clientHeight;
            const scale = Math.min(cW / imgEl.width, cH / imgEl.height);
            const w = Math.round(imgEl.width * scale);
            const h = Math.round(imgEl.height * scale);
            const left = Math.round((cW - w) / 2);
            const top = Math.round((cH - h) / 2);

            const app = new PIXI.Application();
            await app.init({ width: w, height: h, backgroundAlpha: 0, preserveDrawingBuffer: true });

            app.canvas.style.position = 'absolute';
            app.canvas.style.left = `${left}px`;
            app.canvas.style.top = `${top}px`;
            app.canvas.style.zIndex = '1';
            // Empieza sin recibir eventos (Fabric los gestiona por defecto)
            app.canvas.style.pointerEvents = meshWarpActiveRef.current ? 'auto' : 'none';

            pixiContainerRef.current.appendChild(app.canvas);
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
                // Block free-drag when lasso mode is active
                if (lassoModeRef.current) return;
                const b = app.canvas.getBoundingClientRect();
                sx = e.clientX - b.left; sy = e.clientY - b.top;
                isDragging = true;
            };
            const onUp = () => { 
                if (isDragging) saveHistory();
                isDragging = false; 
            };
            const onLeave = () => {
                isDragging = false;
                if (brushGraphic) brushGraphic.visible = false;
            };
            const onMove = (e) => {
                const b = app.canvas.getBoundingClientRect();
                const cx = e.clientX - b.left, cy = e.clientY - b.top;

                // Actualizar indicador de brocha
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
                app.destroy(true, { children: true, texture: true });
                pixiAppRef.current = null;
                pixiGeometryRef.current = null;
                brushGraphicRef.current = null;
            };
        };
        imgEl.src = imageSrc;

        // Save initial state once everything is loaded
        const timer = setTimeout(() => {
            saveHistory();
        }, 1000);

        return () => {
            clearTimeout(timer);
            if (cleanupFn) cleanupFn();
            else if (pixiAppRef.current) {
                pixiAppRef.current.destroy(true, { children: true, texture: true });
                pixiAppRef.current = null;
            }
        };
    }, [imageSrc]);

    // ── Alternar pointer-events según modo activo ─────────────────────────────
    useEffect(() => {
        // Pixi recibe eventos solo cuando meshWarpActive=true
        if (pixiAppRef.current?.canvas) {
            pixiAppRef.current.canvas.style.pointerEvents = meshWarpActive ? 'auto' : 'none';
        }
        // Fabric recibe eventos solo cuando meshWarpActive=false
        if (fabricCanvas?.wrapperEl) {
            fabricCanvas.wrapperEl.style.pointerEvents = meshWarpActive ? 'none' : 'auto';
        }

        // Asegurar que el indicador de brocha se oculte si desactivamos el modo
        if (!meshWarpActive && brushGraphicRef.current) {
            brushGraphicRef.current.visible = false;
        }
        // Reset lasso & freehand when alteracion mode is deactivated
        if (!meshWarpActive) {
            setLassoMode(false);
            lassoModeRef.current = false;
            setFreehandMode(false);
            freehandModeRef.current = false;
            clearLasso();
        }
    }, [meshWarpActive, fabricCanvas, clearLasso]);

    const deleteSelected = () => {
        if (!fabricCanvas) return;
        const activeObjects = fabricCanvas.getActiveObjects();
        if (activeObjects.length) {
            fabricCanvas.discardActiveObject();
            activeObjects.forEach(function (object) {
                if (object.isLensController && object.pixelatedClone) {
                    fabricCanvas.remove(object.pixelatedClone);
                }
                fabricCanvas.remove(object);
            });
        }
    };

    // ── Guardar: compositar capa Pixi (imagen) + capa Fabric (anotaciones) ────
    const handleSave = async () => {
        if (!fabricCanvas || !pixiAppRef.current) return;

        fabricCanvas.discardActiveObject().renderAll();

        const app = pixiAppRef.current;

        // 1. Exportar PixiJS (imagen deformada) y corregir flip vertical
        const pixiB64 = await app.renderer.extract.base64(app.stage, 'image/jpeg', 1.0);
        const pixiDataURL = await new Promise(resolve => {
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

        // 2. Exportar Fabric (anotaciones, fondo transparente)
        const fabricDataURL = fabricCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });

        // 3. Compositar en un canvas temporal
        const dataURL = await new Promise(resolve => {
            const bgImg = new Image();
            bgImg.onload = () => {
                const c = document.createElement('canvas');
                c.width = app.screen.width;
                c.height = app.screen.height;
                const ctx = c.getContext('2d');

                // Dibujar imagen/deformación como base
                ctx.drawImage(bgImg, 0, 0, c.width, c.height);

                const fgImg = new Image();
                fgImg.onload = () => {
                    // Calcular offset para alinear Fabric (centrado) sobre Pixi
                    const offsetX = (fabricCanvas.width - c.width) / 2;
                    const offsetY = (fabricCanvas.height - c.height) / 2;
                    ctx.drawImage(fgImg, -offsetX, -offsetY);
                    resolve(c.toDataURL('image/jpeg', 0.9));
                };
                fgImg.src = fabricDataURL;
            };
            bgImg.src = pixiDataURL;
        });

        // Convertir dataURL a Blob
        const res = await fetch(dataURL);
        const blob = await res.blob();

        onSave(blob);
    };


    const tools = [
        { id: 'select', icon: MousePointer2, label: 'Seleccionar' },
        { id: 'draw', icon: Pen, label: 'Mano alzada' },
        { id: 'line', icon: Minus, label: 'Medir (Línea)' },
        { id: 'arrow', icon: ArrowUpRight, label: 'Flecha' },
        { id: 'circle', icon: Circle, label: 'Círculo' },
        { id: 'square', icon: Square, label: 'Cuadrado' },
        { id: 'censorship', icon: EyeOff, label: 'Censura (Pixelar)' },
        { id: 'text', icon: Type, label: 'Texto' },
    ];

    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#ffffff', '#000000'];

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col animate-in fade-in duration-200">
            {/* Toolbar Superior */}
            <div className="flex flex-col md:flex-row items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-900 shadow-sm z-10 text-white gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold truncate max-w-[200px] md:max-w-none">
                        Editando: {imageName}
                    </h2>
                </div>

                {/* Herramientas de Dibujo */}
                <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg overflow-x-auto max-w-full">
                    {!meshWarpActive && (
                        <>
                            {tools.map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => setActiveTool(tool.id)}
                                    className={`p-2 rounded-md transition-colors flex-shrink-0 ${activeTool === tool.id
                                        ? 'bg-primary text-white'
                                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                                        }`}
                                    title={tool.label}
                                >
                                    <tool.icon size={20} />
                                </button>
                            ))}

                            <div className="w-px h-6 bg-slate-600 mx-2" />

                            {/* Colores */}
                            <div className="flex items-center gap-1">
                                {colors.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-white' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                        title="Cambiar color"
                                    />
                                ))}
                            </div>

                            <div className="w-px h-6 bg-slate-600 mx-2" />

                            <button
                                onClick={() => {
                                    deleteSelected();
                                    saveHistory();
                                }}
                                disabled={meshWarpActive}
                                className={`p-2 rounded-md transition-colors ${meshWarpActive ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-red-500/20 hover:text-red-500'}`}
                                title="Eliminar elemento seleccionado (Supr)"
                            >
                                <Trash2 size={20} />
                            </button>

                            <div className="w-px h-6 bg-slate-600 mx-2" />

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={undo}
                                    disabled={historyIndexRef.current <= 0}
                                    className={`p-2 rounded-md transition-colors ${historyIndexRef.current <= 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                                    title="Deshacer (Ctrl+Z)"
                                >
                                    <Undo2 size={20} />
                                </button>
                                <button
                                    onClick={redo}
                                    disabled={historyIndexRef.current >= historyRef.current.length - 1}
                                    className={`p-2 rounded-md transition-colors ${historyIndexRef.current >= historyRef.current.length - 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                                    title="Rehacer (Ctrl+Y)"
                                >
                                    <Redo2 size={20} />
                                </button>
                            </div>

                            <div className="w-px h-6 bg-slate-600 mx-2" />
                        </>
                    )}

                    {/* Mesh Warp Checkbox */}
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={meshWarpActive}
                                onChange={(e) => setMeshWarpActive(e.target.checked)}
                                className="rounded bg-slate-700 border-slate-600 text-primary focus:ring-primary"
                            />
                            <span>Alteracion</span>
                        </label>

                        {meshWarpActive && (
                            <div className="flex items-center gap-4 ml-2 pl-2 border-l border-slate-600">
                                <label className="flex items-center gap-2 text-xs text-slate-400">
                                    Intensidad
                                    <input
                                        type="range"
                                        min="0" max="2" step="0.01"
                                        value={warpIntensity}
                                        onChange={(e) => setWarpIntensity(parseFloat(e.target.value))}
                                        className="w-20"
                                    />
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-400">
                                    Radio
                                    <input
                                        type="range"
                                        min="10" max="200" step="1"
                                        value={warpRadius}
                                        onChange={(e) => setWarpRadius(parseFloat(e.target.value))}
                                        className="w-20"
                                    />
                                </label>

                                <div className="w-px h-6 bg-slate-600" />

                                {/* Undo/Redo inside Alteration section */}
                                <div className="flex items-center bg-slate-800/50 rounded-md border border-slate-600 p-0.5">
                                    <button
                                        onClick={undo}
                                        disabled={historyIndexRef.current <= 0}
                                        className={`p-1.5 rounded transition-colors ${historyIndexRef.current <= 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                                        title="Deshacer (Ctrl+Z)"
                                    >
                                        <Undo2 size={16} />
                                    </button>
                                    <div className="w-px h-4 bg-slate-600 mx-0.5" />
                                    <button
                                        onClick={redo}
                                        disabled={historyIndexRef.current >= historyRef.current.length - 1}
                                        className={`p-1.5 rounded transition-colors ${historyIndexRef.current >= historyRef.current.length - 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                                        title="Rehacer (Ctrl+Y)"
                                    >
                                        <Redo2 size={16} />
                                    </button>
                                </div>

                                <div className="w-px h-6 bg-slate-600" />

                                {/* Point-by-point lasso toggle */}
                                <button
                                    onClick={() => {
                                        const next = !lassoMode;
                                        setLassoMode(next);
                                        lassoModeRef.current = next;
                                        // Deactivate freehand if activating point lasso
                                        if (next) {
                                            setFreehandMode(false);
                                            freehandModeRef.current = false;
                                        }
                                        clearLasso();
                                    }}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                        lassoMode
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'text-slate-300 hover:bg-slate-700 border border-slate-600'
                                    }`}
                                    title="Lazo por puntos — haz clic punto a punto para definir el área"
                                >
                                    <Lasso size={14} />
                                    Lazo
                                </button>

                                {/* Freehand lasso toggle */}
                                <button
                                    onClick={() => {
                                        const next = !freehandMode;
                                        setFreehandMode(next);
                                        freehandModeRef.current = next;
                                        // Deactivate point lasso if activating freehand
                                        if (next) {
                                            setLassoMode(false);
                                            lassoModeRef.current = false;
                                        }
                                        clearLasso();
                                    }}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                        freehandMode
                                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                                            : 'text-slate-300 hover:bg-slate-700 border border-slate-600'
                                    }`}
                                    title="Lazo libre — dibuja el área arrastrando el mouse"
                                >
                                    <PenLine size={14} />
                                    Libre
                                </button>

                                {/* D-pad: only when lasso is closed */}
                                {lassoFinished && (
                                    <>
                                        <div className="w-px h-6 bg-slate-600" />
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-slate-400">Mover:</span>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 26px)', gridTemplateRows: 'repeat(3, 26px)', gap: '2px' }}>
                                                <span />
                                                <button
                                                    onMouseDown={() => { applyLassoWarp(0, -Math.max(1, warpIntensity * 5)); saveHistory(); }}
                                                    className="flex items-center justify-center rounded bg-slate-700 hover:bg-blue-600 active:bg-blue-700 text-white transition-colors"
                                                    title="Mover arriba (↑)"
                                                ><ArrowUp size={13} /></button>
                                                <span />
                                                <button
                                                    onMouseDown={() => { applyLassoWarp(-Math.max(1, warpIntensity * 5), 0); saveHistory(); }}
                                                    className="flex items-center justify-center rounded bg-slate-700 hover:bg-blue-600 active:bg-blue-700 text-white transition-colors"
                                                    title="Mover izquierda (←)"
                                                ><ArrowLeft size={13} /></button>
                                                <button
                                                    onMouseDown={() => clearLasso()}
                                                    className="flex items-center justify-center rounded bg-red-500/70 hover:bg-red-500 active:bg-red-600 text-white text-xs font-bold transition-colors"
                                                    title="Limpiar lazo (Escape)"
                                                >✕</button>
                                                <button
                                                    onMouseDown={() => { applyLassoWarp(Math.max(1, warpIntensity * 5), 0); saveHistory(); }}
                                                    className="flex items-center justify-center rounded bg-slate-700 hover:bg-blue-600 active:bg-blue-700 text-white transition-colors"
                                                    title="Mover derecha (→)"
                                                ><ArrowRight size={13} /></button>
                                                <span />
                                                <button
                                                    onMouseDown={() => { applyLassoWarp(0, Math.max(1, warpIntensity * 5)); saveHistory(); }}
                                                    className="flex items-center justify-center rounded bg-slate-700 hover:bg-blue-600 active:bg-blue-700 text-white transition-colors"
                                                    title="Mover abajo (↓)"
                                                ><ArrowDown size={13} /></button>
                                                <span />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                        <Save size={18} />
                        Guardar
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300"
                        title="Cancelar"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Editor Container — sistema de capas superpuestas */}
            <div
                className="flex-1 bg-slate-800 relative overflow-hidden"
                ref={containerRef}
            >
                {/*
                  * CAPA BASE (z-index: 1) — PixiJS: renderiza la imagen original/deformada.
                  * pointer-events: auto solo cuando meshWarpActive=true (gestionado por useEffect).
                  */}
                <div
                    ref={pixiContainerRef}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 1,
                        pointerEvents: 'none' /* el useEffect lo togglea dinámicamente */
                    }}
                />

                {/*
                  * CAPA SUPERIOR (z-index: 2) — Fabric.js: anotaciones y censura.
                  * background: transparent para que la capa Pixi sea visible debajo.
                  * pointer-events: none cuando meshWarpActive=true (gestionado por useEffect).
                  */}
                <canvas
                    ref={canvasRef}
                    style={{ position: 'relative', zIndex: 2 }}
                />

                {/*
                  * CAPA LAZO (z-index: 3) — SVG overlay: dibuja el polígono de selección.
                  * Activo para lazo por puntos (lassoMode) y lazo libre (freehandMode).
                  */}
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
                        // Point lasso events
                        onClick={lassoMode ? handleLassoClick : undefined}
                        onDoubleClick={lassoMode ? handleLassoDoubleClick : undefined}
                        // Freehand lasso events
                        onMouseDown={freehandMode ? handleFreehandMouseDown : undefined}
                        onMouseUp={freehandMode ? handleFreehandMouseUp : undefined}
                        // Shared move: preview line for point lasso / path tracking for freehand
                        onMouseMove={(e) => {
                            if (freehandMode) handleFreehandMouseMove(e);
                            else if (lassoMode) handleLassoMouseMove(e);
                        }}
                    >
                        {/* Filled polygon when lasso is closed (shared by both modes) */}
                        {lassoFinished && lassoPoints.length >= 3 && (
                            <polygon
                                points={lassoPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                fill={freehandMode ? 'rgba(139,92,246,0.12)' : 'rgba(59,130,246,0.12)'}
                                stroke={freehandMode ? '#8b5cf6' : '#3b82f6'}
                                strokeWidth="1.5"
                                strokeDasharray="6,3"
                            />
                        )}

                        {/* Freehand path in progress (continuous polyline, violet) */}
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

                        {/* Point lasso: polyline during construction */}
                        {lassoMode && !lassoFinished && lassoPoints.length >= 2 && (
                            <polyline
                                points={lassoPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="1.5"
                                strokeDasharray="6,3"
                            />
                        )}

                        {/* Point lasso: live preview line from last point to cursor */}
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

                        {/* Freehand: start dot and end-dot only */}
                        {freehandMode && lassoPoints.length >= 1 && !lassoFinished && (
                            <circle cx={lassoPoints[0].x} cy={lassoPoints[0].y} r={5} fill="#8b5cf6" stroke="white" strokeWidth="1.5" />
                        )}

                        {/* Point lasso: vertex dots with close indicator */}
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

        </div>
    );
}
