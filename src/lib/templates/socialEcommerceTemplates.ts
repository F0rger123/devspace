// src/lib/templates/socialEcommerceTemplates.ts
// Whisper Social, Luxe Apparel, and PixelCraft 3D Store - Production-grade interactive React 18 templates

export const WHISPER_APP_CODE = `import React, { useState } from 'react';
import { 
  MessageCircle, Heart, Send, Plus, Lock, Shield, User, Image, 
  Sparkles, Flame, Eye, EyeOff, MoreHorizontal, ArrowLeft, Search 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  
  const [stories] = useState([
    { id: 1, name: 'Elena', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', unread: true },
    { id: 2, name: 'Marcus', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', unread: true },
    { id: 3, name: 'Sophia', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', unread: false },
    { id: 4, name: 'Alex', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', unread: false }
  ]);

  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'Sophia Lin',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      time: '14m ago',
      content: 'Late night generative shader experiments with WebGL and SDFs ✨🔮',
      media: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      likes: 128,
      liked: false,
      commentsCount: 14,
      isEncrypted: true
    },
    {
      id: 2,
      author: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      time: '1h ago',
      content: 'Just deployed the zero-knowledge identity verifier. Privacy-first architecture is the only way forward. 🛡️',
      likes: 84,
      liked: true,
      commentsCount: 9,
      isEncrypted: true
    }
  ]);

  const [directMessages, setDirectMessages] = useState([
    {
      id: 'dm-1',
      user: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      lastMsg: 'The cryptographic signature matches. Ready to sync!',
      time: '2m ago',
      unread: 1,
      messages: [
        { id: 1, sender: 'Elena', text: 'Hey Alex! Have you reviewed the Whisper peer protocol?' },
        { id: 2, sender: 'me', text: 'Yes, looking at the ratcheting key exchange now.' },
        { id: 3, sender: 'Elena', text: 'The cryptographic signature matches. Ready to sync!' }
      ]
    }
  ]);

  const toggleLike = (id) => {
    setPosts(posts.map(p => {
      if (p.id === id) {
        return { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    }));
  };

  const sendMsg = () => {
    if (!chatMessage.trim() || !selectedChat) return;
    const newM = { id: Date.now(), sender: 'me', text: chatMessage.trim() };
    const updated = directMessages.map(d => {
      if (d.id === selectedChat.id) {
        return { ...d, messages: [...d.messages, newM], lastMsg: newM.text };
      }
      return d;
    });
    setDirectMessages(updated);
    setSelectedChat(updated.find(d => d.id === selectedChat.id));
    setChatMessage('');
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-zinc-100 flex justify-center items-start p-2 sm:p-4 font-sans select-none">
      <div className="w-full max-w-[420px] bg-[#0d0f17] border border-zinc-850 rounded-[40px] shadow-2xl overflow-hidden flex flex-col min-h-[820px] relative">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-850/80 bg-[#0d0f17]/95 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Sparkles size={15} />
            </div>
            <h1 className="text-sm font-extrabold text-white tracking-tight">Whisper Secure</h1>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            E2E Encrypted
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          
          {/* Stories Bar */}
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {stories.map(s => (
              <div key={s.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
                <div className={"p-0.5 rounded-full " + (s.unread ? 'bg-gradient-to-tr from-pink-500 to-amber-500' : 'bg-zinc-700')}>
                  <img src={s.img} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-[#0d0f17]" />
                </div>
                <span className="text-[10px] text-zinc-400">{s.name}</span>
              </div>
            ))}
          </div>

          {/* TAB 1: FEED */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="bg-zinc-900/70 border border-zinc-800 rounded-3xl overflow-hidden space-y-3">
                  <div className="p-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <img src={post.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <h4 className="text-xs font-bold text-white">{post.author}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">{post.time}</span>
                      </div>
                    </div>
                    <Shield size={14} className="text-pink-400" />
                  </div>

                  {post.media && (
                    <img src={post.media} alt="" className="w-full h-52 object-cover" />
                  )}

                  <div className="p-3.5 pt-0 space-y-2">
                    <p className="text-xs text-zinc-200 leading-relaxed">{post.content}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs text-zinc-400">
                      <button 
                        onClick={() => toggleLike(post.id)}
                        className={"flex items-center gap-1.5 cursor-pointer " + (post.liked ? 'text-pink-500' : 'hover:text-white')}
                      >
                        <Heart size={15} className={post.liked ? 'fill-pink-500' : ''} />
                        <span>{post.likes}</span>
                      </button>
                      <span className="flex items-center gap-1 text-[11px]"><MessageCircle size={14} /> {post.commentsCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: DIRECT CHATS */}
          {activeTab === 'direct' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Encrypted Direct Chats</h3>
              {directMessages.map(dm => (
                <div 
                  key={dm.id}
                  onClick={() => setSelectedChat(dm)}
                  className="p-3 bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img src={dm.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{dm.user}</h4>
                      <p className="text-[11px] text-zinc-400 truncate max-w-[180px]">{dm.lastMsg}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">{dm.time}</span>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Chat Conversation Modal Drawer */}
        {selectedChat && (
          <div className="absolute inset-0 bg-[#0d0f17] z-30 p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <button onClick={() => setSelectedChat(null)} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white cursor-pointer">
                <ArrowLeft size={16} /> Back
              </button>
              <span className="text-xs font-bold text-white">{selectedChat.user}</span>
              <Shield size={15} className="text-emerald-400" />
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {selectedChat.messages.map(m => (
                <div key={m.id} className={"flex " + (m.sender === 'me' ? 'justify-end' : 'justify-start')}>
                  <div className={"p-3 rounded-2xl text-xs max-w-[75%] " + (
                    m.sender === 'me' ? 'bg-pink-600 text-white rounded-br-none' : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-none'
                  )}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-zinc-800">
              <input 
                type="text" 
                placeholder="Encrypted message..." 
                value={chatMessage} 
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMsg()}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button onClick={sendMsg} className="p-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl cursor-pointer">
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-[#0d0f17]/95 backdrop-blur-md border-t border-zinc-850 px-6 py-3 flex justify-around items-center z-20">
          <button onClick={() => setActiveTab('feed')} className={"text-xs flex flex-col items-center gap-1 cursor-pointer " + (activeTab === 'feed' ? 'text-pink-400 font-bold' : 'text-zinc-500')}>
            <Sparkles size={18} />
            <span>Feed</span>
          </button>
          <button onClick={() => setActiveTab('direct')} className={"text-xs flex flex-col items-center gap-1 cursor-pointer " + (activeTab === 'direct' ? 'text-pink-400 font-bold' : 'text-zinc-500')}>
            <MessageCircle size={18} />
            <span>Chats</span>
          </button>
        </div>

      </div>
    </div>
  );
}
`;

