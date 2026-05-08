import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { fabric } from 'fabric';

const FabricLayer = forwardRef(({ 
    activeTool, 
    setActiveTool,
    zoom = 1,
    color, 
    brushSize, 
    meshWarpActive, 
    onSaveHistory, 
    takePixiSnapshot 
}, ref) => {
    const canvasRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const zoomRef = useRef(zoom);

    useEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);
    
    // State for shape drawing
    const drawingState = useRef({
        isDrawing: false,
        shape: null,
        startX: 0,
        startY: 0,
        textLabel: null
    });

    // ── Imperative API ────────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
        getCanvasJSON: (propertiesToInclude = []) => {
            return fabricCanvas ? fabricCanvas.toJSON(propertiesToInclude) : null;
        },
        loadCanvasJSON: (json, callback) => {
            if (fabricCanvas && json) {
                fabricCanvas.loadFromJSON(json, () => {
                    fabricCanvas.renderAll();
                    callback?.();
                });
            }
        },
        deleteSelected: () => {
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
                fabricCanvas.renderAll();
            }
        },
        getCanvas: () => fabricCanvas
    }));

    // ── Initialization ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!canvasRef.current) return;

        const container = canvasRef.current.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width,
            height,
            selection: true,
            preserveObjectStacking: true,
            backgroundColor: 'transparent',
        });

        if (canvas.wrapperEl) {
            canvas.wrapperEl.style.position = 'absolute';
            canvas.wrapperEl.style.top = '0';
            canvas.wrapperEl.style.left = '0';
            canvas.wrapperEl.style.zIndex = '2';
            canvas.wrapperEl.style.pointerEvents = meshWarpActive ? 'none' : 'auto';
        }

        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = brushSize;

        // Override getPointer to account for external CSS zoom/scale
        const originalGetPointer = canvas.getPointer;
        canvas.getPointer = function(e, ignoreScroll) {
            const rect = this.getElement().getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) / zoomRef.current,
                y: (e.clientY - rect.top) / zoomRef.current
            };
        };

        setFabricCanvas(canvas);

        return () => {
            canvas.dispose();
        };
    }, []);

    // Toggle pointer events
    useEffect(() => {
        if (fabricCanvas?.wrapperEl) {
            fabricCanvas.wrapperEl.style.pointerEvents = meshWarpActive ? 'none' : 'auto';
        }
    }, [meshWarpActive, fabricCanvas]);

    // Update tools configuration
    useEffect(() => {
        if (!fabricCanvas) return;

        fabricCanvas.isDrawingMode = (activeTool === 'draw');
        fabricCanvas.freeDrawingBrush.color = color;
        fabricCanvas.freeDrawingBrush.width = brushSize;

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

    // ── Drawing Handlers ──────────────────────────────────────────────────────
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
                onSaveHistory?.();
                drawingState.current.isDrawing = false;
                setActiveTool?.('select');
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
                    shape = new fabric.Circle({ ...strokeOptions, left: pointer.x, top: pointer.y, radius: 1 });
                    break;
                case 'square':
                    shape = new fabric.Rect({ ...strokeOptions, left: pointer.x, top: pointer.y, width: 1, height: 1 });
                    break;
                case 'arrow':
                    shape = new fabric.Path('M 0 0 L 0 0', { ...strokeOptions, fill: 'transparent' });
                    break;
                case 'censorship':
                    shape = new fabric.Rect({
                        ...strokeOptions,
                        fill: 'rgba(255, 255, 255, 0.1)',
                        stroke: 'transparent',
                        left: pointer.x,
                        top: pointer.y,
                        width: 1,
                        height: 1,
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
            const { startX, startY } = drawingState.current;

            if (!shape) return;

            if (activeTool === 'line') {
                shape.set({ x2: pointer.x, y2: pointer.y });
                const textLabel = drawingState.current.textLabel;
                if (textLabel) {
                    const dist = Math.hypot(pointer.x - startX, pointer.y - startY);
                    const mm = (dist * 0.264583).toFixed(1);
                    textLabel.set({
                        text: `${mm} mm`,
                        left: (startX + pointer.x) / 2,
                        top: (startY + pointer.y) / 2 - 20,
                    });
                }
            } else if (activeTool === 'circle') {
                shape.set({ radius: Math.hypot(pointer.x - startX, pointer.y - startY) });
            } else if (activeTool === 'square' || activeTool === 'censorship') {
                shape.set({
                    width: Math.abs(pointer.x - startX),
                    height: Math.abs(pointer.y - startY),
                    left: startX + (pointer.x - startX) / 2,
                    top: startY + (pointer.y - startY) / 2
                });
            } else if (activeTool === 'arrow') {
                const dx = pointer.x - startX, dy = pointer.y - startY;
                const angle = Math.atan2(dy, dx), headlen = 15;
                const pathData = [
                    'M', startX, startY,
                    'L', pointer.x, pointer.y,
                    'L', pointer.x - headlen * Math.cos(angle - Math.PI / 6), pointer.y - headlen * Math.sin(angle - Math.PI / 6),
                    'M', pointer.x, pointer.y,
                    'L', pointer.x - headlen * Math.cos(angle + Math.PI / 6), pointer.y - headlen * Math.sin(angle + Math.PI / 6)
                ].join(' ');
                shape.set({ path: new fabric.Path(pathData).path });
                const dim = shape._calcDimensions();
                shape.set({
                    left: startX + dx / 2,
                    top: startY + dy / 2,
                    pathOffset: { x: dim.left + dim.width / 2, y: dim.top + dim.height / 2 }
                });
            }
            fabricCanvas.renderAll();
        };

        const handleMouseUp = async () => {
            if (drawingState.current.isDrawing) {
                const tool = activeTool;
                drawingState.current.isDrawing = false;

                if (tool === 'censorship' && drawingState.current.shape) {
                    const guideRect = drawingState.current.shape;
                    const { width, height } = guideRect;

                    if (width > 5 && height > 5 && takePixiSnapshot) {
                        const snapshotURL = await takePixiSnapshot();
                        if (snapshotURL) {
                            const lensRect = new fabric.Rect({
                                left: guideRect.left, top: guideRect.top,
                                width, height,
                                fill: 'transparent', stroke: 'transparent', strokeWidth: 0,
                                originX: 'center', originY: 'center',
                                cornerColor: '#3b82f6', cornerSize: 8, transparentCorners: false,
                                isLensController: true
                            });

                            const clipMask = new fabric.Rect({
                                left: guideRect.left, top: guideRect.top,
                                width, height,
                                fill: 'white', originX: 'center', originY: 'center',
                                absolutePositioned: true
                            });

                            fabric.Image.fromURL(snapshotURL, (pixiImg) => {
                                // Assume Pixi is centered if canvas sizes differ, but for simplicity we align relative to current view
                                // In the actual app, Pixi and Fabric share the same coordinate space within the viewport
                                pixiImg.set({
                                    left: 0, top: 0,
                                    selectable: false, evented: false,
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
                                onSaveHistory?.();
                            });
                        }
                    }
                    fabricCanvas.remove(guideRect);
                    drawingState.current.shape = null;
                    return;
                }

                if (drawingState.current.shape) {
                    drawingState.current.shape.set({ selectable: true, evented: true });
                }
                if (drawingState.current.textLabel) {
                    drawingState.current.textLabel.set({ selectable: true, evented: true });
                    if (activeTool === 'line') {
                        const group = new fabric.Group([drawingState.current.shape, drawingState.current.textLabel], { selectable: true });
                        fabricCanvas.remove(drawingState.current.shape, drawingState.current.textLabel);
                        fabricCanvas.add(group);
                    }
                }

                drawingState.current.shape = null;
                drawingState.current.textLabel = null;
                onSaveHistory?.();
            }
        };

        const handleObjectUpdate = (e) => {
            const obj = e.target;
            if (obj && obj.isLensController && obj.pixelatedClone) {
                const mask = obj.pixelatedClone.clipPath;
                if (mask) {
                    mask.set({
                        left: obj.left, top: obj.top,
                        scaleX: obj.scaleX, scaleY: obj.scaleY,
                        width: obj.width, height: obj.height,
                        angle: obj.angle, skewX: obj.skewX, skewY: obj.skewY,
                        originX: obj.originX, originY: obj.originY
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
        fabricCanvas.on('object:modified', onSaveHistory);

        return () => {
            fabricCanvas.off('mouse:down', handleMouseDown);
            fabricCanvas.off('mouse:move', handleMouseMove);
            fabricCanvas.off('mouse:up', handleMouseUp);
            fabricCanvas.off('object:moving', handleObjectUpdate);
            fabricCanvas.off('object:scaling', handleObjectUpdate);
            fabricCanvas.off('object:rotating', handleObjectUpdate);
            fabricCanvas.off('object:modified', onSaveHistory);
        };
    }, [fabricCanvas, activeTool, color, brushSize, onSaveHistory, takePixiSnapshot]);

    return (
        <canvas
            ref={canvasRef}
            style={{ position: 'relative', zIndex: 2 }}
        />
    );
});

export default FabricLayer;
