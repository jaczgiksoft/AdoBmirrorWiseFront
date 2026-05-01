import React, { useEffect, useRef, useState } from 'react';
import { X, Square, Circle, Minus, MousePointer2, Pen, Type, Undo2, ArrowUpRight, Trash2, Download, Save } from 'lucide-react';
import { fabric } from 'fabric';
import * as PIXI from 'pixi.js';

export default function ImageEditorModal({ imageSrc, imageName, onClose, onSave }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [activeTool, setActiveTool] = useState('select'); // select, draw, line, arrow, circle, square, text
    const [color, setColor] = useState('#ff0000');
    const [brushSize, setBrushSize] = useState(3);

    // Mesh Warp state
    const pixiContainerRef = useRef(null);
    const pixiAppRef = useRef(null);
    const [meshWarpActive, setMeshWarpActive] = useState(false);
    const [warpRadius, setWarpRadius] = useState(50);
    const [warpIntensity, setWarpIntensity] = useState(0.5);
    const warpParams = useRef({ radius: 50, intensity: 0.5 });

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

    // Inicializar Canvas
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
        });

        // Configuración de pincel por defecto
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = brushSize;

        // Cargar imagen de fondo
        fabric.Image.fromURL(imageSrc, (img) => {
            // Escalar imagen para que encaje en el canvas
            const scale = Math.min(width / img.width, height / img.height);

            img.set({
                scaleX: scale,
                scaleY: scale,
                originX: 'center',
                originY: 'center',
                left: width / 2,
                top: height / 2,
            });

            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        }, { crossOrigin: 'anonymous' });

        setFabricCanvas(canvas);

        const handleResize = () => {
            if (container && canvas) {
                // Aquí se podría implementar una lógica de redimensionamiento más compleja
                // Por ahora, mantenemos el tamaño inicial
            }
        };

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
            } else if (activeTool === 'square') {
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
                drawingState.current.isDrawing = false;

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

                // Volver a la herramienta de selección después de dibujar una forma (opcional, ayuda al UX)
                if (activeTool !== 'draw') {
                    setActiveTool('select');
                }
            }
        };

        fabricCanvas.on('mouse:down', handleMouseDown);
        fabricCanvas.on('mouse:move', handleMouseMove);
        fabricCanvas.on('mouse:up', handleMouseUp);

        return () => {
            fabricCanvas.off('mouse:down', handleMouseDown);
            fabricCanvas.off('mouse:move', handleMouseMove);
            fabricCanvas.off('mouse:up', handleMouseUp);
        };
    }, [fabricCanvas, activeTool, color, brushSize]);

    // Handle Keyboard events (Delete)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                deleteSelected();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fabricCanvas, meshWarpActive]);

    // Mesh Warp Logic
    useEffect(() => {
        if (!fabricCanvas || !pixiContainerRef.current) return;

        if (meshWarpActive) {
            // Aplanar Fabric
            fabricCanvas.discardActiveObject().renderAll();

            // Si no hay imagen de fondo, no podemos exportar bien
            if (!fabricCanvas.backgroundImage) return;

            const bgImage = fabricCanvas.backgroundImage;
            // Guardamos el estado actual como imagen
            const dataURL = fabricCanvas.toDataURL({
                format: 'jpeg',
                quality: 1.0,
                left: bgImage.left - bgImage.getScaledWidth() / 2,
                top: bgImage.top - bgImage.getScaledHeight() / 2,
                width: bgImage.getScaledWidth(),
                height: bgImage.getScaledHeight()
            });

            // Limpiar canvas de fabric (anotaciones se aplanan en la imagen)
            fabricCanvas.clear();

            const initPixi = async () => {
                const app = new PIXI.Application();
                await app.init({
                    width: bgImage.getScaledWidth(),
                    height: bgImage.getScaledHeight(),
                    backgroundAlpha: 0
                });

                // Centrar el canvas de PixiJS como la imagen original
                app.canvas.style.position = 'absolute';
                app.canvas.style.left = `${bgImage.left - bgImage.getScaledWidth() / 2}px`;
                app.canvas.style.top = `${bgImage.top - bgImage.getScaledHeight() / 2}px`;

                pixiContainerRef.current.appendChild(app.canvas);
                pixiAppRef.current = app;

                const texture = await PIXI.Assets.load(dataURL);
                const rows = 20;
                const cols = 20;
                const width = app.screen.width;
                const height = app.screen.height;

                const vertexCount = (rows + 1) * (cols + 1);
                const vertices = new Float32Array(vertexCount * 2);
                const uvs = new Float32Array(vertexCount * 2);
                const original = new Float32Array(vertexCount * 2);

                const indices = [];

                let i = 0;
                for (let y = 0; y <= rows; y++) {
                    for (let x = 0; x <= cols; x++) {
                        const px = (x / cols) * width;
                        const py = (y / rows) * height;

                        vertices[i * 2] = px;
                        vertices[i * 2 + 1] = py;
                        original[i * 2] = px;
                        original[i * 2 + 1] = py;
                        uvs[i * 2] = x / cols;
                        uvs[i * 2 + 1] = y / rows;
                        i++;
                    }
                }

                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        const idx = y * (cols + 1) + x;
                        const a = idx;
                        const b = idx + 1;
                        const c = idx + cols + 1;
                        const d = idx + cols + 2;

                        indices.push(a, b, c);
                        indices.push(b, d, c);
                    }
                }

                const geometry = new PIXI.MeshGeometry({
                    positions: vertices,
                    uvs: uvs,
                    indices: new Uint32Array(indices)
                });

                const shader = PIXI.Shader.from({
                    gl: {
                        vertex: `
                    precision mediump float;
                    attribute vec2 aPosition;
                    attribute vec2 aUV;
                    varying vec2 vUV;
                    void main() {
                      vec2 position = aPosition / vec2(${app.screen.width.toFixed(1)}, ${app.screen.height.toFixed(1)});
                      gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
                      gl_Position.y *= -1.0; 
                      vUV = aUV;
                    }
                  `,
                        fragment: `
                    precision mediump float;
                    varying vec2 vUV;
                    uniform sampler2D uSampler;
                    void main() {
                      gl_FragColor = texture2D(uSampler, vUV);
                    }
                  `
                    },
                    resources: {
                        uSampler: texture.source
                    }
                });

                const mesh = new PIXI.Mesh({ geometry, shader });
                mesh.position.set(0, 0);
                mesh.eventMode = 'dynamic';
                mesh.cursor = 'pointer';

                app.stage.addChild(mesh);

                let isDragging = false;
                let startX = 0;
                let startY = 0;

                app.view.addEventListener('pointerdown', (event) => {
                    const bounds = app.view.getBoundingClientRect();
                    startX = event.clientX - bounds.left;
                    startY = event.clientY - bounds.top;
                    isDragging = true;
                });

                app.view.addEventListener('pointerup', () => {
                    isDragging = false;
                });

                app.view.addEventListener('pointerleave', () => {
                    isDragging = false;
                });

                app.view.addEventListener('pointermove', (event) => {
                    if (!isDragging) return;

                    const bounds = app.view.getBoundingClientRect();
                    const currentX = event.clientX - bounds.left;
                    const currentY = event.clientY - bounds.top;

                    const dx = currentX - startX;
                    const dy = currentY - startY;

                    const p = warpParams.current;
                    const fuerzaX = dx * p.intensity * 0.2;
                    const fuerzaY = dy * p.intensity * 0.2;

                    const verts = geometry.buffers[0].data;
                    let modified = false;

                    for (let i = 0; i < verts.length; i += 2) {
                        const vx = verts[i];
                        const vy = verts[i + 1];
                        const dist = Math.hypot(vx - startX, vy - startY);

                        if (dist < p.radius) {
                            const peso = (p.radius - dist) / p.radius;
                            verts[i] += fuerzaX * peso;
                            verts[i + 1] += fuerzaY * peso;
                            modified = true;
                        }
                    }

                    if (modified) geometry.buffers[0].update();

                    startX = currentX;
                    startY = currentY;
                });
            };

            initPixi();

        } else if (!meshWarpActive && pixiAppRef.current) {
            // Exportar PixiJS a Fabric
            const app = pixiAppRef.current;
            app.renderer.extract.base64(app.stage, 'image/jpeg', 1.0).then((pixiDataURL) => {
                // Corregir inversión vertical antes de volver a Fabric
                const imgFlip = new Image();
                imgFlip.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = imgFlip.width;
                    canvas.height = imgFlip.height;
                    const ctx = canvas.getContext('2d');
                    ctx.translate(0, imgFlip.height);
                    ctx.scale(1, -1);
                    ctx.drawImage(imgFlip, 0, 0);
                    const correctedDataURL = canvas.toDataURL('image/jpeg', 1.0);

                    fabric.Image.fromURL(correctedDataURL, (img) => {
                        const width = containerRef.current.clientWidth;
                        const height = containerRef.current.clientHeight;

                        // Mantener la escala original de la imagen
                        img.set({
                            scaleX: 1,
                            scaleY: 1,
                            originX: 'center',
                            originY: 'center',
                            left: width / 2,
                            top: height / 2,
                        });

                        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
                    });
                };
                imgFlip.src = pixiDataURL;

                // Cleanup PixiJS
                app.destroy(true, { children: true, texture: true, baseTexture: true });
                pixiAppRef.current = null;
                if (pixiContainerRef.current) {
                    pixiContainerRef.current.innerHTML = '';
                }
            });
        }

        return () => {
            // Cleanup on unmount or deps change if active
            if (pixiAppRef.current && meshWarpActive === false) {
                pixiAppRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
                pixiAppRef.current = null;
            }
        };
    }, [meshWarpActive, fabricCanvas]);

    const deleteSelected = () => {
        if (!fabricCanvas) return;
        const activeObjects = fabricCanvas.getActiveObjects();
        if (activeObjects.length) {
            fabricCanvas.discardActiveObject();
            activeObjects.forEach(function (object) {
                fabricCanvas.remove(object);
            });
        }
    };

    const handleSave = async () => {
        if (!fabricCanvas) return;

        let dataURL;

        // Si el mesh está activo, exportamos desde PixiJS porque el canvas de Fabric está vacío/limpio
        if (meshWarpActive && pixiAppRef.current) {
            const app = pixiAppRef.current;
            // Exportamos el stage de Pixi que contiene la imagen deformada
            const pixiDataURL = await app.renderer.extract.base64(app.stage, 'image/jpeg', 0.9);

            // Corregir inversión vertical (PixiJS WebGL flip)
            dataURL = await new Promise(resolve => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.translate(0, img.height);
                    ctx.scale(1, -1);
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                };
                img.src = pixiDataURL;
            });
        } else {
            // Deseleccionar todo para que no aparezcan los controles en la imagen final
            fabricCanvas.discardActiveObject().renderAll();

            // Extraer como dataURL (solo el area de la imagen de fondo si es posible)
            const bgImage = fabricCanvas.backgroundImage;

            if (bgImage) {
                // Recortar la exportación al área de la imagen
                dataURL = fabricCanvas.toDataURL({
                    format: 'jpeg',
                    quality: 0.9,
                    left: bgImage.left - bgImage.getScaledWidth() / 2,
                    top: bgImage.top - bgImage.getScaledHeight() / 2,
                    width: bgImage.getScaledWidth(),
                    height: bgImage.getScaledHeight()
                });
            } else {
                dataURL = fabricCanvas.toDataURL({ format: 'jpeg', quality: 0.9 });
            }
        }

        if (!dataURL) return;

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
                                onClick={deleteSelected}
                                disabled={meshWarpActive}
                                className={`p-2 rounded-md transition-colors ${meshWarpActive ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-red-500/20 hover:text-red-500'}`}
                                title="Eliminar elemento seleccionado (Supr)"
                            >
                                <Trash2 size={20} />
                            </button>

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

            {/* Editor Container */}
            <div
                className="flex-1 bg-slate-800 relative flex items-center justify-center overflow-hidden"
                ref={containerRef}
            >
                {/* Canvas de Fabric.js */}
                <canvas ref={canvasRef} style={{ display: meshWarpActive ? 'none' : 'block' }} />

                {/* Container para PixiJS */}
                <div
                    ref={pixiContainerRef}
                    className="absolute inset-0 pointer-events-auto"
                    style={{
                        display: meshWarpActive ? 'block' : 'none',
                        zIndex: 10
                    }}
                />
            </div>
        </div>
    );
}
