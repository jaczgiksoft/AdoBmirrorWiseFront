import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Square, Circle, Minus, MousePointer2, Pen, Type, Undo2, Redo2, ArrowUpRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, Save, EyeOff, Lasso, PenLine } from 'lucide-react';
import PixiLayer from './PixiLayer';
import FabricLayer from './FabricLayer';

export default function ImageEditorModal({ imageSrc, imageName, onClose, onSave }) {
    const containerRef = useRef(null);
    const fabricLayerRef = useRef(null);
    const pixiLayerRef = useRef(null);

    // Global state
    const [activeTool, setActiveTool] = useState('select');
    const [color, setColor] = useState('#ff0000');
    const [brushSize, setBrushSize] = useState(3);
    const [meshWarpActive, setMeshWarpActive] = useState(false);
    
    // UI states for mesh warp sub-modes
    const [lassoMode, setLassoMode] = useState(false);
    const [freehandMode, setFreehandMode] = useState(false);
    const [lassoFinished, setLassoFinished] = useState(false);
    const [warpRadius, setWarpRadius] = useState(50);
    const [warpIntensity, setWarpIntensity] = useState(0.5);

    // History state
    const historyRef = useRef([]);
    const historyIndexRef = useRef(-1);
    const isRestoring = useRef(false);
    const [, forceUpdate] = useState({});

    // Viewport Zoom & Pan
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });

    // ── History Management ──────────────────────────────────────────────────
    const saveHistory = useCallback(() => {
        if (!fabricLayerRef.current || !pixiLayerRef.current || isRestoring.current) return;

        const currentState = {
            fabric: fabricLayerRef.current.getCanvasJSON(['isLensController', 'pixelatedClone']),
            pixi: pixiLayerRef.current.getGeometryData()
        };

        const newHistory = [...historyRef.current.slice(0, historyIndexRef.current + 1), currentState];
        if (newHistory.length > 10) newHistory.shift();

        historyRef.current = newHistory;
        historyIndexRef.current = newHistory.length - 1;
        forceUpdate({});
    }, []);

    const undo = useCallback(() => {
        if (historyIndexRef.current <= 0 || isRestoring.current) return;

        isRestoring.current = true;
        historyIndexRef.current--;
        const state = historyRef.current[historyIndexRef.current];

        fabricLayerRef.current.loadCanvasJSON(state.fabric, () => {
            pixiLayerRef.current.setGeometryData(state.pixi);
            isRestoring.current = false;
            forceUpdate({});
        });
    }, []);

    const redo = useCallback(() => {
        if (historyIndexRef.current >= historyRef.current.length - 1 || isRestoring.current) return;

        isRestoring.current = true;
        historyIndexRef.current++;
        const state = historyRef.current[historyIndexRef.current];

        fabricLayerRef.current.loadCanvasJSON(state.fabric, () => {
            pixiLayerRef.current.setGeometryData(state.pixi);
            isRestoring.current = false;
            forceUpdate({});
        });
    }, []);

    // ── Handlers ────────────────────────────────────────────────────────────
    const takePixiSnapshot = useCallback(async () => {
        return await pixiLayerRef.current?.takeSnapshot();
    }, []);

    const handleSave = async () => {
        if (!fabricLayerRef.current || !pixiLayerRef.current) return;

        const fabricCanvas = fabricLayerRef.current.getCanvas();
        const pixiApp = pixiLayerRef.current.getApp();
        if (!fabricCanvas || !pixiApp) return;

        fabricCanvas.discardActiveObject().renderAll();

        // 1. Export PixiJS (image warp)
        const pixiDataURL = await pixiLayerRef.current.takeSnapshot();

        // 2. Export Fabric (annotations)
        const fabricDataURL = fabricCanvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });

        // 3. Composite
        const dataURL = await new Promise(resolve => {
            const bgImg = new Image();
            bgImg.onload = () => {
                const c = document.createElement('canvas');
                c.width = pixiApp.screen.width;
                c.height = pixiApp.screen.height;
                const ctx = c.getContext('2d');
                ctx.drawImage(bgImg, 0, 0, c.width, c.height);

                const fgImg = new Image();
                fgImg.onload = () => {
                    const offsetX = (fabricCanvas.width - c.width) / 2;
                    const offsetY = (fabricCanvas.height - c.height) / 2;
                    ctx.drawImage(fgImg, -offsetX, -offsetY);
                    resolve(c.toDataURL('image/jpeg', 0.9));
                };
                fgImg.src = fabricDataURL;
            };
            bgImg.src = pixiDataURL;
        });

        const res = await fetch(dataURL);
        const blob = await res.blob();
        onSave(blob);
    };

    // ── Viewport Events ─────────────────────────────────────────────────────
    const handleWheel = useCallback((e) => {
        if (!containerRef.current) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.min(Math.max(zoom * delta, 0.5), 8);
        if (newZoom === zoom) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const newOffsetX = mouseX - (mouseX - offset.x) * (newZoom / zoom);
        const newOffsetY = mouseY - (mouseY - offset.y) * (newZoom / zoom);
        
        setZoom(newZoom);
        setOffset({ x: newOffsetX, y: newOffsetY });
    }, [zoom, offset]);

    const handleContainerMouseDown = (e) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsPanning(true);
            panStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
            e.preventDefault();
        }
    };

    const handleContainerMouseMove = useCallback((e) => {
        if (isPanning) {
            setOffset({
                x: e.clientX - panStartRef.current.x,
                y: e.clientY - panStartRef.current.y
            });
        }
    }, [isPanning]);

    const handleContainerMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const onWheel = (e) => handleWheel(e);
        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    }, [handleWheel]);

    // Initial history capture
    useEffect(() => {
        const timer = setTimeout(() => saveHistory(), 1000);
        return () => clearTimeout(timer);
    }, [imageSrc]);

    // Keyboard events
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                fabricLayerRef.current?.deleteSelected();
                saveHistory();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && lassoFinished) {
                e.preventDefault();
                const step = Math.max(1, warpIntensity * 5);
                const dirs = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] };
                const [dx, dy] = dirs[e.key];
                pixiLayerRef.current?.applyLassoWarp(dx, dy);
                saveHistory();
            } else if (e.key === 'Escape') {
                pixiLayerRef.current?.clearLasso();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, saveHistory, lassoFinished, warpIntensity]);

    // ── UI Components ───────────────────────────────────────────────────────
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

                {/* Herramientas */}
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
                            <div className="flex items-center gap-1">
                                {colors.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-white' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                            <div className="w-px h-6 bg-slate-600 mx-2" />
                            <button
                                onClick={() => { fabricLayerRef.current?.deleteSelected(); saveHistory(); }}
                                className="p-2 rounded-md text-slate-400 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                                title="Eliminar seleccionado (Supr)"
                            >
                                <Trash2 size={20} />
                            </button>
                            <div className="w-px h-6 bg-slate-600 mx-2" />
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={undo}
                                    disabled={historyIndexRef.current <= 0}
                                    className={`p-2 rounded-md transition-colors ${historyIndexRef.current <= 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                                >
                                    <Undo2 size={20} />
                                </button>
                                <button
                                    onClick={redo}
                                    disabled={historyIndexRef.current >= historyRef.current.length - 1}
                                    className={`p-2 rounded-md transition-colors ${historyIndexRef.current >= historyRef.current.length - 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                                >
                                    <Redo2 size={20} />
                                </button>
                            </div>
                            <div className="w-px h-6 bg-slate-600 mx-2" />
                        </>
                    )}

                    {/* Mesh Warp Controls */}
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={meshWarpActive}
                                onChange={(e) => {
                                    setMeshWarpActive(e.target.checked);
                                    if (!e.target.checked) {
                                        setLassoMode(false);
                                        setFreehandMode(false);
                                        pixiLayerRef.current?.clearLasso();
                                    }
                                }}
                                className="rounded bg-slate-700 border-slate-600 text-primary"
                            />
                            <span>Alteracion</span>
                        </label>

                        {meshWarpActive && (
                            <div className="flex items-center gap-4 ml-2 pl-2 border-l border-slate-600">
                                <label className="flex items-center gap-2 text-xs text-slate-400">
                                    Intensidad
                                    <input type="range" min="0" max="2" step="0.01" value={warpIntensity} onChange={(e) => setWarpIntensity(parseFloat(e.target.value))} className="w-20" />
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-400">
                                    Radio
                                    <input type="range" min="10" max="200" step="1" value={warpRadius} onChange={(e) => setWarpRadius(parseFloat(e.target.value))} className="w-20" />
                                </label>
                                <div className="w-px h-6 bg-slate-600" />
                                <div className="flex items-center bg-slate-800/50 rounded-md border border-slate-600 p-0.5">
                                    <button onClick={undo} disabled={historyIndexRef.current <= 0} className="p-1.5 rounded transition-colors text-slate-300 hover:bg-slate-700 disabled:text-slate-600"><Undo2 size={16} /></button>
                                    <button onClick={redo} disabled={historyIndexRef.current >= historyRef.current.length - 1} className="p-1.5 rounded transition-colors text-slate-300 hover:bg-slate-700 disabled:text-slate-600"><Redo2 size={16} /></button>
                                </div>
                                <div className="w-px h-6 bg-slate-600" />
                                <button
                                    onClick={() => {
                                        const next = !lassoMode;
                                        setLassoMode(next);
                                        if (next) setFreehandMode(false);
                                        pixiLayerRef.current?.clearLasso();
                                    }}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${lassoMode ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 border border-slate-600'}`}
                                >
                                    <Lasso size={14} /> Lazo
                                </button>
                                <button
                                    onClick={() => {
                                        const next = !freehandMode;
                                        setFreehandMode(next);
                                        if (next) setLassoMode(false);
                                        pixiLayerRef.current?.clearLasso();
                                    }}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${freehandMode ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-700 border border-slate-600'}`}
                                >
                                    <PenLine size={14} /> Libre
                                </button>

                                {lassoFinished && (
                                    <div className="flex items-center gap-1.5 ml-2">
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 26px)', gap: '2px' }}>
                                            <span />
                                            <button onMouseDown={() => { pixiLayerRef.current?.applyLassoWarp(0, -Math.max(1, warpIntensity * 5)); saveHistory(); }} className="rounded bg-slate-700 hover:bg-blue-600 text-white flex items-center justify-center"><ArrowUp size={13} /></button>
                                            <span />
                                            <button onMouseDown={() => { pixiLayerRef.current?.applyLassoWarp(-Math.max(1, warpIntensity * 5), 0); saveHistory(); }} className="rounded bg-slate-700 hover:bg-blue-600 text-white flex items-center justify-center"><ArrowLeft size={13} /></button>
                                            <button onMouseDown={() => pixiLayerRef.current?.clearLasso()} className="rounded bg-red-500/70 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center">✕</button>
                                            <button onMouseDown={() => { pixiLayerRef.current?.applyLassoWarp(Math.max(1, warpIntensity * 5), 0); saveHistory(); }} className="rounded bg-slate-700 hover:bg-blue-600 text-white flex items-center justify-center"><ArrowRight size={13} /></button>
                                            <span />
                                            <button onMouseDown={() => { pixiLayerRef.current?.applyLassoWarp(0, Math.max(1, warpIntensity * 5)); saveHistory(); }} className="rounded bg-slate-700 hover:bg-blue-600 text-white flex items-center justify-center"><ArrowDown size={13} /></button>
                                            <span />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium text-sm"><Save size={18} /> Guardar</button>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300"><X size={24} /></button>
                </div>
            </div>

            {/* Editor Canvas Container */}
            <div
                className="flex-1 bg-slate-800 relative overflow-hidden"
                ref={containerRef}
                onMouseDown={handleContainerMouseDown}
                onMouseMove={handleContainerMouseMove}
                onMouseUp={handleContainerMouseUp}
                onMouseLeave={handleContainerMouseUp}
                style={{ cursor: isPanning ? 'grabbing' : 'default' }}
            >
                <div 
                    id="viewport"
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                        width: '100%', height: '100%',
                        position: 'absolute', inset: 0,
                        willChange: 'transform'
                    }}
                >
                    <PixiLayer 
                        ref={pixiLayerRef}
                        imageSrc={imageSrc}
                        zoom={zoom}
                        meshWarpActive={meshWarpActive}
                        warpRadius={warpRadius}
                        warpIntensity={warpIntensity}
                        lassoMode={lassoMode}
                        freehandMode={freehandMode}
                        onSaveHistory={saveHistory}
                        onLassoFinishedChange={setLassoFinished}
                    />
                    <FabricLayer 
                        ref={fabricLayerRef}
                        zoom={zoom}
                        activeTool={activeTool}
                        setActiveTool={setActiveTool}
                        color={color}
                        brushSize={brushSize}
                        meshWarpActive={meshWarpActive}
                        onSaveHistory={saveHistory}
                        takePixiSnapshot={takePixiSnapshot}
                    />
                </div>
            </div>
        </div>
    );
}