export const WHISPER_PRO_APP_CODE = WHISPER_APP_CODE;

export const LUXE_APP_CODE = `import React, { useState } from 'react';
import { ShoppingBag, Star, Heart, ArrowRight, X, Plus, Minus, ShieldCheck, Check } from 'lucide-react';

export default function App() {
  const [cart, setCart] = useState([
    { id: 1, title: 'Cashmere Oversized Trench Coat', category: 'Outerwear', price: 680, size: 'M', qty: 1, img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80' }
  ]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const products = [
    {
      id: 1,
      title: 'Cashmere Oversized Trench Coat',
      category: 'Outerwear',
      price: 680,
      img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
      desc: '100% Mongolian Cashmere, hand-stitched lapels, tailored relaxed silhouette.'
    },
    {
      id: 2,
      title: 'Mulberry Silk Minimalist Slip Dress',
      category: 'Dresses',
      price: 340,
      img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=80',
      desc: 'Heavyweight Mulberry silk with subtle sheen and bias-cut drape.'
    },
    {
      id: 3,
      title: 'Merino Wool Ribbed Knit Sweater',
      category: 'Knitwear',
      price: 260,
      img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop&q=80',
      desc: 'Extra-fine Australian merino wool with seamless circular knit construction.'
    }
  ];

  const addToCart = (product) => {
    setCart([...cart, { ...product, size: selectedSize, qty: 1, id: Date.now() }]);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 font-sans p-4 sm:p-8 flex justify-center">
      <div className="max-w-6xl w-full space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-850 pb-4">
          <div>
            <h1 className="text-xl font-serif font-extrabold tracking-widest text-amber-200">LUXE ATELIER</h1>
            <p className="text-[10px] text-zinc-400 font-mono">Haute Couture & Bespoke Tailoring</p>
          </div>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 hover:text-white cursor-pointer"
          >
            <ShoppingBag size={15} className="text-amber-400" />
            <span>{"Cart (" + cart.reduce((s, i) => s + i.qty, 0) + ") • $" + total}</span>
          </button>
        </div>

        {/* Product Catalog */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden space-y-3 p-4 group">
              <img src={p.img} alt={p.title} className="w-full h-80 object-cover rounded-2xl group-hover:scale-102 transition-transform duration-500" />
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">{p.category}</span>
                <h3 className="text-sm font-bold text-white">{p.title}</h3>
                <p className="text-xs text-zinc-400">{"$" + p.price}</p>
              </div>
              <button 
                onClick={() => setSelectedProduct(p)}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Inspect & Purchase
              </button>
            </div>
          ))}
        </div>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#0e0e12] border border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase">{selectedProduct.category}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedProduct.title}</h3>
                  <div className="text-sm font-mono text-amber-300 font-bold">{"$" + selectedProduct.price}</div>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3.5 rounded-2xl border border-zinc-850">
                {selectedProduct.desc}
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-400">Select Size</label>
                <div className="flex gap-2">
                  {['XS', 'S', 'M', 'L', 'XL'].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setSelectedSize(s)}
                      className={"px-3 py-1.5 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all " + (
                        selectedSize === s ? 'bg-amber-400 text-zinc-950 border-amber-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => addToCart(selectedProduct)}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                {"Add to Cart • $" + selectedProduct.price}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
`;

