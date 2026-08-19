// src/lib/templates/biteexpressTemplates.ts
// BiteExpress Food & Grocery Suite - Production-grade interactive React 18 templates

export const BITEEXPRESS_APP_CODE = `import React, { useState } from 'react';
import { 
  UtensilsCrossed, Star, ShoppingBag, Clock, Plus, Minus, Search, 
  MapPin, ChevronRight, Check, X, Shield, ArrowRight, Heart, 
  Sparkles, Filter, Navigation, Flame, User, Bell, ChevronLeft
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('explore');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [cart, setCart] = useState([
    { id: 101, name: 'Truffle Umami Wagyu Smashburger', price: 18.50, qty: 2, restaurant: 'Artisan Burger Co.', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80' },
    { id: 102, name: 'Crispy Truffle Fries with Rosemary', price: 7.00, qty: 1, restaurant: 'Artisan Burger Co.', img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80' }
  ]);
  const [activeOrder, setActiveOrder] = useState({
    id: '#ORD-8942',
    status: 'ON_THE_WAY',
    courier: 'David Chen',
    courierPhone: '+1 (555) 382-9102',
    eta: '14 mins',
    progress: 75,
    items: ['2x Wagyu Smashburger', '1x Truffle Fries']
  });

  const categories = ['All', 'Burgers 🍔', 'Sushi 🍣', 'Pizza 🍕', 'Healthy 🥗', 'Tacos 🌮', 'Dessert 🍩'];

  const restaurants = [
    {
      id: 1,
      name: 'Artisan Burger Co.',
      category: 'Burgers 🍔',
      rating: 4.9,
      reviewCount: 380,
      deliveryTime: '20-30 min',
      deliveryFee: '$1.99',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
      badge: 'Featured Chef',
      menu: [
        { id: 101, name: 'Truffle Umami Wagyu Smashburger', desc: 'Double dry-aged wagyu patty, black truffle aioli, aged sharp cheddar, brioche bun.', price: 18.50, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300' },
        { id: 102, name: 'Crispy Truffle Fries with Rosemary', desc: 'Hand-cut russet potatoes, white truffle oil, sea salt, shaved parmesan.', price: 7.00, img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300' },
        { id: 103, name: 'Smoked Jalapeno Bacon Burger', desc: 'Applewood smoked bacon, charred jalapeno relish, pepperjack melt.', price: 16.50, img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=300' }
      ]
    },
    {
      id: 2,
      name: 'Omakase Tokyo Sushi Bar',
      category: 'Sushi 🍣',
      rating: 4.95,
      reviewCount: 620,
      deliveryTime: '25-35 min',
      deliveryFee: '$2.99',
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80',
      badge: 'Michelin Guide',
      menu: [
        { id: 201, name: '12-Piece Chef Nigiri Omakase', desc: 'Bluefin otoro, king salmon, hokkaido scallop, sea urchin with fresh wasabi.', price: 38.00, img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300' },
        { id: 202, name: 'Spicy Bluefin Tuna Crunch Roll', desc: 'Tuna tartare, cucumber, tobiko, tempura flakes, sriracha unagi glaze.', price: 16.00, img: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=300' }
      ]
    },
    {
      id: 3,
      name: 'Napoletana Wood-Fired Pizza',
      category: 'Pizza 🍕',
      rating: 4.8,
      reviewCount: 290,
      deliveryTime: '15-25 min',
      deliveryFee: 'Free',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
      badge: 'Popular',
      menu: [
        { id: 301, name: 'Bufala Margherita DOP', desc: 'San Marzano tomatoes, fresh buffalo mozzarella, fresh basil, organic EVOO.', price: 19.00, img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300' },
        { id: 302, name: 'Diavola Spicy Salami', desc: 'Calabrian chili oil, spicy soppressata, smoked provolone.', price: 21.00, img: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=300' }
      ]
    }
  ];

  const addToCart = (item, restName) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1, restaurant: restName }]);
    }
  };

  const updateCartQty = (id, delta) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = c.qty + delta;
        return newQty > 0 ? { ...c, qty: newQty } : null;
      }
      return c;
    }).filter(Boolean));
  };

  const subtotal = cart.reduce((acc, c) => acc + (c.price * c.qty), 0);
  const deliveryFee = 2.99;
  const tax = subtotal * 0.088;
  const total = subtotal > 0 ? subtotal + deliveryFee + tax : 0;

  const filteredRestaurants = restaurants.filter(r => {
    const matchesCat = selectedCategory === 'All' || r.category.indexOf(selectedCategory.split(' ')[0]) !== -1;
    const matchesSearch = !searchQuery || r.name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1;
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#08090d] text-zinc-100 flex justify-center items-start p-2 sm:p-4 font-sans select-none">
      <div className="w-full max-w-[420px] bg-[#0d0f15] border border-zinc-850 rounded-[40px] shadow-2xl overflow-hidden flex flex-col min-h-[820px] relative">
        
        {/* Top Header Location & Search */}
        <div className="p-4 border-b border-zinc-850/80 bg-[#0d0f15]/95 backdrop-blur-md sticky top-0 z-30 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <MapPin size={16} className="text-amber-400" />
              <div>
                <span className="text-[10px] text-zinc-400 font-mono">DELIVERING TO</span>
                <p className="text-xs font-bold text-white flex items-center gap-1">
                  742 Evergreen Terrace, Apt 4B <ChevronRight size={12} />
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab('cart')}
                className="relative p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 cursor-pointer"
              >
                <ShoppingBag size={16} className="text-amber-400" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-zinc-950 rounded-full text-[10px] font-bold flex items-center justify-center font-mono">
                    {cart.reduce((s, i) => s + i.qty, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-3 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search wagyu, sushi, tacos, desserts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-5">
          
          {/* TAB 1: EXPLORE RESTAURANTS */}
          {activeTab === 'explore' && !selectedRestaurant && (
            <div className="space-y-5">
              
              {/* Category Pills Bar */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={
                      "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer " +
                      (selectedCategory === c 
                        ? "bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20" 
                        : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white")
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Promo Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-zinc-900 border border-amber-500/30 rounded-3xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold bg-amber-500 text-zinc-950 px-2 py-0.5 rounded-full">FLASH DEAL</span>
                  <span className="text-[10px] font-mono text-zinc-400">Code: FEAST20</span>
                </div>
                <h3 className="text-sm font-extrabold text-white">20% Off Gourmet Wagyu & Omakase</h3>
                <p className="text-[11px] text-zinc-400">Order over $35 and enjoy complimentary artisan truffle fries.</p>
              </div>

              {/* Restaurant Cards List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Top Rated Kitchens Near You</h3>
                
                {filteredRestaurants.map(r => (
                  <div 
                    key={r.id}
                    onClick={() => setSelectedRestaurant(r)}
                    className="bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 rounded-3xl overflow-hidden cursor-pointer transition-all shadow-lg group"
                  >
                    <div className="relative h-44 w-full overflow-hidden">
                      <img 
                        src={r.image} 
                        alt={r.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-md text-amber-400 text-[10px] font-mono font-bold rounded-full border border-white/10">
                        {r.badge}
                      </span>
                      <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-mono rounded-lg flex items-center gap-1">
                        <Clock size={11} className="text-amber-400" /> {r.deliveryTime}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">{r.name}</h4>
                          <p className="text-[11px] text-zinc-400">{r.category} • Delivery: {r.deliveryFee}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-amber-400 text-xs font-bold font-mono">
                          <Star size={12} className="fill-amber-400" />
                          <span>{r.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* RESTAURANT MENU DETAIL VIEW */}
          {activeTab === 'explore' && selectedRestaurant && (
            <div className="space-y-4">
              <button 
                onClick={() => setSelectedRestaurant(null)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white cursor-pointer font-mono"
              >
                <ChevronLeft size={16} /> All Kitchens
              </button>

              <div className="relative h-48 rounded-3xl overflow-hidden border border-zinc-800">
                <img src={selectedRestaurant.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                  <h3 className="text-lg font-extrabold text-white">{selectedRestaurant.name}</h3>
                  <p className="text-xs text-zinc-300 flex items-center gap-2">
                    <span className="text-amber-400 font-bold flex items-center gap-0.5"><Star size={12} className="fill-amber-400" /> {selectedRestaurant.rating}</span>
                    <span>• {selectedRestaurant.deliveryTime}</span>
                    <span>• {selectedRestaurant.deliveryFee} Fee</span>
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Chef Signature Menu</h4>
                
                {selectedRestaurant.menu.map(item => (
                  <div key={item.id} className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex gap-3 justify-between items-center">
                    <div className="space-y-1 flex-1">
                      <h5 className="text-xs font-bold text-white">{item.name}</h5>
                      <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">{item.desc}</p>
                      <span className="text-xs font-mono font-bold text-amber-400">{"$" + item.price.toFixed(2)}</span>
                    </div>

                    <button 
                      onClick={() => addToCart(item, selectedRestaurant.name)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      <Plus size={13} /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SHOPPING CART & CHECKOUT */}
          {activeTab === 'cart' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Your Order Basket ({cart.reduce((s, c) => s + c.qty, 0)} Items)</h3>

              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <ShoppingBag size={36} className="mx-auto text-zinc-600" />
                  <p className="text-xs text-zinc-400">Your basket is currently empty.</p>
                  <button 
                    onClick={() => setActiveTab('explore')}
                    className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Browse Menus
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2.5">
                    {cart.map(item => (
                      <div key={item.id} className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-white">{item.name}</h4>
                          <span className="text-[10px] text-zinc-400 font-mono">{"$" + item.price.toFixed(2) + " each"}</span>
                        </div>

                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
                          <button 
                            onClick={() => updateCartQty(item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs hover:bg-zinc-700 cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-mono font-bold text-white px-1.5">{item.qty}</span>
                          <button 
                            onClick={() => updateCartQty(item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs hover:bg-amber-500/40 cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown Card */}
                  <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between text-zinc-400">
                      <span>Subtotal</span>
                      <span className="text-white">{"$" + subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Express Delivery Fee</span>
                      <span className="text-white">{"$" + deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Estimated Tax (8.8%)</span>
                      <span className="text-white">{"$" + tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm font-bold text-white">
                      <span>Total Amount</span>
                      <span className="text-amber-400">{"$" + total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveTab('tracking');
                    }}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-98"
                  >
                    <span>Place Express Order ({"$" + total.toFixed(2)})</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE GPS ORDER TRACKER */}
          {activeTab === 'tracking' && (
            <div className="space-y-4">
              
              {/* Order Status Gauge Card */}
              <div className="p-5 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-[#0d0f15] border border-amber-500/30 rounded-3xl space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">{activeOrder.id}</span>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono rounded-full font-bold">
                    ON TIME
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-white">{"Arriving in " + activeOrder.eta + " 🚀"}</h3>
                  <p className="text-xs text-zinc-400">Courier is 0.8 miles away on electric scooter</p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-500" style={{ width: activeOrder.progress + "%" }}></div>
                </div>

                {/* Courier Profile Info */}
                <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-850 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover border border-amber-500/30"
                    />
                    <div>
                      <h5 className="text-xs font-bold text-white">{activeOrder.courier}</h5>
                      <p className="text-[10px] text-zinc-400 font-mono">Platinum Top Rated Courier (4.98 ★)</p>
                    </div>
                  </div>

                  <button
                    className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl"
                  >
                    Call
                  </button>
                </div>
              </div>

              {/* Simulated Map Visual */}
              <div className="h-44 bg-zinc-950 rounded-3xl border border-zinc-800 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
                <div className="relative flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-zinc-950 shadow-lg animate-bounce">
                    <Navigation size={18} />
                  </div>
                  <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded text-zinc-300 border border-zinc-800">
                    Live GPS Telemetry Connected
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Mobile Tab Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-[#0d0f15]/95 backdrop-blur-md border-t border-zinc-850 px-6 py-3 flex justify-around items-center z-30">
          <button 
            onClick={() => setActiveTab('explore')}
            className={
              "flex flex-col items-center gap-1 text-[10px] font-medium cursor-pointer " +
              (activeTab === 'explore' ? 'text-amber-400 font-bold' : 'text-zinc-500')
            }
          >
            <UtensilsCrossed size={18} />
            <span>Discover</span>
          </button>

          <button 
            onClick={() => setActiveTab('cart')}
            className={
              "flex flex-col items-center gap-1 text-[10px] font-medium cursor-pointer " +
              (activeTab === 'cart' ? 'text-amber-400 font-bold' : 'text-zinc-500')
            }
          >
            <ShoppingBag size={18} />
            <span>Basket</span>
          </button>

          <button 
            onClick={() => setActiveTab('tracking')}
            className={
              "flex flex-col items-center gap-1 text-[10px] font-medium cursor-pointer " +
              (activeTab === 'tracking' ? 'text-amber-400 font-bold' : 'text-zinc-500')
            }
          >
            <Navigation size={18} />
            <span>Live GPS</span>
          </button>
        </div>

      </div>
    </div>
  );
}
`;

