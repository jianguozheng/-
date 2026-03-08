import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Weight, RotateCcw, Eye, EyeOff, Lock, Unlock, Info, Settings2 } from 'lucide-react';

// --- Constants ---
const MAX_BALLS = 20;
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

export default function App() {
  // --- State ---
  const [windSpeed, setWindSpeed] = useState(0);
  const [ballCount, setBallCount] = useState(1);
  const [showEnergy, setShowEnergy] = useState(true);
  const [showConcl, setShowConcl] = useState(true);
  const [isEnergyRevealed, setIsEnergyRevealed] = useState(false);
  const [isConclRevealed, setIsConclRevealed] = useState(false);
  
  // Physics Refs (to avoid state lag in animation loop)
  const liftRef = useRef(0);
  const angleRef = useRef(0);
  const omegaRef = useRef(0);
  const [isInsufficient, setIsInsufficient] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cloudsRef = useRef<{ x: number; y: number; w: number; v: number }[]>([]);
  const hillsRef = useRef<{ x: number; y: number; w: number; h: number; c: string }[]>([]);

  // --- Initialization ---
  useEffect(() => {
    cloudsRef.current = Array.from({ length: 6 }, () => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT * 0.3,
      w: 120 + Math.random() * 150,
      v: 0.1 + Math.random() * 0.3
    }));

    hillsRef.current = [
      { x: 0, y: CANVAS_HEIGHT * 0.7, w: CANVAS_WIDTH * 1.5, h: CANVAS_HEIGHT * 0.3, c: '#1e3c42' },
      { x: CANVAS_WIDTH * 0.4, y: CANVAS_HEIGHT * 0.75, w: CANVAS_WIDTH * 1.2, h: CANVAS_HEIGHT * 0.25, c: '#2d4a53' }
    ];
  }, []);

  // --- Animation Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Realistic Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#1e3c72');
      skyGrad.addColorStop(0.7, '#2a5298');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      cloudsRef.current.forEach(c => {
        c.x += c.v * (windSpeed * 0.5 + 1);
        if (c.x > CANVAS_WIDTH) c.x = -c.w;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.w, c.w * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Hills
      hillsRef.current.forEach(h => {
        ctx.fillStyle = h.c;
        ctx.beginPath();
        ctx.moveTo(h.x - h.w / 2, CANVAS_HEIGHT);
        ctx.quadraticCurveTo(h.x, h.y, h.x + h.w / 2, CANVAS_HEIGHT);
        ctx.fill();
      });

      // 4. Grass
      ctx.fillStyle = '#1b3a1e';
      ctx.fillRect(0, CANVAS_HEIGHT * 0.85, CANVAS_WIDTH, CANVAS_HEIGHT * 0.15);

      // 5. Physics Logic
      const power = windSpeed * windSpeed * 0.8;
      const threshold = ballCount * 3.2;
      
      let targetOmega = 0;
      let liftV = 0;

      if (windSpeed > 0) {
        if (power > threshold) {
          targetOmega = (power - threshold) * 0.02 + 0.05;
          liftV = (power - threshold) * 0.22;
          setIsInsufficient(false);
        } else {
          targetOmega = power * 0.015;
          liftV = 0;
          setIsInsufficient(true);
        }
      } else {
        setIsInsufficient(false);
      }

      omegaRef.current += (targetOmega - omegaRef.current) * 0.1;
      angleRef.current += omegaRef.current;
      
      const maxLift = CANVAS_HEIGHT * 0.5;
      if (liftRef.current < maxLift) {
        liftRef.current = Math.min(maxLift, liftRef.current + liftV * 0.1);
      }

      // 6. Draw Mechanical Structure (Realistic 2D)
      const tX = CANVAS_WIDTH * 0.25, tY = CANVAS_HEIGHT * 0.4;
      const cX = CANVAS_WIDTH * 0.6, cY = CANVAS_HEIGHT * 0.2;
      const drumR = 15;

      // Tower & Crane Arm (Wood/Metal Texture)
      ctx.strokeStyle = '#3e2723'; // Dark wood
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tX, CANVAS_HEIGHT); ctx.lineTo(tX, tY); 
      ctx.moveTo(cX, CANVAS_HEIGHT); ctx.lineTo(cX, cY); 
      ctx.lineTo(cX + 120, cY);
      ctx.stroke();

      // Drum (at tower top)
      ctx.save();
      ctx.translate(tX, tY);
      ctx.rotate(angleRef.current);
      ctx.fillStyle = '#4e342e';
      ctx.strokeStyle = '#212121';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, drumR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-drumR, 0); ctx.lineTo(drumR, 0); ctx.stroke();
      ctx.restore();

      // Pulley (at crane arm end)
      const pX = cX + 120, pY = cY;
      ctx.fillStyle = '#424242';
      ctx.beginPath(); ctx.arc(pX, pY, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Rope
      const basketY = (CANVAS_HEIGHT - 150) - liftRef.current;
      ctx.strokeStyle = '#cfd8dc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tX, tY - drumR);
      ctx.lineTo(tX, cY - 12);
      ctx.lineTo(pX, pY - 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pX, pY + 12);
      ctx.lineTo(pX, basketY);
      ctx.stroke();

      // Turbine Blades (Realistic 2D)
      ctx.save();
      ctx.translate(tX, tY);
      ctx.rotate(angleRef.current);
      for (let i = 0; i < 3; i++) {
        ctx.rotate((Math.PI * 2) / 3);
        const grad = ctx.createLinearGradient(0, 0, 0, -140);
        grad.addColorStop(0, '#cfd8dc');
        grad.addColorStop(1, '#eceff1');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-24, -140); ctx.lineTo(24, -140); ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      ctx.restore();

      // Basket & Steel Balls
      const bW = 100, bH = 70, bX = pX - bW / 2;
      ctx.strokeStyle = '#795548';
      ctx.fillStyle = 'rgba(121, 85, 72, 0.2)';
      ctx.lineWidth = 3;
      ctx.strokeRect(bX, basketY, bW, bH);
      ctx.fillRect(bX, basketY, bW, bH);

      ctx.fillStyle = '#546e7a'; // Steel ball color
      for (let i = 0; i < ballCount; i++) {
        const r = Math.floor(i / 5), c = i % 5;
        ctx.beginPath();
        ctx.arc(bX + 20 + c * 15, basketY + bH - 15 - r * 12, 6, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(bX + 18 + c * 15, basketY + bH - 17 - r * 12, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#546e7a';
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [windSpeed, ballCount]);

  const reset = () => {
    setWindSpeed(0);
    setBallCount(1);
    liftRef.current = 0;
    angleRef.current = 0;
    omegaRef.current = 0;
    setIsEnergyRevealed(false);
    setIsConclRevealed(false);
  };

  return (
    <div className="flex h-screen bg-[#050e1a] text-white overflow-hidden font-sans">
      {/* Sidebar Controls */}
      <aside className="w-72 bg-[#0a1828]/90 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col gap-8 z-50 shadow-2xl">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#00e5ff] tracking-wider">风能实验室</h1>
          <p className="text-[10px] opacity-40 tracking-widest uppercase mt-1">Realistic Physics Lab</p>
        </div>

        <div className="space-y-6">
          {/* Teacher Controls */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold text-[#00e5ff] uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
              <Settings2 size={14} />
              教师演示控制
            </h3>
            <div className="bg-white/5 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span>显示能量转化</span>
                <button 
                  onClick={() => setShowEnergy(!showEnergy)}
                  className={`p-1.5 rounded-lg transition-all ${showEnergy ? 'bg-[#00e5ff] text-black' : 'bg-white/10 text-white/40'}`}
                >
                  {showEnergy ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>显示科学结论</span>
                <button 
                  onClick={() => setShowConcl(!showConcl)}
                  className={`p-1.5 rounded-lg transition-all ${showConcl ? 'bg-[#00e5ff] text-black' : 'bg-white/10 text-white/40'}`}
                >
                  {showConcl ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>
          </section>

          {/* Wind Speed */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold text-[#00e5ff] uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
              <Wind size={14} />
              风速调节
            </h3>
            <div className="text-center">
              <div className="text-4xl font-black text-[#00e5ff] drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">{windSpeed}</div>
              <input 
                type="range" min="0" max="10" value={windSpeed} 
                onChange={(e) => setWindSpeed(parseInt(e.target.value))}
                className="w-full mt-4 accent-[#00e5ff] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] opacity-40 mt-2">
                <span>静止</span><span>强风</span>
              </div>
            </div>
          </section>

          {/* Load */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold text-[#00e5ff] uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
              <Weight size={14} />
              负载设定
            </h3>
            <div className="text-center">
              <div className="text-4xl font-black text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">{ballCount}</div>
              <input 
                type="range" min="1" max={MAX_BALLS} value={ballCount} 
                onChange={(e) => setBallCount(parseInt(e.target.value))}
                className="w-full mt-4 accent-[#FFD700] cursor-pointer"
              />
              <div className="text-[10px] text-[#FFD700] opacity-60 mt-2">MAX: {MAX_BALLS} 颗钢珠</div>
            </div>
          </section>
        </div>

        <button 
          onClick={reset}
          className="mt-auto flex items-center justify-center gap-2 py-3 border border-red-500/50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all text-sm font-bold"
        >
          <RotateCcw size={16} />
          重置实验系统
        </button>
      </aside>

      {/* Main Stage */}
      <main className="flex-1 relative bg-black">
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT} 
          className="w-full h-full object-contain"
        />

        {/* Insufficient Power Warning */}
        <AnimatePresence>
          {isInsufficient && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-[40%] left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-red-500/30 px-6 py-3 rounded-full text-red-500 font-bold shadow-2xl z-40"
            >
              ⚠️ 动力不足：无法克服重力阻力
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conclusion Overlay (Bottom Right) */}
        <div className="absolute bottom-8 right-8 w-80 flex flex-col gap-4 z-40">
          {/* Energy Flow Card */}
          {showEnergy && (
            <div className="relative group">
              <div 
                className={`bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl transition-all duration-700 ${!isEnergyRevealed ? 'blur-xl grayscale opacity-30 scale-95' : 'blur-0 grayscale-0 opacity-100 scale-100'}`}
              >
                <h4 className="text-[#00e5ff] font-bold text-xs mb-4 flex items-center gap-2">
                  <Info size={14} />
                  ⚡ 能量转化监测
                </h4>
                <div className="text-center text-xs space-y-2">
                  <div className="opacity-80">🌬️ 风能 (流动空气)</div>
                  <div className="text-[#00e5ff]">▼</div>
                  <div className="opacity-80">⚙️ 机械能 (转轴旋转)</div>
                  <div className="text-[#00e5ff]">▼</div>
                  <div className="opacity-80">🏗️ 机械能 (重物提升)</div>
                </div>
              </div>
              {!isEnergyRevealed && (
                <button 
                  onClick={() => setIsEnergyRevealed(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#00e5ff] font-bold text-sm bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                >
                  <Lock size={20} />
                  点击揭示能量流向
                </button>
              )}
            </div>
          )}

          {/* Scientific Conclusion Card */}
          {showConcl && (
            <div className="relative group">
              <div 
                className={`bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl transition-all duration-700 ${!isConclRevealed ? 'blur-xl grayscale opacity-30 scale-95' : 'blur-0 grayscale-0 opacity-100 scale-100'}`}
              >
                <h4 className="text-[#FFD700] font-bold text-xs mb-4 flex items-center gap-2">
                  <Info size={14} />
                  💡 科学发现
                </h4>
                <div className="space-y-4 text-[11px] leading-relaxed">
                  <div className="text-[#FFD700] border-b border-white/10 pb-2">
                    风越大，风能就越大，提起的重物就越多。<br />
                    风越小，风能就越小，提起的重物就越少。
                  </div>
                  <div className="opacity-70 space-y-1">
                    <p>1. 风速越大，提供的能量越多，转速越快。</p>
                    <p>2. 增加钢球会增加阻力，需要更强的风才能提起。</p>
                    <p>3. 能量从风能成功转化为了机械能！</p>
                  </div>
                </div>
              </div>
              {!isConclRevealed && (
                <button 
                  onClick={() => setIsConclRevealed(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#FFD700] font-bold text-sm bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                >
                  <Lock size={20} />
                  点击揭示科学发现
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
