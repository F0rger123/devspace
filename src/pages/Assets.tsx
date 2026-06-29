import { useState, useRef } from 'react';
import { useData } from '../context/DataProvider';
import { Image as ImageIcon, UploadCloud, File, Trash, ExternalLink, HardDrive } from 'lucide-react';

export function Assets() {
  const { activeProjectId, assets, addAsset, deleteAsset } = useData();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeAssets = assets.filter(a => a.projectId === activeProjectId);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: globalThis.File) => {
    if (!activeProjectId) return;
    if (file.size > 10 * 1024 * 1024) {
       alert("File is too large (>10MB).");
       return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
       if (event.target?.result && typeof event.target.result === 'string') {
          addAsset({
            projectId: activeProjectId,
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: event.target.result
          });
       }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(processFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(processFile);
    }
  };

  const formatSize = (bytes: number) => {
     if (!bytes) return '0 Bytes';
     const k = 1024;
     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
     const i = Math.floor(Math.log(bytes) / Math.log(k));
     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full overflow-hidden pb-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            Assets & Uploads <ImageIcon size={18} className="text-pink-400" />
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Drop in screenshots, mood boards, and architecture diagrams.
          </p>
        </div>
      </div>

      {!activeProjectId ? (
         <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 border border-zinc-800 border-dashed rounded-xl p-8 bg-[#0c0c0e]">
            <ImageIcon size={32} className="opacity-20 mb-3" />
            <p className="text-sm">Select an active project first.</p>
         </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          
          <form 
            className={`shrink-0 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${
              dragActive ? 'border-pink-500/50 bg-pink-500/5' : 'border-zinc-800 bg-[#121214] hover:border-zinc-700 hover:bg-[#18181b]'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
             <input 
               ref={fileInputRef} 
               type="file" 
               className="hidden" 
               multiple 
               onChange={handleChange}
             />
             
             <div className="w-12 h-12 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center mb-3">
               <UploadCloud size={20} className="text-zinc-400" />
             </div>
             
             <h3 className="text-sm font-semibold text-zinc-200 mb-1">Click to upload or drag and drop</h3>
             <p className="text-xs text-zinc-500">SVG, PNG, JPG, Architecture PDFs (max 10MB)</p>
          </form>

          <div className="flex-1 border border-zinc-800 bg-[#121214] rounded-xl flex flex-col overflow-hidden relative">
             <div className="p-4 border-b border-zinc-800 bg-[#09090b] flex items-center justify-between">
               <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                 <HardDrive size={14} className="text-zinc-500"/> Workspace Assets
               </h3>
               <span className="text-[10px] text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
                 {activeAssets.length} files
               </span>
             </div>
             <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                {activeAssets.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                     <File size={32} className="opacity-20 mb-3" />
                     <p className="text-xs">No assets uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                     {activeAssets.map(asset => (
                        <div key={asset.id} className="bg-[#09090b] border border-zinc-800 rounded-lg overflow-hidden group">
                           <div className="aspect-square bg-zinc-900 flex items-center justify-center relative overflow-hidden border-b border-zinc-800 p-2">
                              {asset.type.startsWith('image/') ? (
                                <img src={asset.dataUrl} alt={asset.name} className="w-full h-full object-contain rounded" />
                              ) : (
                                <File size={32} className="text-zinc-600" />
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 text-zinc-300 hover:text-white rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all border border-zinc-700 hover:border-red-500"
                              >
                                 <Trash size={12} />
                              </button>
                           </div>
                           <div className="p-2">
                              <div className="text-xs font-semibold text-zinc-200 truncate" title={asset.name}>{asset.name}</div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-[9px] text-zinc-500 font-mono">{formatSize(asset.size)}</span>
                                <a 
                                  href={asset.dataUrl} 
                                  download={asset.name}
                                  className="text-[9px] text-zinc-500 hover:text-blue-400 flex items-center gap-1"
                                >
                                  Download <ExternalLink size={8} />
                                </a>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
                )}
             </div>
          </div>

        </div>
      )}
    </div>
  );
}