export const LUXE_PRO_APP_CODE = LUXE_APP_CODE;

export const PIXELCRAFT_APP_CODE = `import React, { useState } from 'react';
import { Box, Download, Star, Eye, Layers, Shield, Sparkles } from 'lucide-react';

export default function App() {
  const assets = [
    { title: 'Cyberpunk Mech Titan v2', polyCount: '48,200 Triangles', formats: 'GLTF / FBX / OBJ', category: 'Characters & Mechs', price: '$49' },
    { title: 'Sci-Fi Modular Corridor Kit', polyCount: '120,400 Triangles', formats: 'GLTF / Unreal Engine 5.4', category: 'Environment Props', price: '$79' },
    { title: 'Stylized Crystal Weapon Pack', polyCount: '14,800 Triangles', formats: 'Unity Package / FBX', category: 'Weapons', price: '$29' }
  ];

  return (
    <div className="min-h-screen bg-[#06080e] text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center border-b border-zinc-850 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Box size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white font-mono">PixelCraft 3D Asset Studio</h1>
              <p className="text-[10px] text-zinc-400 font-mono">PBR Texture & High-Poly Game Engine Marketplace</p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full font-bold">
            PBR 4K Textures
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assets.map((a, idx) => (
            <div key={idx} className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-3">
              <div className="w-full h-36 bg-zinc-950 rounded-2xl border border-zinc-850 flex items-center justify-center text-cyan-400">
                <Box size={36} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase">{a.category}</span>
                <h3 className="text-xs font-bold text-white mt-0.5">{a.title}</h3>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{a.polyCount + " • " + a.formats}</p>
              </div>
              <button className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer">
                {"Inspect 3D Mesh (" + a.price + ")"}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
`;

export const PIXELCRAFT_PRO_APP_CODE = PIXELCRAFT_APP_CODE;
