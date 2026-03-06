import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, Dices, RefreshCw, Sparkles, Trophy } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const RED_NUMBERS = [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46];
const BLUE_NUMBERS = [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48];
const GREEN_NUMBERS = [5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49];

function getNumberColor(num: number) {
  if (RED_NUMBERS.includes(num)) return 'bg-red-500 text-white border-red-600';
  if (BLUE_NUMBERS.includes(num)) return 'bg-blue-500 text-white border-blue-600';
  if (GREEN_NUMBERS.includes(num)) return 'bg-green-500 text-white border-green-600';
  return 'bg-gray-200 text-gray-800 border-gray-300';
}

function getNumberShadow(num: number) {
  if (RED_NUMBERS.includes(num)) return 'shadow-red-500/50';
  if (BLUE_NUMBERS.includes(num)) return 'shadow-blue-500/50';
  if (GREEN_NUMBERS.includes(num)) return 'shadow-green-500/50';
  return 'shadow-gray-500/50';
}

export default function App() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [drawResult, setDrawResult] = useState<{ numbers: number[], special: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length < 6) {
        setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
      }
    }
  };

  const clearSelection = () => {
    setSelectedNumbers([]);
    setPrediction(null);
    setDrawResult(null);
  };

  const quickPick = () => {
    const nums: number[] = [];
    while (nums.length < 6) {
      const r = Math.floor(Math.random() * 49) + 1;
      if (!nums.includes(r)) nums.push(r);
    }
    setSelectedNumbers(nums.sort((a, b) => a - b));
    setPrediction(null);
    setDrawResult(null);
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

  const simulateDraw = () => {
    if (selectedNumbers.length !== 6) return;
    setIsDrawing(true);
    setDrawResult(null);
    
    // Simulate a short delay for suspense
    setTimeout(() => {
      const nums: number[] = [];
      while (nums.length < 7) {
        const r = Math.floor(Math.random() * 49) + 1;
        if (!nums.includes(r)) nums.push(r);
      }
      const special = nums.pop()!;
      setDrawResult({ numbers: nums.sort((a, b) => a - b), special });
      setIsDrawing(false);
    }, 1500);
  };

  const getMatchResult = () => {
    if (!drawResult) return null;
    const matches = selectedNumbers.filter(n => drawResult.numbers.includes(n)).length;
    const specialMatch = selectedNumbers.includes(drawResult.special);
    
    if (matches === 6) return '头奖！太不可思议了！';
    if (matches === 5 && specialMatch) return '二奖！运气爆棚！';
    if (matches === 5) return '三奖！恭喜发财！';
    if (matches === 4 && specialMatch) return '四奖！好运连连！';
    if (matches === 4) return '五奖！小有收获！';
    if (matches === 3 && specialMatch) return '六奖！再接再厉！';
    if (matches === 3) return '七奖！回本啦！';
    return '很遗憾，这次没有中奖。';
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans selection:bg-amber-500/30">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        
        {/* Header */}
        <header className="text-center mb-10 pt-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-stone-800 rounded-full mb-4 shadow-lg border border-stone-700"
          >
            <Sparkles className="w-6 h-6 text-amber-400 mr-2" />
            <span className="text-amber-400 font-bold tracking-widest">MARK SIX</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
            六合彩预测游戏
          </h1>
          <p className="text-stone-400">选择6个号码，让AI为你测算今日财运</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Number Selection */}
          <div className="lg:col-span-7 bg-stone-800/50 rounded-3xl p-6 border border-stone-700/50 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <span className="bg-stone-700 text-stone-300 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                选择号码 ({selectedNumbers.length}/6)
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={quickPick}
                  className="px-3 py-1.5 text-sm bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg transition-colors flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" /> 机选
                </button>
                <button 
                  onClick={clearSelection}
                  className="px-3 py-1.5 text-sm bg-stone-700 hover:bg-red-900/50 hover:text-red-200 text-stone-400 rounded-lg transition-colors"
                >
                  清空
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {Array.from({ length: 49 }, (_, i) => i + 1).map(num => {
                const isSelected = selectedNumbers.includes(num);
                const colorClass = getNumberColor(num);
                const shadowClass = getNumberShadow(num);
                
                return (
                  <motion.button
                    key={num}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleNumber(num)}
                    disabled={!isSelected && selectedNumbers.length >= 6}
                    className={`
                      relative w-full aspect-square rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-200
                      ${isSelected 
                        ? `${colorClass} shadow-lg ${shadowClass} scale-110 z-10 border-2` 
                        : 'bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700 hover:text-stone-200'}
                      ${!isSelected && selectedNumbers.length >= 6 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {num}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Actions & Results */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Selected Numbers Display */}
            <div className="bg-stone-800/50 rounded-3xl p-6 border border-stone-700/50 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <span className="bg-stone-700 text-stone-300 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                你的心水号码
              </h2>
              
              <div className="flex flex-wrap gap-3 min-h-[60px] items-center justify-center bg-stone-900/50 rounded-2xl p-4 border border-stone-800">
                <AnimatePresence>
                  {selectedNumbers.length === 0 ? (
                    <motion.span 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="text-stone-500 text-sm"
                    >
                      尚未选择号码
                    </motion.span>
                  ) : (
                    selectedNumbers.map(num => (
                      <motion.div
                        key={num}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getNumberColor(num)} shadow-md ${getNumberShadow(num)}`}
                      >
                        {num}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={getAIPrediction}
                  disabled={selectedNumbers.length !== 6 || isPredicting}
                  className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center transition-all ${
                    selectedNumbers.length === 6
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-orange-500/20'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {isPredicting ? (
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-5 h-5 mr-2" />
                  )}
                  {isPredicting ? '大师正在测算...' : '大师测算运势'}
                </button>

                <button
                  onClick={simulateDraw}
                  disabled={selectedNumbers.length !== 6 || isDrawing}
                  className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center transition-all ${
                    selectedNumbers.length === 6
                      ? 'bg-stone-700 hover:bg-stone-600 text-white'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {isDrawing ? (
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Dices className="w-5 h-5 mr-2" />
                  )}
                  {isDrawing ? '正在开奖...' : '模拟开奖'}
                </button>
              </div>
            </div>

            {/* AI Prediction Result */}
            <AnimatePresence>
              {prediction && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-amber-900/40 to-orange-900/20 rounded-3xl p-6 border border-amber-700/30 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wand2 className="w-24 h-24" />
                  </div>
                  <h3 className="text-amber-400 font-bold mb-2 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" /> 大师批言
                  </h3>
                  <p className="text-stone-200 leading-relaxed relative z-10 text-sm md:text-base">
                    {prediction}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Draw Result */}
            <AnimatePresence>
              {drawResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-stone-800/80 rounded-3xl p-6 border border-stone-600 relative overflow-hidden"
                >
                  <h3 className="text-stone-300 font-bold mb-4 flex items-center">
                    <Trophy className="w-4 h-4 mr-2 text-yellow-400" /> 开奖结果
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {drawResult.numbers.map(num => (
                      <div key={num} className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${getNumberColor(num)}`}>
                        {num}
                      </div>
                    ))}
                    <div className="w-9 h-9 flex items-center justify-center text-stone-500 font-bold">+</div>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${getNumberColor(drawResult.special)} shadow-[0_0_15px_rgba(255,255,255,0.3)] border-2 border-white/50`}>
                      {drawResult.special}
                    </div>
                  </div>

                  <div className="bg-stone-900/50 rounded-xl p-4 border border-stone-700 text-center">
                    <p className="text-lg font-bold text-amber-400">
                      {getMatchResult()}
                    </p>
                    <p className="text-stone-400 text-sm mt-1">
                      命中 {selectedNumbers.filter(n => drawResult.numbers.includes(n)).length} 个正码
                      {selectedNumbers.includes(drawResult.special) ? ' + 特别号' : ''}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}