export const BITEEXPRESS_PRO_APP_CODE = `import React, { useState } from 'react';
import { 
  UtensilsCrossed, Star, Wine, Sparkles, Award, Clock, ArrowRight, 
  Check, ChevronRight, Shield, Heart, User, ShoppingBag, MapPin
} from 'lucide-react';

export default function App() {
  const [activeCourseIndex, setActiveCourseIndex] = useState(0);
  
  const tastingMenu = [
    {
      course: 'Course 1: Amuse-Bouche',
      dish: 'Hokkaido Scallop Tartare with Oscietra Caviar',
      desc: 'Infused with yuzu kosho pearls and dashi jelly.',
      pairing: 'Dom Pérignon Vintage 2013 Champagne'
    },
    {
      course: 'Course 2: Entrée',
      dish: 'A5 Miyazaki Wagyu Ribeye over Binchotan Charcoal',
      desc: 'Black winter truffle demi-glace and fermented black garlic puree.',
      pairing: '2016 Château Margaux Premier Grand Cru'
    },
    {
      course: 'Course 3: Dessert',
      dish: 'Valrhona Grand Cru Dark Chocolate Sphere',
      desc: 'Madagascar vanilla bean foam, edible 24k gold leaf and passionfruit reduction.',
      pairing: 'Château dYquem Sauternes 2011'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex justify-center items-start p-2 sm:p-4 font-sans select-none">
      <div className="w-full max-w-[420px] bg-[#0c0c10] border border-amber-500/30 rounded-[40px] shadow-2xl overflow-hidden flex flex-col min-h-[820px] relative">
        
        {/* Luxury Header */}
        <div className="p-4 border-b border-zinc-850/80 bg-[#0c0c10]/95 backdrop-blur-md sticky top-0 z-30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles size={14} />
            </div>
            <div>
              <h1 className="text-xs font-serif font-extrabold text-amber-200 tracking-widest uppercase">BiteExpress VIP</h1>
              <p className="text-[9px] font-mono text-zinc-400">Michelin Private Dining Dispatch</p>
            </div>
          </div>

          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            3★ Michelin
          </span>
        </div>

        {/* Tasting Menu Flow */}
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-2">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Chef Laurent Blanc</span>
            <h2 className="text-base font-bold text-white">Autumn Solstice 7-Course Omakase Experience</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Delivered in temperature-controlled bespoke thermal brassier canisters with dedicated silver service tableware.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Multi-Course Pairing Itinerary</h3>
            {tastingMenu.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveCourseIndex(idx)}
                className={
                  "p-4 rounded-2xl border transition-all cursor-pointer space-y-2 " +
                  (activeCourseIndex === idx 
                    ? "bg-amber-950/20 border-amber-500/40 text-white" 
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400")
                }
              >
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-amber-400">{item.course}</span>
                  <span className="text-[10px] text-zinc-500">Course {idx + 1} of 3</span>
                </div>
                <h4 className="text-xs font-bold text-white">{item.dish}</h4>
                <p className="text-[11px] text-zinc-400">{item.desc}</p>
                <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-1.5 text-[11px] text-amber-300 font-mono">
                  <Wine size={12} /> Pairing: {item.pairing}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Booking CTA */}
        <div className="p-4 border-t border-zinc-850 bg-[#0c0c10] sticky bottom-0 z-30">
          <button className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer">
            <span>Reserve Sommelier Pairing ($280 / guest)</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
`;
