// src/lib/templates/cryptopulseTemplates.ts
// CryptoPulse DeFi & Algo Trading Terminal - Production-grade interactive React 18 template

export const CRYPTOPULSE_APP_CODE = `import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, ArrowUpRight, 
  ArrowDownRight, BarChart2, Shield, RefreshCw, Wallet, Zap, 
  Sliders, Globe, ChevronDown, Check, AlertCircle, Clock, Sparkles
} from 'lucide-react';

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [tradeType, setTradeType] = useState('BUY'); // BUY | SELL
  const [orderType, setOrderType] = useState('MARKET'); // MARKET | LIMIT
  const [leverage, setLeverage] = useState(5);
  const [orderAmount, setOrderAmount] = useState('2500');
  const [timeframe, setTimeframe] = useState('24H');
  
  // Account Portfolio Balance
  const [portfolio, setPortfolio] = useState({
    totalBalance: 128450.80,
    dailyPnL: 4210.45,
    dailyPnLPct: 3.38,
    marginUsed: 24500.00,
    freeMargin: 103950.80
  });

  // Watchlist Tickers
  const [marketTickers, setMarketTickers] = useState([
    { symbol: 'BTC', name: 'Bitcoin', price: 92450.20, change24h: 3.42, high24h: 93200, low24h: 89800, vol: '$32.4B' },
    { symbol: 'ETH', name: 'Ethereum', price: 3420.50, change24h: 2.15, high24h: 3490, low24h: 3310, vol: '$14.8B' },
    { symbol: 'SOL', name: 'Solana', price: 184.75, change24h: -1.20, high24h: 192, low24h: 181, vol: '$6.2B' },
    { symbol: 'AVAX', name: 'Avalanche', price: 38.40, change24h: 5.60, high24h: 39.5, low24h: 36.1, vol: '$1.4B' },
    { symbol: 'LINK', name: 'Chainlink', price: 19.85, change24h: 0.85, high24h: 20.4, low24h: 19.2, vol: '$820M' }
  ]);

  // Open Positions
  const [positions, setPositions] = useState([
    { id: 'POS-1', symbol: 'BTC', side: 'LONG', size: '1.50 BTC', entryPrice: 89400, markPrice: 92450.20, leverage: '10x', pnl: 4575.30, pnlPct: 51.17 },
    { id: 'POS-2', symbol: 'ETH', side: 'LONG', size: '12.0 ETH', entryPrice: 3380, markPrice: 3420.50, leverage: '5x', pnl: 486.00, pnlPct: 5.98 }
  ]);

  // Simulated live ticker fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketTickers(prev => prev.map(t => {
        const delta = (Math.random() - 0.48) * (t.price * 0.002);
        return {
          ...t,
          price: Number((t.price + delta).toFixed(2))
        };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const activeTicker = marketTickers.find(t => t.symbol === selectedAsset) || marketTickers[0];

  const handlePlaceOrder = () => {
    const amt = parseFloat(orderAmount);
    if (isNaN(amt) || amt <= 0) return;

    const newPos = {
      id: \`POS-\${positions.length + 1}\`,
      symbol: activeTicker.symbol,
      side: tradeType === 'BUY' ? 'LONG' : 'SHORT',
      size: \`\${((amt * leverage) / activeTicker.price).toFixed(3)} \${activeTicker.symbol}\`,
      entryPrice: activeTicker.price,
      markPrice: activeTicker.price,
      leverage: \`\${leverage}x\`,
      pnl: 0,
      pnlPct: 0
    };

    setPositions([newPos, ...positions]);
    setPortfolio(prev => ({
      ...prev,
      marginUsed: prev.marginUsed + amt,
      freeMargin: prev.freeMargin - amt
    }));
  };

  const closePosition = (posId) => {
    const pos = positions.find(p => p.id === posId);
    if (!pos) return;
    setPositions(positions.filter(p => p.id !== posId));
    setPortfolio(prev => ({
      ...prev,
      totalBalance: prev.totalBalance + pos.pnl,
      marginUsed: Math.max(0, prev.marginUsed - 2000),
      freeMargin: prev.freeMargin + 2000 + pos.pnl
    }));
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-zinc-100 font-sans p-3 sm:p-5 flex flex-col justify-start">
      <div className="max-w-7xl w-full mx-auto space-y-4">
        
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">CryptoPulse Algo Terminal</h1>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono rounded font-bold">
                  MAINNET ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">Ultra-low latency perpetual futures & spot engine</p>
            </div>
          </div>

          {/* Quick Portfolio Stats */}
          <div className="flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-2xl text-xs font-mono">
            <div>
              <span className="text-zinc-500 text-[10px] block">Net Asset Value</span>
              <span className="text-white font-bold">\${portfolio.totalBalance.toLocaleString()}</span>
            </div>
            <div className="h-6 w-px bg-zinc-800"></div>
            <div>
              <span className="text-zinc-500 text-[10px] block">24h P&L</span>
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <ArrowUpRight size={12} /> +\${portfolio.dailyPnL.toLocaleString()} (+{portfolio.dailyPnLPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid: Left Chart & Orderbook | Right Order Entry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT 8 COLS: TICKER HEADER + CHART + POSITIONS */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Active Asset Banner */}
            <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-3xl flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center font-bold text-amber-400 border border-zinc-700 text-sm font-mono">
                  {activeTicker.symbol}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-white">{activeTicker.name}</h2>
                    <span className="text-xs text-zinc-400 font-mono">{activeTicker.symbol}/USD Perpetual</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-black font-mono text-white">\${activeTicker.price.toLocaleString()}</span>
                    <span className={\`text-xs font-mono font-bold flex items-center \${activeTicker.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
                      {activeTicker.change24h >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {activeTicker.change24h}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Asset 24h High/Low Stats */}
              <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                <div>
                  <span className="text-[10px] text-zinc-500 block">24h High</span>
                  <span className="text-zinc-200">\${activeTicker.high24h.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">24h Low</span>
                  <span className="text-zinc-200">\${activeTicker.low24h.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">24h Vol</span>
                  <span className="text-zinc-200">{activeTicker.vol}</span>
                </div>
              </div>
            </div>

            {/* Interactive Price Chart with Timeframes */}
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-3xl space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
                  {['1H', '24H', '1W', '1M', '1Y'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={\`px-2.5 py-1 rounded-lg transition-colors cursor-pointer \${
                        timeframe === tf ? 'bg-zinc-800 text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                      }\`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Live Stream 12ms</span>
                </div>
              </div>

              {/* Candlestick & Area SVG Chart */}
              <div className="h-56 w-full pt-2 flex items-end relative overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="500" y2="40" stroke="#27272a" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="500" y2="80" stroke="#27272a" strokeDasharray="3 3" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#27272a" strokeDasharray="3 3" />

                  {/* Area fill */}
                  <polygon 
                    points="0,120 40,110 80,130 120,95 160,105 200,70 240,85 280,60 320,75 360,45 400,55 440,30 500,25 500,160 0,160" 
                    fill="url(#chartGrad)" 
                  />

                  {/* Line */}
                  <polyline 
                    points="0,120 40,110 80,130 120,95 160,105 200,70 240,85 280,60 320,75 360,45 400,55 440,30 500,25" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="2.5" 
                  />
                </svg>
              </div>
            </div>

            {/* Positions Table */}
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                  Open Positions ({positions.length})
                </h3>
                <span className="text-[10px] font-mono text-zinc-400">Margin In Use: \${portfolio.marginUsed.toLocaleString()}</span>
              </div>

              {positions.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center font-mono">No active open positions.</p>
              ) : (
                <div className="space-y-2">
                  {positions.map(pos => (
                    <div key={pos.id} className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-wrap justify-between items-center gap-3 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className={\`px-2 py-0.5 rounded text-[10px] font-bold \${pos.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}\`}>
                          {pos.side} {pos.leverage}
                        </span>
                        <div>
                          <strong className="text-white">{pos.symbol}</strong>
                          <span className="text-zinc-500 text-[10px] block">{pos.size}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-zinc-500 text-[10px] block">Entry / Mark</span>
                        <span className="text-zinc-300">\${pos.entryPrice} / \${pos.markPrice}</span>
                      </div>

                      <div>
                        <span className="text-zinc-500 text-[10px] block">Unrealized P&L</span>
                        <span className={\`font-bold \${pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
                          {pos.pnl >= 0 ? '+' : ''}\${pos.pnl.toFixed(2)} ({pos.pnlPct.toFixed(2)}%)
                        </span>
                      </div>

                      <button 
                        onClick={() => closePosition(pos.id)}
                        className="px-3 py-1 bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT 4 COLS: ORDER ENTRY + WATCHLIST */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Trade Order Entry Box */}
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-zinc-300 uppercase font-mono">Order Execution</span>
                <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-mono">
                  <button onClick={() => setOrderType('MARKET')} className={\`px-2 py-0.5 rounded \${orderType === 'MARKET' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}\`}>Market</button>
                  <button onClick={() => setOrderType('LIMIT')} className={\`px-2 py-0.5 rounded \${orderType === 'LIMIT' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}\`}>Limit</button>
                </div>
              </div>

              {/* Buy / Sell Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setTradeType('BUY')}
                  className={\`py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer \${
                    tradeType === 'BUY' ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                  }\`}
                >
                  BUY / LONG
                </button>
                <button 
                  onClick={() => setTradeType('SELL')}
                  className={\`py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer \${
                    tradeType === 'SELL' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                  }\`}
                >
                  SELL / SHORT
                </button>
              </div>

              {/* Leverage Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Leverage Multiplier</span>
                  <span className="text-emerald-400 font-bold">{leverage}x</span>
                </div>
                <input 
                  type="range" min="1" max="20" step="1"
                  value={leverage}
                  onChange={e => setLeverage(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Order Amount */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-zinc-400">Margin Amount (USD)</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-2.5 text-zinc-500" />
                  <input 
                    type="number"
                    value={orderAmount}
                    onChange={e => setOrderAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Quick Fill Percentage Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[0.25, 0.50, 0.75, 1.0].map((pct, i) => (
                  <button 
                    key={i}
                    onClick={() => setOrderAmount((portfolio.freeMargin * pct).toFixed(0))}
                    className="py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 text-[10px] font-mono rounded-lg border border-zinc-850"
                  >
                    {pct * 100}%
                  </button>
                ))}
              </div>

              {/* Order Summary & Submit Button */}
              <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-[11px] font-mono space-y-1 text-zinc-400">
                <div className="flex justify-between"><span>Buying Power:</span><span className="text-zinc-200">\${(parseFloat(orderAmount || 0) * leverage).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Estimated Fee (0.04%):</span><span className="text-zinc-200">\${((parseFloat(orderAmount || 0) * leverage) * 0.0004).toFixed(2)}</span></div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                className={\`w-full py-3 rounded-2xl font-bold text-xs font-mono shadow-xl transition-all cursor-pointer \${
                  tradeType === 'BUY' 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20' 
                    : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                }\`}
              >
                Place {tradeType} Order ({activeTicker.symbol})
              </button>
            </div>

            {/* Market Watchlist Grid */}
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-2.5">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Market Watchlist</h3>
              <div className="space-y-1.5">
                {marketTickers.map(t => (
                  <div 
                    key={t.symbol}
                    onClick={() => setSelectedAsset(t.symbol)}
                    className={\`p-2.5 rounded-2xl border flex justify-between items-center cursor-pointer transition-all \${
                      selectedAsset === t.symbol 
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-white' 
                        : 'bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                    }\`}
                  >
                    <div>
                      <strong className="text-xs text-white block">{t.symbol}</strong>
                      <span className="text-[10px] text-zinc-500 font-mono">{t.name}</span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-white block">\${t.price.toLocaleString()}</span>
                      <span className={\`text-[10px] font-bold \${t.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
                        {t.change24h >= 0 ? '+' : ''}{t.change24h}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
`;

export const CRYPTOPULSE_PRO_APP_CODE = `import React from 'react';
import { Shield, Zap } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#06080d] text-zinc-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-xl font-bold text-emerald-400 font-mono">CryptoPulse Quant Orderbook Engine</h1>
        <p className="text-xs text-zinc-400 font-mono">High-frequency algorithmic liquidity telemetry.</p>
      </div>
    </div>
  );
}
`;

export const FINTECH_TERMINAL_APP_CODE = CRYPTOPULSE_APP_CODE;
export const FINTECH_TERMINAL_PRO_APP_CODE = CRYPTOPULSE_PRO_APP_CODE;
