import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, Dices, RefreshCw, Sparkles, Trophy, Clock, ShieldCheck, Github, History, BarChart3, ChevronRight, X, Info, Share2, Trash2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const RED_NUMBERS = [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46];
const BLUE_NUMBERS = [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48];
const GREEN_NUMBERS = [5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49];

function getNumberColor(num: number) {
  if (RED_NUMBERS.includes(num)) return 'bg-red-500 text-white border-red-600 shadow-red-500/20';
  if (BLUE_NUMBERS.includes(num)) return 'bg-blue-500 text-white border-blue-600 shadow-blue-500/20';
  if (GREEN_NUMBERS.includes(num)) return 'bg-green-500 text-white border-green-600 shadow-green-500/20';
  return 'bg-stone-200 text-stone-800 border-stone-300';
}

interface DrawRecord {
  id: number;
  draw_date: string;
  numbers: number[];
  special: number;
  created_at: number;
}

export default function App() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [drawResult, setDrawResult] = useState<DrawRecord | null>(null);
  const [history, setHistory] = useState<DrawRecord[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number}>({h: 0, m: 0, s: 0});
  const [isDBReady, setIsDBReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'predict' | 'history' | 'stats'>('predict');
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const initAndFetch = async () => {
      try {
        await fetch('/api/init');
        setIsDBReady(true);
        fetchLatestDraw();
        fetchHistory();
      } catch (e) {
        console.error("Failed to initialize or fetch data", e);
      }
    };
    initAndFetch();
  }, []);

  const fetchLatestDraw = async () => {
    try {
      const res = await fetch('/api/latest');
      const data = await res.json();
      if (data.success && data.draw) {
        setDrawResult(data.draw);
      }
    } catch (e) {
      console.error("Failed to fetch latest draw", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const drawTime = new Date();
      drawTime.setHours(21, 30, 0, 0);
      if (now > drawTime) drawTime.setDate(drawTime.getDate() + 1);
      const diff = drawTime.getTime() - now.getTime();
      
      if (diff <= 0 || diff > 24 * 60 * 60 * 1000) {
        setTimeLeft({h: 0, m: 0, s: 0});
        if (diff > -5000 && diff <= 0) {
          fetchLatestDraw();
          fetchHistory();
        }
      } else {
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({h, m, s});
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else if (selectedNumbers.length < 6) {
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  const quickPick = () => {
    const nums: number[] = [];
    while (nums.length < 6) {
      const r = Math.floor(Math.random() * 49) + 1;
      if (!nums.includes(r)) nums.push(r);
    }
    setSelectedNumbers(nums.sort((a, b) => a - b));
    setPrediction(null);
  };

  const getAIPrediction = async () => {
    if (selectedNumbers.length !== 6) return;
    setIsPredicting(true);
    setPrediction(null);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `用户选择了以下6个六合彩号码：${selectedNumbers.join(', ')}。请用中文给出一个简短、有趣、带有一点神秘色彩的运势预测（大约50-80字），告诉他们这组号码的玄机或今天的财运如何。不要说这只是游戏，要像个算命大师一样。`,
      });
      setPrediction(response.text || '天机不可泄漏，这组号码似乎蕴含着神秘的力量...');
    } catch (error) {
      console.error(error);
      setPrediction('大师正在闭关，请稍后再试。');
    } finally {
      setIsPredicting(false);
    }
  };

  const forceDraw = async () => {
    setIsDrawing(true);
    try {
      const res = await fetch('/api/draw', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDrawResult(data.draw);
        fetchHistory();
      } else {
        alert(data.message || '开奖失败');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDrawing(false);
    }
  };

  const getMatchResult = (selected: number[], draw: DrawRecord) => {
    const matches = selected.filter(n => draw.numbers.includes(n)).length;
    const specialMatch = selected.includes(draw.special);
    if (matches === 6) return '头奖';
    if (matches === 5 && specialMatch) return '二奖';
    if (matches === 5) return '三奖';
    if (matches === 4 && specialMatch) return '四奖';
    if (matches === 4) return '五奖';
    if (matches === 3 && specialMatch) return '六奖';
    if (matches === 3) return '七奖';
    return null;
  };

  const stats = useMemo(() => {
    const counts: Record<number, number> = {};
    history.forEach(d => {
      [...d.numbers, d.special].forEach(n => {
        counts[n] = (counts[n] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([num, count]) => ({ num: parseInt(num), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [history]);

  return (
    <div className="min-h-screen bg-[#0a0502] text-stone-100 font-sans selection:bg-amber-500/30 pb-24 relative overflow-hidden">
      
      {/* Immersive Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-amber-900/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] bg-purple-900/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 relative z-10">
        
        {/* Header Section */}
        <header className="mb-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 mr-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                玄机开奖系统
              </h1>
              <p className="text-stone-500 text-sm font-medium tracking-wide uppercase">Mark Six Prediction & Oracle</p>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
            <button 
              onClick={() => setActiveTab('predict')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center ${activeTab === 'predict' ? 'bg-white/10 text-white shadow-inner' : 'text-stone-400 hover:text-stone-200'}`}
            >
              <Wand2 className="w-4 h-4 mr-2" /> 运势测算
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center ${activeTab === 'history' ? 'bg-white/10 text-white shadow-inner' : 'text-stone-400 hover:text-stone-200'}`}
            >
              <History className="w-4 h-4 mr-2" /> 往期开奖
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center ${activeTab === 'stats' ? 'bg-white/10 text-white shadow-inner' : 'text-stone-400 hover:text-stone-200'}`}
            >
              <BarChart3 className="w-4 h-4 mr-2" /> 数据统计
            </button>
          </div>
        </header>

        {/* Countdown Banner - Atmospheric Style */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-purple-600/20 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Clock className="w-48 h-48" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full mb-4 border border-amber-500/20 uppercase tracking-widest">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  Next Draw Countdown
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                  距离开奖还有
                </h2>
                <p className="text-stone-400 font-medium">每日 21:30 准时开奖，天机在此</p>
              </div>
              
              <div className="flex justify-center md:justify-end items-center gap-6">
                {[
                  { val: timeLeft.h, label: 'Hours' },
                  { val: timeLeft.m, label: 'Mins' },
                  { val: timeLeft.s, label: 'Secs' }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="w-20 md:w-24 h-24 md:h-28 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-xl">
                      <span className="text-4xl md:text-5xl font-black font-mono text-white">
                        {item.val.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-stone-500 mt-3 uppercase tracking-[0.2em]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'predict' && (
            <motion.div 
              key="predict"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Number Selection Grid */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/10 shadow-xl">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold flex items-center text-white">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mr-3 text-sm text-amber-400">01</div>
                      挑选你的心水号码
                    </h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={quickPick}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-stone-300 rounded-xl transition-all flex items-center text-sm font-bold border border-white/5"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" /> 机选
                      </button>
                      <button 
                        onClick={() => setSelectedNumbers([])}
                        className="px-4 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-stone-500 rounded-xl transition-all text-sm font-bold border border-white/5"
                      >
                        清空
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-3">
                    {Array.from({ length: 49 }, (_, i) => i + 1).map(num => {
                      const isSelected = selectedNumbers.includes(num);
                      return (
                        <motion.button
                          key={num}
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleNumber(num)}
                          disabled={!isSelected && selectedNumbers.length >= 6}
                          className={`
                            relative aspect-square rounded-2xl flex items-center justify-center text-sm md:text-base font-black transition-all duration-300
                            ${isSelected 
                              ? `${getNumberColor(num)} shadow-2xl scale-110 z-10 ring-4 ring-white/20` 
                              : 'bg-white/5 text-stone-500 border border-white/5 hover:bg-white/10 hover:text-stone-200'}
                            ${!isSelected && selectedNumbers.length >= 6 ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          {num}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Prediction & Oracle Column */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/10 shadow-xl">
                  <h2 className="text-xl font-bold mb-6 flex items-center text-white">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mr-3 text-sm text-amber-400">02</div>
                    已选号码 ({selectedNumbers.length}/6)
                  </h2>
                  
                  <div className="flex flex-wrap gap-4 min-h-[80px] items-center justify-center bg-black/20 rounded-2xl p-6 border border-white/5">
                    <AnimatePresence>
                      {selectedNumbers.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          className="flex flex-col items-center text-stone-600"
                        >
                          <Info className="w-6 h-6 mb-2 opacity-20" />
                          <span className="text-xs font-bold uppercase tracking-widest">Select 6 Numbers</span>
                        </motion.div>
                      ) : (
                        selectedNumbers.map(num => (
                          <motion.div
                            key={num}
                            initial={{ scale: 0, opacity: 0, rotate: -45 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${getNumberColor(num)} shadow-xl`}
                          >
                            {num}
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={getAIPrediction}
                      disabled={selectedNumbers.length !== 6 || isPredicting}
                      className={`flex-1 py-5 rounded-2xl font-black text-lg flex items-center justify-center transition-all relative overflow-hidden group ${
                        selectedNumbers.length === 6
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-2xl shadow-orange-500/30'
                          : 'bg-white/5 text-stone-600 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]"></div>
                      {isPredicting ? (
                        <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                      ) : (
                        <Wand2 className="w-6 h-6 mr-3" />
                      )}
                      {isPredicting ? '正在窥探天机...' : '大师测算'}
                    </button>
                    
                    <button
                      onClick={() => {
                        const text = `🔮 我的六合彩预测号码：${selectedNumbers.join(', ')}\n快来试试你的运气吧！`;
                        navigator.clipboard.writeText(text);
                        alert('预测号码已复制到剪贴板！');
                      }}
                      disabled={selectedNumbers.length !== 6}
                      className="px-6 bg-white/5 hover:bg-white/10 disabled:opacity-20 rounded-2xl transition-all border border-white/10 text-stone-400 hover:text-white"
                      title="分享预测"
                    >
                      <Share2 className="w-6 h-6" />
                    </button>

                    <button
                      onClick={() => setSelectedNumbers([])}
                      disabled={selectedNumbers.length === 0}
                      className="px-6 bg-white/5 hover:bg-white/10 disabled:opacity-20 rounded-2xl transition-all border border-white/10 text-stone-400 hover:text-white"
                      title="重置选择"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {prediction && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 rounded-[2rem] p-8 border border-amber-500/20 relative overflow-hidden shadow-2xl"
                    >
                      <div className="absolute -top-10 -right-10 opacity-5">
                        <Wand2 className="w-40 h-40" />
                      </div>
                      <div className="flex items-center mb-4">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-3 animate-ping"></div>
                        <h3 className="text-amber-400 font-black uppercase tracking-[0.2em] text-xs">Oracle Response</h3>
                      </div>
                      <p className="text-stone-200 leading-relaxed font-serif italic text-lg relative z-10">
                        “{prediction}”
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {drawResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/10 shadow-xl"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-white font-bold flex items-center">
                        <Trophy className="w-5 h-5 mr-3 text-amber-400" /> 最新开奖
                      </h3>
                      <span className="text-[10px] font-black text-stone-500 bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">
                        {drawResult.draw_date}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mb-6 justify-center">
                      {drawResult.numbers.map(num => (
                        <div key={num} className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${getNumberColor(num)} shadow-lg`}>
                          {num}
                        </div>
                      ))}
                      <div className="w-10 h-10 flex items-center justify-center text-stone-600 font-black text-xl">+</div>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm ${getNumberColor(drawResult.special)} shadow-[0_0_20px_rgba(255,255,255,0.2)] ring-2 ring-white/30`}>
                        {drawResult.special}
                      </div>
                    </div>

                    {selectedNumbers.length === 6 && (
                      <div className="bg-black/40 rounded-2xl p-6 border border-white/5 text-center">
                        <div className="text-2xl font-black text-amber-400 mb-1">
                          {getMatchResult(selectedNumbers, drawResult) || '未中奖'}
                        </div>
                        <div className="text-stone-500 text-xs font-bold uppercase tracking-widest">
                          Matched {selectedNumbers.filter(n => drawResult.numbers.includes(n)).length} Numbers
                          {selectedNumbers.includes(drawResult.special) ? ' + Special' : ''}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-2xl font-black text-white">往期开奖记录</h2>
                <div className="text-stone-500 text-xs font-bold uppercase tracking-widest">Last 20 Draws</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 text-stone-500 text-[10px] uppercase font-black tracking-[0.2em]">
                      <th className="px-8 py-4">日期</th>
                      <th className="px-8 py-4">开奖号码</th>
                      <th className="px-8 py-4">特别号</th>
                      <th className="px-8 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((record) => (
                      <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6 font-mono text-stone-300">{record.draw_date}</td>
                        <td className="px-8 py-6">
                          <div className="flex gap-2">
                            {record.numbers.map(n => (
                              <div key={n} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${getNumberColor(n)}`}>
                                {n}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${getNumberColor(record.special)} ring-1 ring-white/20`}>
                            {record.special}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-500 hover:text-white">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
                <h2 className="text-xl font-black text-white mb-8 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-3 text-amber-400" /> 热门号码频率
                </h2>
                <div className="space-y-6">
                  {stats.map((item, idx) => (
                    <div key={item.num} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${getNumberColor(item.num)}`}>
                        {item.num}
                      </div>
                      <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.count / history.length) * 100}%` }}
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
                        />
                      </div>
                      <span className="text-stone-400 font-mono text-sm">{item.count}次</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mb-6">
                  <Info className="w-10 h-10 text-amber-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-4">关于统计数据</h3>
                <p className="text-stone-400 leading-relaxed max-w-xs">
                  以上数据基于最近 20 期的开奖记录计算。号码频率仅供参考，不代表未来开奖趋势。
                </p>
                <div className="mt-8 pt-8 border-t border-white/5 w-full">
                  <div className="text-stone-500 text-[10px] font-black uppercase tracking-widest mb-4">System Status</div>
                  <div className="flex justify-around items-center">
                    <div className="flex flex-col items-center">
                      <span className="text-white font-black text-lg">{history.length}</span>
                      <span className="text-[8px] text-stone-600 uppercase tracking-widest">Records</span>
                    </div>
                    <div className="w-px h-8 bg-white/5"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-white font-black text-lg">49</span>
                      <span className="text-[8px] text-stone-600 uppercase tracking-widest">Pool Size</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer / Admin Toggle */}
        <footer className="mt-20 flex flex-col items-center gap-6">
          <div className="flex items-center gap-6 text-stone-600">
            <a href="#" className="hover:text-stone-400 transition-colors"><Github className="w-5 h-5" /></a>
            <div className="w-px h-4 bg-stone-800"></div>
            <button 
              onClick={() => setShowAdmin(!showAdmin)}
              className="text-xs font-black uppercase tracking-widest hover:text-stone-400 transition-colors"
            >
              Admin Controls
            </button>
          </div>
          
          <AnimatePresence>
            {showAdmin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full max-w-md overflow-hidden"
              >
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-bold text-sm">管理员控制台</h4>
                    <button onClick={() => setShowAdmin(false)}><X className="w-4 h-4 text-stone-500" /></button>
                  </div>
                  <button
                    onClick={forceDraw}
                    disabled={isDrawing}
                    className="w-full py-3 rounded-xl font-bold flex items-center justify-center transition-all bg-stone-800 hover:bg-stone-700 text-stone-300 border border-white/5"
                  >
                    {isDrawing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Dices className="w-4 h-4 mr-2" />}
                    立即执行开奖
                  </button>
                  <p className="text-[10px] text-stone-500 mt-3 text-center uppercase tracking-widest">
                    Manual trigger for D1 Database
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-stone-700 text-[10px] font-black uppercase tracking-[0.3em] mt-8">
            © 2026 MARK SIX ORACLE SYSTEM • CLOUDFLARE D1 POWERED
          </p>
        </footer>
      </div>

      {/* Status Indicators (Fixed Bottom) */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
        <div className="flex items-center bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-2xl">
          <div className={`w-2 h-2 rounded-full mr-2 ${isDBReady ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-stone-600'}`}></div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {isDBReady ? 'D1 Online' : 'Connecting'}
          </span>
        </div>
      </div>
    </div>
  );
}
