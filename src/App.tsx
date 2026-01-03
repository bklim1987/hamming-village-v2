import { useState, useEffect } from 'react';
import { Home, Castle, Info, Users, Check, X, ScanLine, Lock } from 'lucide-react';

interface GameResult {
  hasError: boolean;
  liedCard: number | null;
  guessedNumber: number;
  syndrome: number;
  errorType: 'should_select' | 'should_not_select' | null;
}

interface ExplanationData {
  visitor: number;
  appearances: number;
  isInvited: boolean;
  housesToCheck: number[];
}

interface ShowExplanation {
  angelId: number;
  explanationData: ExplanationData[];
  housesToCheck: number[];
}

const HammingVillage = () => {
  const [step, setStep] = useState(1);
  const [isVip, setIsVip] = useState(false);

  // 检测 VIP 状态
  useEffect(() => {
    // 检查 localStorage
    const vipStatus = localStorage.getItem('hamming_vip');
    if (vipStatus === 'true') {
      setIsVip(true);
      return;
    }

    // 检查 URL 参数
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('vip') === 'true') {
      setIsVip(true);
      localStorage.setItem('hamming_vip', 'true');
    }
  }, []);

  // 非 VIP 用户只能访问 Phase 4
  useEffect(() => {
    if (!isVip && step !== 4) {
      setStep(4);
    }
  }, [isVip, step]);

  // ---------------- STEP 2 STATE ----------------
  const [activeDataBit, setActiveDataBit] = useState<number | null>(null);

  // ---------------- STEP 3 STATE ----------------
  const [activeGuardian, setActiveGuardian] = useState<number | null>(null);
  const [angelLists, setAngelLists] = useState<{ [key: number]: number[] }>({ 1: [], 2: [], 4: [] });
  const [angelDisplayLists, setAngelDisplayLists] = useState<{ [key: number]: number[] }>({ 1: [], 2: [], 4: [] });
  const [scanningAngel, setScanningAngel] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<ShowExplanation | null>(null);

  // ---------------- STEP 4 STATE (was step 5) ----------------
  const [playerSelectedCards, setPlayerSelectedCards] = useState<number[]>([]);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  // ---------------- STEP 5 STATE ----------------
  const [showSecretPanel, setShowSecretPanel] = useState(false);
  const [expandRule2, setExpandRule2] = useState(false);

  // 基础屋子数据
  const houses = [
    { id: 1, type: 'angel',    binary: [1, 0, 0], desc: '守护天使 #1' },
    { id: 2, type: 'angel',    binary: [0, 1, 0], desc: '守护天使 #2' },
    { id: 3, type: 'resident', binary: [1, 1, 0], desc: '普通居民 #3' },
    { id: 4, type: 'angel',    binary: [0, 0, 1], desc: '守护天使 #4' },
    { id: 5, type: 'resident', binary: [1, 0, 1], desc: '普通居民 #5' },
    { id: 6, type: 'resident', binary: [0, 1, 1], desc: '普通居民 #6' },
    { id: 7, type: 'resident', binary: [1, 1, 1], desc: '普通居民 #7' },
  ];

  // 居民屋子定义 & 固定的村民名单 (Magic Card Lists)
  const residentHouses = [
    {
      id: 3, bit: 1, colorClass: 'bg-rose-500', borderColor: 'border-rose-300', lightColor: 'text-rose-400',
      list: [1, 3, 5, 7, 9, 11, 13, 15]
    },
    {
      id: 5, bit: 2, colorClass: 'bg-emerald-500', borderColor: 'border-emerald-300', lightColor: 'text-emerald-400',
      list: [2, 3, 6, 7, 10, 11, 14, 15]
    },
    {
      id: 6, bit: 4, colorClass: 'bg-sky-500', borderColor: 'border-sky-300', lightColor: 'text-sky-400',
      list: [4, 5, 6, 7, 12, 13, 14, 15]
    },
    {
      id: 7, bit: 8, colorClass: 'bg-violet-500', borderColor: 'border-violet-300', lightColor: 'text-violet-400',
      list: [8, 9, 10, 11, 12, 13, 14, 15]
    },
  ];

  // 生成1-15的数字 (Step 2 使用)
  const visitors = Array.from({ length: 15 }, (_, i) => i + 1);

  // ---------------- HELPER FUNCTIONS ----------------

  const isGuarded = (house: { binary: number[] }) => {
    if (!activeGuardian) return false;
    if (activeGuardian === 1) return house.binary[0] === 1;
    if (activeGuardian === 2) return house.binary[1] === 1;
    if (activeGuardian === 4) return house.binary[2] === 1;
    return false;
  };

  const hasDataBit = (number: number, bit: number) => {
    return (number & bit) === bit;
  };

  const getBitDotColor = (bit: number) => {
    const house = residentHouses.find(h => h.bit === bit);
    return house ? house.colorClass : 'bg-slate-500';
  };

  // Step 4: 切换卡牌选择
  const toggleCardSelection = (houseId: number) => {
    if (gameResult) return;
    setPlayerSelectedCards(prev => {
      if (prev.includes(houseId)) {
        return prev.filter(id => id !== houseId);
      } else {
        return [...prev, houseId];
      }
    });
  };

  // Step 4: 计算结果
  const calculateResult = () => {
    // 根据玩家选择的卡片计算出数字
    // 天使1对应bit 1, 天使2对应bit 2, 天使4对应bit 4
    // 居民屋3对应bit 1, 居民屋5对应bit 2, 居民屋6对应bit 4, 居民屋7对应bit 8

    let syndrome = 0;

    // 检查每个校验位（天使）
    if (playerSelectedCards.includes(1)) syndrome ^= 1;
    if (playerSelectedCards.includes(2)) syndrome ^= 2;
    if (playerSelectedCards.includes(4)) syndrome ^= 4;

    // 检查数据位（居民屋）
    if (playerSelectedCards.includes(3)) syndrome ^= 3; // 3 = 011
    if (playerSelectedCards.includes(5)) syndrome ^= 5; // 5 = 101
    if (playerSelectedCards.includes(6)) syndrome ^= 6; // 6 = 110
    if (playerSelectedCards.includes(7)) syndrome ^= 7; // 7 = 111

    // 计算玩家想的数字
    let guessedNumber = 0;
    if (playerSelectedCards.includes(3)) guessedNumber |= 1;
    if (playerSelectedCards.includes(5)) guessedNumber |= 2;
    if (playerSelectedCards.includes(6)) guessedNumber |= 4;
    if (playerSelectedCards.includes(7)) guessedNumber |= 8;

    let errorPosition = syndrome;
    let hasError = syndrome !== 0;
    let liedCard: number | null = null;
    let actualNumber = guessedNumber;
    let errorType: 'should_select' | 'should_not_select' | null = null;

    if (hasError) {
      liedCard = errorPosition;

      // 计算真实答案应该包含哪些卡牌
      const shouldBeSelected = [];

      // 纠正数据位：如果错误在数据位（3,5,6,7），需要翻转那个数据位
      if (errorPosition === 3) actualNumber ^= 1;
      if (errorPosition === 5) actualNumber ^= 2;
      if (errorPosition === 6) actualNumber ^= 4;
      if (errorPosition === 7) actualNumber ^= 8;
      // 如果错误在校验位（1,2,4），actualNumber保持不变

      // 计算真实答案应该包含的所有数据位卡牌
      if (actualNumber & 1) shouldBeSelected.push(3);
      if (actualNumber & 2) shouldBeSelected.push(5);
      if (actualNumber & 4) shouldBeSelected.push(6);
      if (actualNumber & 8) shouldBeSelected.push(7);

      // 计算正确的校验位
      // 校验位基于位置编号的二进制表示来计算
      let parity1 = 0, parity2 = 0, parity4 = 0;

      // 3号位（位置3，二进制011）：会被p1(位置1)和p2(位置2)检查
      if (actualNumber & 1) {
        parity1 ^= 1;
        parity2 ^= 1;
      }
      // 5号位（位置5，二进制101）：会被p1(位置1)和p4(位置4)检查
      if (actualNumber & 2) {
        parity1 ^= 1;
        parity4 ^= 1;
      }
      // 6号位（位置6，二进制110）：会被p2(位置2)和p4(位置4)检查
      if (actualNumber & 4) {
        parity2 ^= 1;
        parity4 ^= 1;
      }
      // 7号位（位置7，二进制111）：会被p1、p2和p4检查
      if (actualNumber & 8) {
        parity1 ^= 1;
        parity2 ^= 1;
        parity4 ^= 1;
      }

      if (parity1) shouldBeSelected.push(1);
      if (parity2) shouldBeSelected.push(2);
      if (parity4) shouldBeSelected.push(4);

      // 判断错误类型：比较用户的选择和正确答案
      const shouldSelect = shouldBeSelected.includes(liedCard);
      const didSelect = playerSelectedCards.includes(liedCard);

      // 应该选但没选 vs 不应该选但选了
      if (shouldSelect && !didSelect) {
        errorType = 'should_select';
      } else if (!shouldSelect && didSelect) {
        errorType = 'should_not_select';
      }
    }

    setGameResult({
      hasError,
      liedCard,
      guessedNumber: actualNumber,
      syndrome,
      errorType
    });
  };

  // Step 4: 重置游戏
  const resetGame = () => {
    setPlayerSelectedCards([]);
    setGameResult(null);
  };

  // Step 3: 天使工作逻辑（带动画）
  const performAngelScanStep3 = (angelId: number) => {
    // 如果天使已经有名单，清空它
    if (angelLists[angelId].length > 0) {
      setAngelLists(prev => ({ ...prev, [angelId]: [] }));
      setAngelDisplayLists(prev => ({ ...prev, [angelId]: [] }));
      setShowExplanation(null);
      return;
    }

    // 如果天使没有名单，执行扫描任务
    setScanningAngel(angelId);

    // 确定该天使管辖的屋子
    let housesToCheck: number[] = [];
    if (angelId === 1) housesToCheck = [3, 5, 7];
    if (angelId === 2) housesToCheck = [3, 6, 7];
    if (angelId === 4) housesToCheck = [5, 6, 7];

    // 遍历所有15位村民，并记录详细信息
    const invitedVisitors: number[] = [];
    const explanationData: ExplanationData[] = [];

    for (let visitor = 1; visitor <= 15; visitor++) {
      let appearances = 0;

      // 检查该村民在管辖屋子的名单中出现次数
      housesToCheck.forEach(houseId => {
        const house = residentHouses.find(h => h.id === houseId);
        if (house && house.list.includes(visitor)) {
          appearances++;
        }
      });

      const isInvited = appearances % 2 !== 0;

      // 单数次 → 邀请
      if (isInvited) {
        invitedVisitors.push(visitor);
      }

      // 记录前几个村民的说明（用于展示）
      if (explanationData.length < 6) {
        explanationData.push({
          visitor,
          appearances,
          isInvited,
          housesToCheck
        });
      }
    }

    // 保存完整名单
    setAngelLists(prev => ({ ...prev, [angelId]: invitedVisitors }));

    // 以每秒2个的速度显示数字（500ms一个）
    invitedVisitors.forEach((num, index) => {
      setTimeout(() => {
        setAngelDisplayLists(prev => ({
          ...prev,
          [angelId]: [...prev[angelId], num]
        }));

        // 最后一个数字显示完成后，显示解释
        if (index === invitedVisitors.length - 1) {
          setTimeout(() => {
            setScanningAngel(null);
            setShowExplanation({
              angelId,
              explanationData,
              housesToCheck
            });
          }, 300);
        }
      }, index * 500);
    });
  };

  // ---------------- RENDER ----------------

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-slate-900 p-4 font-sans text-slate-100">

      {/* Navigation */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            汉明码读心术
          </h1>
          <p className="text-slate-400 text-base mt-1">
            {step === 1 && 'Phase 1: 汉明村的门牌号'}
            {step === 2 && 'Phase 2: 村民的DNA'}
            {step === 3 && 'Phase 3: 守护天使的责任'}
            {step === 4 && 'Phase 4: 读心术与纠错'}
            {step === 5 && 'Phase 5: 大脑风暴'}
          </p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(s => {
            const isLocked = !isVip && s !== 4;
            return (
              <button
                key={s}
                onClick={() => !isLocked && setStep(s)}
                disabled={isLocked}
                className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                  isLocked
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : step === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {isLocked && <Lock size={14} />}
                Phase {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== STEP 1 CONTENT ==================== */}
      {step === 1 && (
        <div className="w-full max-w-7xl flex flex-col items-center animate-in fade-in duration-500">
          <div className="text-center mb-6">
            <p className="text-base text-slate-300 leading-relaxed">
              在汉明村，有<strong className="text-amber-400">3间天使屋</strong>和<strong className="text-blue-400">4间村民屋</strong>，屋子上方有<span className="text-blue-400 font-bold">4</span>、<span className="text-green-400 font-bold">2</span>、<span className="text-red-400 font-bold">1</span>的加法组合，表示门牌1号到7号。
              <br/>
              比如：5 = <span className="text-blue-400 font-bold">4</span> + <span className="text-red-400 font-bold">1</span>，因此5号屋亮着<span className="text-blue-400 font-bold">4号</span>和<span className="text-red-400 font-bold">1号</span>灯。
            </p>
          </div>

          <div className="flex justify-center gap-3 mb-8">
            {houses.map((house) => {
              const isAngel = house.type === 'angel';

              let iconColor = 'text-slate-600';
              let residentHouseDef = null;

              if (!isAngel) {
                const bitMap: { [key: number]: number } = { 3: 1, 5: 2, 6: 4, 7: 8 };
                const bit = bitMap[house.id];
                residentHouseDef = residentHouses.find(r => r.bit === bit);
                if (residentHouseDef) {
                  iconColor = residentHouseDef.lightColor;
                }
              }

              return (
                <div
                  key={house.id}
                  className="flex flex-col items-center p-4 rounded-xl transition-all duration-500 relative border-2 bg-slate-800/50 border-slate-700"
                  style={{ width: '120px', minHeight: '240px' }}
                >
                  <div className="flex gap-2 mb-3 bg-slate-950/50 p-2 rounded-lg z-10">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[2] ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>4</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[1] ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>2</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[0] ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>1</div>
                  </div>

                  <div className="mb-2">
                    {isAngel ? (
                      <Castle size={36} className="text-amber-400" />
                    ) : (
                      <Home size={36} className={iconColor} />
                    )}
                  </div>

                  <div className="text-base font-bold text-white mb-3">
                    {house.id}号{isAngel ? '天使' : '屋'}
                  </div>

                  <div className="w-full bg-slate-900/60 rounded p-2 flex items-center justify-center h-20 border border-slate-700/50">
                    <span className="text-xs text-slate-500 italic text-center">
                      {house.desc}
                    </span>
                  </div>

                  {!isAngel && residentHouseDef && (
                    <div className="mt-2 flex items-center justify-center">
                      <span className={`text-xs font-bold ${residentHouseDef.lightColor}`}>DNA: {residentHouseDef.bit}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== STEP 2 CONTENT ==================== */}
      {step === 2 && (
        <div className="w-full max-w-6xl flex flex-col items-center animate-in slide-in-from-right duration-500">
          <div className="text-center mb-6">
            <p className="text-base text-slate-300 leading-relaxed">
              <strong className="text-rose-400">3号屋</strong>：只欢迎身上有<strong className="text-rose-400">1号DNA</strong>的村民。<br/>
              <strong className="text-emerald-400">5号屋</strong>：只欢迎身上有<strong className="text-emerald-400">2号DNA</strong>的村民。<br/>
              <strong className="text-sky-400">6号屋</strong>：只欢迎身上有<strong className="text-sky-400">4号DNA</strong>的村民。<br/>
              <strong className="text-violet-400">7号屋</strong>：只欢迎身上有<strong className="text-violet-400">8号DNA</strong>的村民。
              <br/><br/>
              比如<strong className="text-white">10号村民</strong>带有<strong className="text-emerald-400">2号</strong>和<strong className="text-violet-400">8号DNA</strong>，因此可以居住在 <strong className="text-emerald-400">5号</strong>和<strong className="text-violet-400">7号屋</strong>。
              <br/>
              <span className="text-slate-400 mt-2 block">把鼠标悬停在屋子上，看看这间屋子欢迎哪几位村民。</span>
            </p>
          </div>

          {/* 7间屋子 */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {houses.map((house) => {
              const isAngel = house.type === 'angel';
              let iconColor = 'text-slate-600';
              let residentHouseDef = null;
              let houseList: number[] = [];

              if (!isAngel) {
                const bitMap: { [key: number]: number } = { 3: 1, 5: 2, 6: 4, 7: 8 };
                const bit = bitMap[house.id];
                residentHouseDef = residentHouses.find(r => r.bit === bit);
                if (residentHouseDef) {
                  iconColor = residentHouseDef.lightColor;
                  houseList = residentHouseDef.list;
                }
              }

              const isActive = !isAngel && residentHouseDef && activeDataBit === residentHouseDef.bit;

              return (
                <button
                  key={house.id}
                  onMouseEnter={() => !isAngel && residentHouseDef ? setActiveDataBit(residentHouseDef.bit) : null}
                  onMouseLeave={() => setActiveDataBit(null)}
                  disabled={isAngel}
                  className={`
                    relative flex flex-col items-center p-4 rounded-xl transition-all duration-300 border-2
                    ${isActive ? 'bg-slate-800/50 border-white scale-105 shadow-[0_0_30px_rgba(255,255,255,0.5)] z-10' : 'bg-slate-800/50 border-slate-700'}
                    ${!isAngel ? 'hover:scale-105 cursor-pointer' : 'cursor-default opacity-50'}
                  `}
                  style={{ width: '140px', minHeight: '280px' }}
                >
                  <div className="flex gap-2 mb-3 bg-slate-950/50 p-2 rounded-lg z-10">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[2] ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>4</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[1] ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>2</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[0] ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>1</div>
                  </div>

                  <div className="mb-2">
                    {isAngel ? (
                      <Castle size={40} className="text-amber-400" />
                    ) : (
                      <Home size={40} className={iconColor} />
                    )}
                  </div>

                  <div className="text-lg font-bold text-white mb-3">
                    {house.id}号{isAngel ? '天使' : '屋'}
                  </div>

                  <div className="w-full bg-slate-900/60 rounded p-2 flex flex-wrap gap-1 justify-center content-start h-32 overflow-auto border border-slate-700/50">
                    {!isAngel && houseList.length > 0 ? (
                      houseList.map((num: number) => (
                        <span
                          key={num}
                          className="text-xs w-6 h-6 flex items-center justify-center rounded font-bold bg-white text-slate-900"
                        >
                          {num}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic flex items-center justify-center h-full">
                        {isAngel ? '天使屋' : ''}
                      </span>
                    )}
                  </div>

                  {!isAngel && residentHouseDef && (
                    <div className="mt-2 flex items-center justify-center">
                      <span className={`text-sm font-bold ${residentHouseDef.lightColor}`}>DNA: {residentHouseDef.bit}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 15位村民 */}
          <div className="w-full bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-200">
              <Users className="text-blue-400" /> 15位村民
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-3">
              {visitors.map((num) => {
                const isActive = activeDataBit ? hasDataBit(num, activeDataBit) : false;
                return (
                  <div key={num} className={`aspect-square rounded-lg flex flex-col items-center justify-center border-2 transition-all duration-300 ${isActive ? 'bg-white text-slate-900 border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)] z-10' : 'bg-slate-700/50 border-slate-600 text-slate-400 opacity-60'}`}>
                    <span className="text-lg font-bold">{num}</span>
                    <div className="flex gap-1 mt-1">
                      {[8, 4, 2, 1].map((b) => {
                        const hasBit = hasDataBit(num, b);
                        const dotColor = getBitDotColor(b);
                        return <div key={b} className={`w-1.5 h-1.5 rounded-full ${hasBit ? dotColor : 'bg-transparent'}`} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== STEP 3 CONTENT ==================== */}
      {step === 3 && (
        <div className="w-full max-w-7xl flex flex-col items-center animate-in fade-in duration-500">
          <div className="text-center mb-6">
            <p className="text-base text-slate-300 leading-relaxed">
              三位守护天使负责保护村民的安全。每位天使都有自己的守护范围。点击天使按钮，让他们扫描并生成自己的村民名单。
            </p>
          </div>

          <div className="flex justify-center gap-3 mb-8">
            {houses.map((house) => {
              const guarded = isGuarded(house);
              const isAngel = house.type === 'angel';

              let iconColor = 'text-slate-600';
              let residentHouseDef = null;
              let houseList: number[] = [];
              let displayList: number[] = [];

              if (!isAngel) {
                const bitMap: { [key: number]: number } = { 3: 1, 5: 2, 6: 4, 7: 8 };
                const bit = bitMap[house.id];
                residentHouseDef = residentHouses.find(r => r.bit === bit);
                if (residentHouseDef) {
                  iconColor = residentHouseDef.lightColor;
                  houseList = residentHouseDef.list;
                }
              } else {
                displayList = angelDisplayLists[house.id] || [];
              }

              const isScanning = scanningAngel === house.id;
              const hasVisitorList = isAngel ? angelDisplayLists[house.id].length > 0 : false;

              return (
                <div
                  key={house.id}
                  className={`
                    flex flex-col items-center p-4 rounded-xl transition-all duration-500 relative border-2
                    ${guarded ? 'bg-indigo-900/60 scale-110 shadow-[0_0_30px_rgba(99,102,241,0.5)] border-indigo-400' : 'bg-slate-800/50 border-slate-700 scale-100'}
                    ${isAngel && hasVisitorList ? 'border-amber-600' : ''}
                  `}
                  style={{ width: '140px', minHeight: '280px' }}
                >
                  <div className="flex gap-2 mb-3 bg-slate-950/50 p-2 rounded-lg z-10">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[2] ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>4</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[1] ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>2</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[0] ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>1</div>
                  </div>

                  {isAngel && isScanning && (
                    <div className="absolute top-0 left-0 right-0 h-24 flex items-center justify-center bg-black/20 rounded-xl backdrop-blur-sm z-30">
                      <ScanLine className="animate-pulse text-yellow-400" size={32} />
                    </div>
                  )}

                  <div className={`mb-2 ${guarded ? 'translate-y-[-2px]' : ''}`}>
                    {isAngel ? (
                      <Castle size={36} className={`${guarded ? 'text-amber-300' : 'text-amber-400'}`} />
                    ) : (
                      <Home size={36} className={`${guarded ? 'text-blue-300' : iconColor}`} />
                    )}
                  </div>

                  <div className="text-base font-bold text-white mb-3">
                    {house.id}号{isAngel ? '天使' : '屋'}
                  </div>

                  <div className="w-full bg-slate-900/60 rounded p-2 flex flex-wrap gap-1 justify-center content-start h-32 overflow-auto border border-slate-700/50">
                    {isAngel ? (
                      displayList.length > 0 ? (
                        displayList.map((num: number) => (
                          <span
                            key={num}
                            className="text-xs w-6 h-6 flex items-center justify-center rounded font-bold bg-amber-400 text-slate-900 animate-in zoom-in-95 duration-300"
                          >
                            {num}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic flex items-center justify-center h-full">
                          等待扫描
                        </span>
                      )
                    ) : (
                      houseList.length > 0 ? (
                        houseList.map((num: number) => (
                          <span
                            key={num}
                            className="text-xs w-6 h-6 flex items-center justify-center rounded font-bold bg-white text-slate-900"
                          >
                            {num}
                          </span>
                        ))
                      ) : null
                    )}
                  </div>

                  {!isAngel && residentHouseDef && (
                    <div className="mt-2 flex items-center justify-center">
                      <span className={`text-xs font-bold ${residentHouseDef.lightColor}`}>DNA: {residentHouseDef.bit}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-full bg-slate-800/80 backdrop-blur rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
              <Info size={20} className="text-blue-400" />
              查看守护范围
            </h3>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <button
                onClick={() => {
                  if (activeGuardian === 4) {
                    setActiveGuardian(null);
                  } else {
                    setActiveGuardian(4);
                    performAngelScanStep3(4);
                  }
                }}
                disabled={scanningAngel !== null}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 transition-all ${activeGuardian === 4 ? 'bg-blue-900/30 border-blue-500 text-blue-200' : 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300'} ${scanningAngel !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]"></div>
                <span>4号天使守护亮着蓝灯的屋子</span>
              </button>
              <button
                onClick={() => {
                  if (activeGuardian === 2) {
                    setActiveGuardian(null);
                  } else {
                    setActiveGuardian(2);
                    performAngelScanStep3(2);
                  }
                }}
                disabled={scanningAngel !== null}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 transition-all ${activeGuardian === 2 ? 'bg-green-900/30 border-green-500 text-green-200' : 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300'} ${scanningAngel !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]"></div>
                <span>2号天使守护亮着绿灯的屋子</span>
              </button>
              <button
                onClick={() => {
                  if (activeGuardian === 1) {
                    setActiveGuardian(null);
                  } else {
                    setActiveGuardian(1);
                    performAngelScanStep3(1);
                  }
                }}
                disabled={scanningAngel !== null}
                className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 transition-all ${activeGuardian === 1 ? 'bg-red-900/30 border-red-500 text-red-200' : 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300'} ${scanningAngel !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
                <span>1号天使守护亮着红灯的屋子</span>
              </button>
            </div>

            {activeGuardian && (
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600 animate-in fade-in duration-300">
                {activeGuardian === 4 && (
                  <div className="text-slate-300 leading-relaxed">
                    <p className="mb-2">
                      当她发现有村民的地址只有<strong className="text-blue-400">单数个"4"(蓝灯)</strong>，她就会邀请这位村民来做客，让这位村民的地址共有<strong className="text-blue-400">双数个"4"(蓝灯)</strong>。
                    </p>
                    <p className="text-blue-300">
                      在她的守护下，每个村民的地址都有<strong>双数个蓝灯</strong>。
                    </p>
                  </div>
                )}
                {activeGuardian === 2 && (
                  <div className="text-slate-300 leading-relaxed">
                    <p className="mb-2">
                      当她发现有村民的地址只有<strong className="text-green-400">单数个"2"(绿灯)</strong>，她就会邀请这位村民来做客，让这位村民的地址共有<strong className="text-green-400">双数个"2"(绿灯)</strong>。
                    </p>
                    <p className="text-green-300">
                      在她的守护下，每个村民的地址都有<strong>双数个绿灯</strong>。
                    </p>
                  </div>
                )}
                {activeGuardian === 1 && (
                  <div className="text-slate-300 leading-relaxed">
                    <p className="mb-2">
                      当她发现有村民的地址只有<strong className="text-red-400">单数个"1"(红灯)</strong>，她就会邀请这位村民来做客，让这位村民的地址共有<strong className="text-red-400">双数个"1"(红灯)</strong>。
                    </p>
                    <p className="text-red-300">
                      在她的守护下，每个村民的地址都有<strong>双数个红灯</strong>。
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Explanation Section */}
          {showExplanation && (
            <div className="w-full max-w-4xl mt-6 bg-slate-800/80 rounded-xl p-6 border border-slate-700 animate-in fade-in duration-500">
              <h3 className="text-xl font-bold mb-4 text-amber-400 flex items-center gap-2">
                <Info size={20} />
                {showExplanation.angelId}号天使的工作原理
              </h3>
              <p className="text-base text-slate-300 mb-4">
                {showExplanation.angelId}号天使负责管理 <strong className="text-blue-400">{showExplanation.housesToCheck.join('、')}号屋</strong> 的村民名单。
                他的规则是：如果一个村民在<strong className="text-green-400">单数个</strong>名单上出现，就邀请；如果在<strong className="text-red-400">双数个</strong>名单上出现，就不邀请。
              </p>
              <div className="space-y-2">
                {showExplanation.explanationData.map((data: ExplanationData, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      data.isInvited
                        ? 'bg-green-900/20 border border-green-700/50'
                        : 'bg-slate-700/20 border border-slate-600/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">
                      {data.visitor}
                    </div>
                    <div className="flex-1">
                      <span className="text-base text-slate-200">
                        {showExplanation.angelId}号天使发现 <strong className="text-white">{data.visitor}号村民</strong> 出现在
                        <strong className={data.appearances % 2 !== 0 ? 'text-green-400' : 'text-red-400'}>
                          {' '}{data.appearances}个{data.appearances % 2 !== 0 ? '(单数个)' : '(双数个)'}
                        </strong> 名单上，
                        {data.isInvited ? (
                          <span className="text-green-300">因此<strong>邀请</strong>他来作客</span>
                        ) : (
                          <span className="text-slate-400">因此<strong>不</strong>邀请他</span>
                        )}
                      </span>
                    </div>
                    {data.isInvited ? (
                      <Check size={20} className="text-green-400" />
                    ) : (
                      <X size={20} className="text-slate-500" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-4">
                以此类推，所有15位村民都按照这个规则进行筛选...
              </p>
            </div>
          )}

        </div>
      )}

      {/* ==================== STEP 4 CONTENT ==================== */}
      {step === 4 && (
        <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-500">

          <div className="text-center mb-6 bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-3 text-white">汉明码读心术</h2>
            <p className="text-slate-300 mb-2">
              <strong>游戏规则：</strong>
            </p>
            <ol className="text-left text-slate-300 space-y-2 max-w-2xl mx-auto">
              <li>1. 在心里默默想一个 <strong className="text-blue-400">1 到 15</strong> 之间的数字</li>
              <li>2. 查看下方的7张卡牌，如果你想的数字在卡牌的名单中，就<strong className="text-green-400">点击</strong>该卡牌</li>
              <li>3. 你可以在<strong className="text-red-400">任意一张卡牌上说谎</strong>（或者诚实回答所有卡牌）</li>
              <li>4. 点击<strong className="text-amber-400">确定</strong>按钮，系统会告诉你：你想的数字是多少，以及你是否说谎</li>
            </ol>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {houses.map((house) => {
              const isAngel = house.type === 'angel';
              const isSelected = playerSelectedCards.includes(house.id);

              let houseList: number[] = [];
              let houseColorClass = 'bg-slate-800/50';
              let houseBorderColor = 'border-slate-700';

              let iconColor = 'text-slate-600';
              let residentHouseDef = null;

              if (isAngel) {
                houseList = angelLists[house.id] || [];
                if (houseList.length === 0) {
                  houseList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].filter(num => {
                    let housesToCheck: number[] = [];
                    if (house.id === 1) housesToCheck = [3, 5, 7];
                    if (house.id === 2) housesToCheck = [3, 6, 7];
                    if (house.id === 4) housesToCheck = [5, 6, 7];

                    let appearances = 0;
                    housesToCheck.forEach(houseId => {
                      const residentHouse = residentHouses.find(h => h.id === houseId);
                      if (residentHouse && residentHouse.list.includes(num)) {
                        appearances++;
                      }
                    });
                    return appearances % 2 !== 0;
                  });
                }
              } else {
                const bitMap: { [key: number]: number } = { 3: 1, 5: 2, 6: 4, 7: 8 };
                const bit = bitMap[house.id];
                residentHouseDef = residentHouses.find(r => r.bit === bit);
                if (residentHouseDef) {
                  houseList = residentHouseDef.list;
                  houseColorClass = 'bg-slate-800/50';
                  houseBorderColor = 'border-slate-700';
                  iconColor = residentHouseDef.lightColor;
                }
              }

              const isLiedCard = gameResult && gameResult.liedCard === house.id;

              return (
                <button
                  key={house.id}
                  onClick={() => toggleCardSelection(house.id)}
                  disabled={!!gameResult}
                  className={`
                    relative flex flex-col items-center p-4 rounded-xl transition-all duration-300
                    ${houseColorClass} border-2 ${houseBorderColor}
                    ${isSelected ? 'ring-4 ring-green-400 scale-105 shadow-[0_0_30px_rgba(34,197,94,0.5)]' : 'hover:scale-105'}
                    ${isLiedCard ? 'ring-4 ring-red-500 animate-pulse' : ''}
                    ${gameResult ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                  `}
                  style={{ width: '140px', minHeight: '280px' }}
                >

                  {isSelected && !gameResult && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white z-10">
                      <Check size={20} className="text-white" />
                    </div>
                  )}

                  {isLiedCard && gameResult && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500/90 py-2 rounded-t-xl z-20 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {gameResult.errorType === 'should_select' ? '应选未选' : '不应选但选了'}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 mb-3 bg-slate-950/50 p-2 rounded-lg z-10">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[2] ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>4</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[1] ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>2</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[0] ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>1</div>
                  </div>

                  <div className="mb-2">
                    {isAngel ? (
                      <Castle size={40} className="text-amber-400" />
                    ) : (
                      <Home size={40} className={iconColor} />
                    )}
                  </div>

                  <div className="text-lg font-bold text-white mb-3">
                    {house.id}号{isAngel ? '天使' : '屋'}
                  </div>

                  <div className="w-full bg-slate-900/60 rounded p-2 flex flex-wrap gap-1 justify-center content-start h-32 overflow-auto border border-slate-700/50">
                    {houseList.map((num: number) => (
                      <span
                        key={num}
                        className={`text-xs w-6 h-6 flex items-center justify-center rounded font-bold
                          ${isAngel ? 'bg-amber-400 text-slate-900' : 'bg-white text-slate-900'}
                        `}
                      >
                        {num}
                      </span>
                    ))}
                  </div>

                  {!isAngel && residentHouseDef && (
                    <div className="mt-2 flex items-center justify-center">
                      <span className={`text-sm font-bold ${residentHouseDef.lightColor}`}>DNA: {residentHouseDef.bit}</span>
                    </div>
                  )}

                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-2 mb-6">
            {!gameResult && playerSelectedCards.length === 0 && (
              <p className="text-sm text-slate-400 italic">请至少选择一张卡牌</p>
            )}
            {!gameResult ? (
              <button
                onClick={calculateResult}
                disabled={playerSelectedCards.length === 0}
                className={`px-8 py-4 font-bold rounded-xl transition-all duration-300 shadow-lg ${
                  playerSelectedCards.length === 0
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:shadow-xl hover:scale-105'
                }`}
              >
                确定 - 公布答案
              </button>
            ) : (
              <button
                onClick={resetGame}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                重新开始
              </button>
            )}
          </div>

          {gameResult && (
            <div className="w-full max-w-2xl bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border-2 border-amber-500 shadow-2xl animate-in zoom-in-95 duration-500">
              <h3 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                读心结果
              </h3>

              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <p className="text-slate-400 mb-2 text-sm">你心里想的数字是：</p>
                  <p className="text-5xl font-bold text-center text-white">
                    {gameResult.guessedNumber}
                  </p>
                </div>

                {gameResult.hasError ? (
                  <div className="bg-red-900/30 rounded-xl p-6 border-2 border-red-500">
                    <p className="text-red-300 text-lg font-semibold mb-2">检测到说谎！</p>
                    <p className="text-red-200 mb-2">
                      你在 <strong className="text-2xl text-red-400">#{gameResult.liedCard}</strong> 号卡牌上说谎了
                    </p>
                    <div className="bg-red-950/50 rounded p-3 mt-3">
                      <p className="text-red-200 text-sm">
                        {gameResult.errorType === 'should_select' ? (
                          <>
                            你想的数字 <strong className="text-white">{gameResult.guessedNumber}</strong> 在这张卡牌的名单上，
                            但你<strong className="text-red-300">没有选择</strong>它
                          </>
                        ) : (
                          <>
                            你想的数字 <strong className="text-white">{gameResult.guessedNumber}</strong> 不在这张卡牌的名单上，
                            但你<strong className="text-red-300">选择</strong>了它
                          </>
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-red-300 mt-3">
                      汉明码的纠错能力让我找到了错误位置和错误类型！
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-900/30 rounded-xl p-4 border-2 border-green-500">
                    <p className="text-green-300 font-semibold mb-2">诚实的玩家！</p>
                    <p className="text-green-200 text-sm">
                      你在所有卡牌上都说了实话
                    </p>
                    <p className="text-xs text-green-300 mt-2">
                      汉明码确认无误！
                    </p>
                  </div>
                )}

                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <p className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
                    <Info size={16} />
                    揭秘：我是如何知道的？
                  </p>
                  <div className="text-sm text-slate-300 space-y-3">
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                      <p className="font-bold text-white mb-2">第一步：纠错 - 找出说谎的牌</p>
                      <p className="mb-2">
                        看你选中的牌，统计屋顶门牌号中<span className="text-blue-400 font-bold">亮灯</span>的数字（<span className="text-blue-400">4</span>、<span className="text-green-400">2</span>、<span className="text-red-400">1</span>）：
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-slate-300">
                        <li>例如：你选了<strong className="text-white">#{playerSelectedCards.sort((a,b)=>a-b).join('、#')}</strong>号牌</li>
                        <li>统计这些牌屋顶上亮的灯，每个数字（4、2、1）各出现了多少次</li>
                        <li className="text-amber-300"><strong>关键规则：</strong>如果所有数字都出现<span className="text-green-400 font-bold">偶数次</span>（0次、2次、4次...），说明你诚实</li>
                        <li className="text-amber-300">如果某些数字出现<span className="text-red-400 font-bold">奇数次</span>，说明有人说谎！</li>
                        <li>把出现奇数次的数字相加，就得到<strong className="text-red-400">说谎的牌号</strong></li>
                      </ul>
                      <p className="text-xs text-slate-400 mt-2 italic">
                        💡 这叫做"奇偶校验"，是汉明码纠错的核心原理
                      </p>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
                      <p className="font-bold text-white mb-2">第二步：读心 - 计算正确数字</p>
                      <p className="mb-2">
                        修正后，找出所有<span className="text-purple-400 font-bold">普通居民屋</span>（3、5、6、7号）中被选中的：
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-slate-300">
                        <li>每个居民屋代表一个DNA位（3号=1、5号=2、6号=4、7号=8）</li>
                        <li>把被选中的居民屋的DNA值相加，就是你心中的数字！</li>
                        <li className="text-green-400 font-bold">答案 = {gameResult.guessedNumber}</li>
                      </ul>
                    </div>

                    <p className="text-xs text-slate-400 italic bg-slate-800/30 p-2 rounded">
                      🎓 这就是<strong className="text-amber-400">汉明码</strong>：一种能自动发现并纠正错误的编码方法，广泛应用于计算机存储和通信中！
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ==================== STEP 5 CONTENT ==================== */}
      {step === 5 && (
        <div className="w-full max-w-7xl flex gap-6 items-start justify-center animate-in fade-in duration-500">

          {/* Left Side: Cards Grid (2 rows x 4 columns) */}
          <div className="relative flex flex-col gap-4">
            {/* Row 1: 村民登记名单、1号天使、2号天使、3号屋 */}
            <div className="grid grid-cols-4 gap-4">
            {/* 村民登记名单 (只显示，不可选择) */}
            <div
              className="relative flex flex-col items-center p-4 rounded-xl transition-all duration-300 bg-slate-800/50 border-2 border-slate-700"
              style={{ width: '140px', minHeight: '280px' }}
            >
              <div className="flex gap-2 mb-3 bg-slate-950/50 p-2 rounded-lg z-10">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-slate-700 opacity-20 text-slate-500">0</div>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-slate-700 opacity-20 text-slate-500">0</div>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-slate-700 opacity-20 text-slate-500">0</div>
              </div>

              <div className="mb-2">
                <Users size={36} className="text-indigo-400" />
              </div>

              <div className="text-base font-bold text-white mb-3">
                村民登记名单
              </div>

              <div className="w-full bg-slate-900/60 rounded p-2 flex flex-wrap gap-1 justify-center content-start h-20 overflow-auto border border-slate-700/50">
                {visitors.map((num: number) => (
                  <span
                    key={num}
                    className="text-xs w-6 h-6 flex items-center justify-center rounded font-bold bg-indigo-400 text-slate-900"
                  >
                    {num}
                  </span>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-center">
                <span className="text-xs text-slate-500 italic">仅供参考</span>
              </div>
            </div>

            {/* 1号天使 */}
            {(() => {
              const house = houses[0];
              const isSelected = playerSelectedCards.includes(house.id);
              let houseList = angelLists[house.id] || [];
              if (houseList.length === 0) {
                houseList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].filter(num => {
                  let housesToCheck: number[] = [3, 5, 7];
                  let appearances = 0;
                  housesToCheck.forEach(houseId => {
                    const residentHouse = residentHouses.find(h => h.id === houseId);
                    if (residentHouse && residentHouse.list.includes(num)) {
                      appearances++;
                    }
                  });
                  return appearances % 2 !== 0;
                });
              }
              const isLiedCard = gameResult && gameResult.liedCard === house.id;

              return (
                <button
                  key={house.id}
                  onClick={() => toggleCardSelection(house.id)}
                  disabled={!!gameResult}
                  className={`
                    relative flex flex-col items-center p-4 rounded-xl transition-all duration-300
                    bg-slate-800/50 border-2 border-slate-700
                    ${isSelected ? 'ring-4 ring-green-400 scale-105 shadow-[0_0_30px_rgba(34,197,94,0.5)]' : 'hover:scale-105'}
                    ${isLiedCard ? 'ring-4 ring-red-500 animate-pulse' : ''}
                    ${gameResult ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                  `}
                  style={{ width: '140px', minHeight: '280px' }}
                >
                  {isSelected && !gameResult && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white z-10">
                      <Check size={20} className="text-white" />
                    </div>
                  )}

                  {isLiedCard && gameResult && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500/90 py-2 rounded-t-xl z-20 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {gameResult.errorType === 'should_select' ? '应选未选' : '不应选但选了'}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 mb-3 bg-slate-950/50 p-2 rounded-lg z-10">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[2] ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>4</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[1] ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>2</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[0] ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>1</div>
                  </div>

                  <div className="mb-2">
                    <Castle size={36} className="text-amber-400" />
                  </div>

                  <div className="text-base font-bold text-white mb-3">
                    {house.id}号天使
                  </div>

                  <div className="w-full bg-slate-900/60 rounded p-2 flex flex-wrap gap-1 justify-center content-start h-32 overflow-auto border border-slate-700/50">
                    {houseList.map((num: number) => (
                      <span
                        key={num}
                        className="text-xs w-6 h-6 flex items-center justify-center rounded font-bold bg-amber-400 text-slate-900"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })()}

            {/* 2号天使 */}
            {(() => {
              const house = houses[1];
              const isSelected = playerSelectedCards.includes(house.id);
              let houseList = angelLists[house.id] || [];
              if (houseList.length === 0) {
                houseList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].filter(num => {
                  let housesToCheck: number[] = [3, 6, 7];
                  let appearances = 0;
                  housesToCheck.forEach(houseId => {
                    const residentHouse = residentHouses.find(h => h.id === houseId);
                    if (residentHouse && residentHouse.list.includes(num)) {
                      appearances++;
                    }
                  });
                  return appearances % 2 !== 0;
                });
              }
              const isLiedCard = gameResult && gameResult.liedCard === house.id;

              return (
                <button
                  key={house.id}
                  onClick={() => toggleCardSelection(house.id)}
                  disabled={!!gameResult}
                  className={`
                    relative flex flex-col items-center p-4 rounded-xl transition-all duration-300
                    bg-slate-800/50 border-2 border-slate-700
                    ${isSelected ? 'ring-4 ring-green-400 scale-105 shadow-[0_0_30px_rgba(34,197,94,0.5)]' : 'hover:scale-105'}
                    ${isLiedCard ? 'ring-4 ring-red-500 animate-pulse' : ''}
                    ${gameResult ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                  `}
                  style={{ width: '140px', minHeight: '280px' }}
                >
                  {isSelected && !gameResult && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white z-10">
                      <Check size={20} className="text-white" />
                    </div>
                  )}

                  {isLiedCard && gameResult && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500/90 py-2 rounded-t-xl z-20 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {gameResult.errorType === 'should_select' ? '应选未选' : '不应选但选了'}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 mb-3 bg-slate-950/50 p-2 rounded-lg z-10">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[2] ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>4</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[1] ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>2</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[0] ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>1</div>
                  </div>

                  <div className="mb-2">
                    <Castle size={36} className="text-amber-400" />
                  </div>

                  <div className="text-base font-bold text-white mb-3">
                    {house.id}号天使
                  </div>

                  <div className="w-full bg-slate-900/60 rounded p-2 flex flex-wrap gap-1 justify-center content-start h-32 overflow-auto border border-slate-700/50">
                    {houseList.map((num: number) => (
                      <span
                        key={num}
                        className="text-xs w-6 h-6 flex items-center justify-center rounded font-bold bg-amber-400 text-slate-900"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })()}

            {/* 3号屋 */}
            {(() => {
              const house = houses[2];
              const isSelected = playerSelectedCards.includes(house.id);
              const bitMap: { [key: number]: number } = { 3: 1, 5: 2, 6: 4, 7: 8 };
              const bit = bitMap[house.id];
              const residentHouseDef = residentHouses.find(r => r.bit === bit);
              const houseList = residentHouseDef ? residentHouseDef.list : [];
              const iconColor = residentHouseDef ? residentHouseDef.lightColor : 'text-slate-600';
              const isLiedCard = gameResult && gameResult.liedCard === house.id;

              return (
                <button
                  key={house.id}
                  onClick={() => toggleCardSelection(house.id)}
                  disabled={!!gameResult}
                  className={`
                    relative flex flex-col items-center p-4 rounded-xl transition-all duration-300
                    bg-slate-800/50 border-2 border-slate-700
                    ${isSelected ? 'ring-4 ring-green-400 scale-105 shadow-[0_0_30px_rgba(34,197,94,0.5)]' : 'hover:scale-105'}
                    ${isLiedCard ? 'ring-4 ring-red-500 animate-pulse' : ''}
                    ${gameResult ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                  `}
                  style={{ width: '140px', minHeight: '280px' }}
                >
                  {isSelected && !gameResult && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white z-10">
                      <Check size={20} className="text-white" />
                    </div>
                  )}

                  {isLiedCard && gameResult && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500/90 py-2 rounded-t-xl z-20 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {gameResult.errorType === 'should_select' ? '应选未选' : '不应选但选了'}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 mb-3 bg-slate-950/50 p-2 rounded-lg z-10">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[2] ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>4</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[1] ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>2</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[0] ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>1</div>
                  </div>

                  <div className="mb-2">
                    <Home size={36} className={iconColor} />
                  </div>

                  <div className="text-base font-bold text-white mb-3">
                    {house.id}号屋
                  </div>

                  <div className="w-full bg-slate-900/60 rounded p-2 flex flex-wrap gap-1 justify-center content-start h-32 overflow-auto border border-slate-700/50">
                    {houseList.map((num: number) => (
                      <span
                        key={num}
                        className="text-xs w-6 h-6 flex items-center justify-center rounded font-bold bg-white text-slate-900"
                      >
                        {num}
                      </span>
                    ))}
                  </div>

                  {residentHouseDef && (
                    <div className="mt-2 flex items-center justify-center">
                      <span className={`text-sm font-bold ${residentHouseDef.lightColor}`}>DNA: {residentHouseDef.bit}</span>
                    </div>
                  )}
                </button>
              );
            })()}
            </div>

            {/* Row 2: 4号天使、5号屋、6号屋、7号屋 */}
            <div className="grid grid-cols-4 gap-4">
            {/* 4号天使 */}
            {(() => {
              const house = houses[3];
              const isSelected = playerSelectedCards.includes(house.id);
              let houseList = angelLists[house.id] || [];
              if (houseList.length === 0) {
                houseList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].filter(num => {
                  let housesToCheck: number[] = [5, 6, 7];
                  let appearances = 0;
                  housesToCheck.forEach(houseId => {
                    const residentHouse = residentHouses.find(h => h.id === houseId);
                    if (residentHouse && residentHouse.list.includes(num)) {
                      appearances++;
                    }
                  });
                  return appearances % 2 !== 0;
                });
              }
              const isLiedCard = gameResult && gameResult.liedCard === house.id;

              return (
                <button
                  key={house.id}
                  onClick={() => toggleCardSelection(house.id)}
                  disabled={!!gameResult}
                  className={`
                    relative flex flex-col items-center p-4 rounded-xl transition-all duration-300
                    bg-slate-800/50 border-2 border-slate-700
                    ${isSelected ? 'ring-4 ring-green-400 scale-105 shadow-[0_0_30px_rgba(34,197,94,0.5)]' : 'hover:scale-105'}
                    ${isLiedCard ? 'ring-4 ring-red-500 animate-pulse' : ''}
                    ${gameResult ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                  `}
                  style={{ width: '140px', minHeight: '280px' }}
                >
                  {isSelected && !gameResult && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white z-10">
                      <Check size={20} className="text-white" />
                    </div>
                  )}

                  {isLiedCard && gameResult && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500/90 py-2 rounded-t-xl z-20 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {gameResult.errorType === 'should_select' ? '应选未选' : '不应选但选了'}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 mb-3 bg-slate-950/50 p-2 rounded-lg z-10">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[2] ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>4</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[1] ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>2</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[0] ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>1</div>
                  </div>

                  <div className="mb-2">
                    <Castle size={36} className="text-amber-400" />
                  </div>

                  <div className="text-base font-bold text-white mb-3">
                    {house.id}号天使
                  </div>

                  <div className="w-full bg-slate-900/60 rounded p-2 flex flex-wrap gap-1 justify-center content-start h-32 overflow-auto border border-slate-700/50">
                    {houseList.map((num: number) => (
                      <span
                        key={num}
                        className="text-xs w-6 h-6 flex items-center justify-center rounded font-bold bg-amber-400 text-slate-900"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })()}

            {/* 5号屋、6号屋、7号屋 */}
            {[4, 5, 6].map((index) => {
              const house = houses[index];
              const isSelected = playerSelectedCards.includes(house.id);
              const bitMap: { [key: number]: number } = { 3: 1, 5: 2, 6: 4, 7: 8 };
              const bit = bitMap[house.id];
              const residentHouseDef = residentHouses.find(r => r.bit === bit);
              const houseList = residentHouseDef ? residentHouseDef.list : [];
              const iconColor = residentHouseDef ? residentHouseDef.lightColor : 'text-slate-600';
              const isLiedCard = gameResult && gameResult.liedCard === house.id;

              return (
                <button
                  key={house.id}
                  onClick={() => toggleCardSelection(house.id)}
                  disabled={!!gameResult}
                  className={`
                    relative flex flex-col items-center p-4 rounded-xl transition-all duration-300
                    bg-slate-800/50 border-2 border-slate-700
                    ${isSelected ? 'ring-4 ring-green-400 scale-105 shadow-[0_0_30px_rgba(34,197,94,0.5)]' : 'hover:scale-105'}
                    ${isLiedCard ? 'ring-4 ring-red-500 animate-pulse' : ''}
                    ${gameResult ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                  `}
                  style={{ width: '140px', minHeight: '280px' }}
                >
                  {isSelected && !gameResult && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white z-10">
                      <Check size={20} className="text-white" />
                    </div>
                  )}

                  {isLiedCard && gameResult && (
                    <div className="absolute top-0 left-0 right-0 bg-red-500/90 py-2 rounded-t-xl z-20 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {gameResult.errorType === 'should_select' ? '应选未选' : '不应选但选了'}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 mb-3 bg-slate-950/50 p-2 rounded-lg z-10">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[2] ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>4</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[1] ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>2</div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 shadow-sm ${house.binary[0] ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-slate-700 opacity-20 text-slate-500'}`}>1</div>
                  </div>

                  <div className="mb-2">
                    <Home size={36} className={iconColor} />
                  </div>

                  <div className="text-base font-bold text-white mb-3">
                    {house.id}号屋
                  </div>

                  <div className="w-full bg-slate-900/60 rounded p-2 flex flex-wrap gap-1 justify-center content-start h-32 overflow-auto border border-slate-700/50">
                    {houseList.map((num: number) => (
                      <span
                        key={num}
                        className="text-xs w-6 h-6 flex items-center justify-center rounded font-bold bg-white text-slate-900"
                      >
                        {num}
                      </span>
                    ))}
                  </div>

                  {residentHouseDef && (
                    <div className="mt-2 flex items-center justify-center">
                      <span className={`text-sm font-bold ${residentHouseDef.lightColor}`}>DNA: {residentHouseDef.bit}</span>
                    </div>
                  )}
                </button>
              );
            })}
            </div>
          </div>

          {/* Right Side: Rules and Result Panel */}
          <div className="relative flex flex-col gap-4 w-96">
            {/* Rules Panel */}
            <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold mb-4 text-white text-center">汉明码读心术</h2>
              <div className="mb-4">
                <p className="text-slate-300 font-semibold mb-2">游戏规则：</p>
                <ol className="text-slate-300 space-y-2 text-sm">
                  <li>1. 在心里默默想一个 <strong className="text-blue-400">1 到 15</strong> 之间的数字</li>
                  <li>2. 查看下方的7张卡牌，如果你想的数字在卡牌的名单中，就<strong className="text-green-400">点击</strong>该卡牌</li>
                  <li>3. 你可以在<strong className="text-red-400">任意一张卡牌上说谎</strong>（或者诚实回答所有卡牌）</li>
                  <li>4. 点击<strong className="text-amber-400">确定</strong>按钮，系统会告诉你：你想的数字是多少，以及你是否说谎</li>
                </ol>
              </div>

              {!gameResult && (
                <div className="text-center text-sm text-slate-400 italic border-t border-slate-700 pt-3">
                  请至少选择一张卡牌
                </div>
              )}
            </div>

            {/* Action Button */}
            {!gameResult && (
              <button
                onClick={calculateResult}
                disabled={playerSelectedCards.length === 0}
                className={`px-8 py-4 font-bold rounded-xl transition-all duration-300 shadow-lg ${
                  playerSelectedCards.length === 0
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:shadow-xl hover:scale-105'
                }`}
              >
                确定 - 公布答案
              </button>
            )}

            {/* Result Panel */}
            {gameResult && (
            <div className="w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border-2 border-amber-500 shadow-2xl animate-in zoom-in-95 duration-500">
              <h3 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                读心结果
              </h3>

              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <p className="text-slate-400 mb-2 text-sm">你心里想的数字是：</p>
                  <p className="text-5xl font-bold text-center text-white">
                    {gameResult.guessedNumber}
                  </p>
                </div>

                {gameResult.hasError ? (
                  <div className="bg-red-900/30 rounded-xl p-4 border-2 border-red-500">
                    <p className="text-red-300 font-semibold mb-2">检测到说谎！</p>
                    <p className="text-red-200 mb-2 text-sm">
                      你在 <strong className="text-xl text-red-400">
                        {gameResult.liedCard === 0 ? '村民登记名单' : `#${gameResult.liedCard}`}
                      </strong> {gameResult.liedCard === 0 ? '' : '号'}卡牌上说谎了
                    </p>
                    <div className="bg-red-950/50 rounded p-3 mt-3">
                      <p className="text-red-200 text-sm">
                        {gameResult.errorType === 'should_select' ? (
                          <>
                            你想的数字 <strong className="text-white">{gameResult.guessedNumber}</strong> 在这张卡牌的名单上，
                            但你<strong className="text-red-300">没有选择</strong>它
                          </>
                        ) : (
                          <>
                            你想的数字 <strong className="text-white">{gameResult.guessedNumber}</strong> 不在这张卡牌的名单上，
                            但你<strong className="text-red-300">选择</strong>了它
                          </>
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-red-300 mt-3">
                      汉明码的纠错能力让我找到了错误位置和错误类型！
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-900/30 rounded-xl p-4 border-2 border-green-500">
                    <p className="text-green-300 font-semibold mb-2">诚实的玩家！</p>
                    <p className="text-green-200 text-sm">
                      你在所有卡牌上都说了实话
                    </p>
                    <p className="text-xs text-green-300 mt-2">
                      汉明码确认无误！
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-4">
                <button
                  onClick={resetGame}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  重新开始
                </button>
                <button
                  onClick={() => {
                    setShowSecretPanel(!showSecretPanel);
                    if (!showSecretPanel) {
                      setExpandRule2(false);
                    }
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Info size={20} />
                  {showSecretPanel ? '收起揭秘' : '揭秘原理'}
                </button>
              </div>
            </div>
          )}

            {/* Secret Reveal Panel - Overlay on right side */}
            {gameResult && showSecretPanel && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm rounded-xl p-6 border-2 border-amber-500/50 z-50 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 flex items-center gap-2">
                  <Info size={24} />
                  揭秘：我是如何知道的？
                </h3>
                <button
                  onClick={() => setShowSecretPanel(false)}
                  className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 text-slate-300 text-sm">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <p className="font-semibold text-amber-400 mb-2">为什么这样排列？</p>
                  <p className="text-xs leading-relaxed">
                    这个2行4列的布局不是随意的！它可以让你的大脑快速进行视觉判断，发现异常。
                  </p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <p className="font-semibold text-blue-400 mb-3">在没有说谎的情况下：</p>

                  <div className="space-y-3">
                    <div className="bg-slate-800/50 rounded p-3">
                      <p className="font-semibold text-green-400 text-xs mb-1">规律 1：偶数规则</p>
                      <p className="text-xs leading-relaxed">
                        <strong className="text-white">第二行</strong>（4号天使、5号屋、6号屋、7号屋）被选中的卡牌数量<strong className="text-green-400">一定是偶数</strong>（0、2或4张）
                      </p>
                    </div>

                    <div className="bg-slate-800/50 rounded p-3">
                      <p className="font-semibold text-cyan-400 text-xs mb-1">规律 2：同列奇偶性</p>
                      <p className="text-xs leading-relaxed mb-2">
                        观察<strong className="text-white">同一列的上下两张卡牌</strong>：
                      </p>
                      <ul className="text-xs space-y-1 ml-4">
                        <li>• 若 <strong className="text-amber-400">1号天使/5号屋</strong> 恰有<strong className="text-cyan-400">1张</strong>被选中</li>
                        <li className="ml-4">→ <strong className="text-amber-400">2号天使/6号屋</strong> 和 <strong className="text-amber-400">3号屋/7号屋</strong> 也各恰有<strong className="text-cyan-400">1张</strong>被选中</li>
                      </ul>
                      <ul className="text-xs space-y-1 ml-4 mt-2">
                        <li>• 若 <strong className="text-amber-400">1号天使/5号屋</strong> 有<strong className="text-cyan-400">0或2张</strong>被选中</li>
                        <li className="ml-4">→ <strong className="text-amber-400">2号天使/6号屋</strong> 和 <strong className="text-amber-400">3号屋/7号屋</strong> 也各是<strong className="text-cyan-400">0或2张</strong>被选中</li>
                      </ul>

                      <button
                        onClick={() => setExpandRule2(!expandRule2)}
                        className="mt-3 text-xs text-amber-400 hover:text-amber-300 underline transition-colors"
                      >
                        {expandRule2 ? '收起解说' : '展开解说'}
                      </button>

                      {expandRule2 && (
                        <div className="mt-3 space-y-3 bg-slate-900/50 rounded p-3 border border-cyan-500/30">
                          <p className="text-xs font-semibold text-cyan-300">为什么会有这个规律？</p>

                          <div className="space-y-2">
                            <p className="text-xs text-slate-300 leading-relaxed">
                              任何一个村民，在<strong className="text-amber-400">第3列（2号天使/6号屋）</strong>中会出现<strong className="text-green-400">偶数次</strong>（这是2号天使守护的核心规则）。
                            </p>

                            <p className="text-xs text-slate-300 leading-relaxed">
                              根据<strong className="text-cyan-400">奇偶性的基本性质</strong>：<br/>
                              • 偶数 = 偶数 + 偶数<br/>
                              • 偶数 = 奇数 + 奇数
                            </p>

                            <p className="text-xs text-slate-300 leading-relaxed">
                              因此：<br/>
                              • 如果该村民在<strong className="text-purple-400">第4列（3号屋/7号屋）</strong>出现<strong className="text-green-400">偶数次</strong>，那么他在<strong className="text-amber-400">第3列（2号天使/6号屋）</strong>也一定出现<strong className="text-green-400">偶数次</strong>。<br/>
                              • 如果该村民在<strong className="text-purple-400">第4列（3号屋/7号屋）</strong>出现<strong className="text-orange-400">奇数次</strong>，那么他在<strong className="text-amber-400">第3列（2号天使/6号屋）</strong>也一定出现<strong className="text-orange-400">奇数次</strong>。
                            </p>

                            <div className="border-l-2 border-cyan-500 pl-3 mt-2">
                              <p className="text-xs text-slate-300 leading-relaxed">
                                同理，任何一个村民在<strong className="text-amber-400">第2列（1号天使/5号屋）</strong>和<strong className="text-purple-400">第4列（3号屋/7号屋）</strong>中也有相同的奇偶性关系（这是1号天使守护的核心规则）。
                              </p>
                            </div>

                            <div className="bg-cyan-900/30 rounded p-2 mt-2">
                              <p className="text-xs font-semibold text-cyan-300 mb-1">结论：</p>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                <strong className="text-amber-400">第2列</strong>、<strong className="text-amber-400">第3列</strong>、<strong className="text-purple-400">第4列</strong>的奇偶性<strong className="text-green-400">完全一致</strong>！这就是为什么你会看到"同列奇偶性\"规律的数学原理。
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                  <p className="font-semibold text-red-400 mb-2 text-xs">如果违反了这些规律？</p>
                  <p className="text-xs leading-relaxed">
                    说明有人在说谎！汉明码的数学原理会精确定位到<strong className="text-red-400">哪张卡牌</strong>上出现了<strong className="text-red-400">什么类型</strong>的错误（应选未选 或 不应选但选了）。
                  </p>
                </div>

                <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <p className="text-xs leading-relaxed italic text-slate-400">
                    💡 这就是<strong className="text-amber-400">汉明码</strong>的魔力：不仅能检测错误，还能纠正错误！它被广泛应用于计算机内存、通信系统等领域。
                  </p>
                </div>
              </div>
            </div>
          )}
          </div>

        </div>
      )}

    </div>
  );
};

export default HammingVillage;
