import React from 'react';

interface WorkflowItem {
  id: string;
  name: string;
  image: string;
}

interface OrbitalWorkflowProps {
  title?: string;
  subtitle?: string;
  items?: WorkflowItem[];
}

const OrbitalWorkflow: React.FC<OrbitalWorkflowProps> = ({
  title = "My Creative Workflow & Tools",
  subtitle = "The professional tools I use to craft high-quality videos, designs, and motion graphics.",
  items = [
    { id: '1', name: 'After Effects', image: 'https://cdn.iconscout.com/icon/free/png-256/free-adobe-after-effects-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-1-pack-logos-icons-2945233.png?f=webp&w=256' },
    { id: '2', name: 'Illustrator', image: 'https://cdn.iconscout.com/icon/free/png-256/free-adobe-illustrator-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-1-pack-logos-icons-2945234.png?f=webp&w=256' },
    { id: '3', name: 'Photoshop', image: 'https://cdn.iconscout.com/icon/free/png-256/free-adobe-photoshop-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-1-pack-logos-icons-2945235.png?f=webp&w=256' },
    { id: '4', name: 'Premiere Pro', image: 'https://cdn.iconscout.com/icon/free/png-256/free-adobe-premiere-pro-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-1-pack-logos-icons-2945236.png?f=webp&w=256' }
  ]
}) => {
  return (
    <div id="workflow" className="relative w-full py-24 bg-[#070707] overflow-hidden flex flex-col items-center min-h-[800px] justify-center">
      
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6A5AF9]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 text-center mb-16 px-6">
        <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] tracking-widest font-bold text-[#6A5AF9] mb-4">
          WORKFLOW
        </span>
        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">{title}</h2>
        <p className="text-gray-400 max-w-lg mx-auto text-lg leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Main Orbital System Container */}
      <div className="relative w-[340px] h-[340px] md:w-[600px] md:h-[600px] flex items-center justify-center select-none scale-90 md:scale-100">

        {/* --- STATIC RINGS (Visual guides) --- */}
        <div className="absolute w-[40%] h-[40%] border border-white/5 rounded-full box-border" />
        <div className="absolute w-[70%] h-[70%] border border-white/10 rounded-full box-border" />
        <div className="absolute w-[100%] h-[100%] border border-white/5 rounded-full box-border" />

        {/* --- ORBITING LAYERS --- */}
        
        {/* Orbit Path 1 (Middle Ring - Clockwise 30s) */}
        <div className="absolute w-[70%] h-[70%] animate-spin-30s-cw rounded-full pointer-events-none">
          {/* Icon 1: Top Position */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            {/* Counter-rotate at EXACTLY same speed (30s) to keep icon upright */}
            <div className="animate-spin-30s-ccw">
               <OrbitalIcon item={items[0]} color="blue" />
            </div>
          </div>
          
          {/* Icon 2: Bottom Position */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-auto">
            <div className="animate-spin-30s-ccw">
              <OrbitalIcon item={items[1]} color="orange" />
            </div>
          </div>
        </div>

        {/* Orbit Path 2 (Outer Ring - Counter-Clockwise 45s) */}
        <div className="absolute w-[100%] h-[100%] animate-spin-45s-ccw rounded-full pointer-events-none">
          {/* Icon 3: Left Position */}
          <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
             {/* Counter-rotate at EXACTLY same speed (45s) to keep icon upright */}
            <div className="animate-spin-45s-cw"> 
               <OrbitalIcon item={items[2]} color="cyan" />
            </div>
          </div>

          {/* Icon 4: Right Position */}
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <div className="animate-spin-45s-cw">
               <OrbitalIcon item={items[3]} color="purple" />
            </div>
          </div>
        </div>

        {/* CENTER HUB */}
        <div className="relative z-20 w-32 h-32 md:w-40 md:h-40 bg-[#070707]/90 backdrop-blur-xl border border-white/10 rounded-full flex flex-col items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.8)]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/10 to-[#6A5AF9]/10 opacity-40"></div>
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(255,255,255,0.03)]"></div>

          <h3 className="font-bold text-2xl tracking-tight text-white relative z-10">RAJU</h3>
          <span className="text-[10px] md:text-xs font-bold text-[#6A5AF9] tracking-widest relative z-10 mt-1 uppercase">Creative Hub</span>
        </div>

      </div>

      <style>{`
        /* --- Keyframes --- */
        @keyframes spinCW {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spinCCW {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        /* --- Middle Ring Animations (30s) --- */
        .animate-spin-30s-cw {
          animation: spinCW 30s linear infinite;
        }
        .animate-spin-30s-ccw {
          animation: spinCCW 30s linear infinite;
        }

        /* --- Outer Ring Animations (45s) --- */
        .animate-spin-45s-cw {
          animation: spinCW 45s linear infinite;
        }
        .animate-spin-45s-ccw {
          animation: spinCCW 45s linear infinite;
        }
      `}</style>
    </div>
  );
};

// Helper component for the Icon bubble
const OrbitalIcon = ({ item, color = "blue" }: { item: WorkflowItem, color?: string }) => {
  if (!item) return null;
  
  const borderColor = 
    color === 'orange' ? 'border-orange-500/40' : 
    color === 'cyan' ? 'border-cyan-500/40' : 
    color === 'purple' ? 'border-purple-500/40' : 
    'border-blue-500/40';

  const shadowColor = 
    color === 'orange' ? 'shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 
    color === 'cyan' ? 'shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 
    color === 'purple' ? 'shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 
    'shadow-[0_0_20px_rgba(59,130,246,0.2)]';

  return (
    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#070707] border ${borderColor} p-2 ${shadowColor} shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] overflow-hidden flex items-center justify-center relative group hover:scale-110 transition-transform duration-300 cursor-pointer`}>
      {item.image ? (
        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-full opacity-90 group-hover:opacity-100 transition-opacity" />
      ) : (
        <span className="text-white text-[10px] font-bold">{item.name}</span>
      )}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {item.name}
      </div>
    </div>
  );
};

export default OrbitalWorkflow;