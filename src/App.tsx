import React, { useState, useRef, useEffect } from 'react';
import { 
  Mail, Clock, PoundSterling, FileText, AlertCircle, RefreshCw, 
  Database, Sparkles, Check, Search, Upload, LayoutDashboard, 
  TrendingUp, Users, PieChart, ShieldCheck, Wallet, Bell,
  ChevronDown, MapPin, BadgeInfo, Star, FileOutput
} from 'lucide-react';

const APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzvIzwCL52hTRwn07LeE94gMEJzIte92Z-XuBMlrEm3THOESmKd98Lcl00Q_QGsb6W4tw/exec"; 

// 產生模擬數據，完美對應十大痛點 (包含 SEND, 房間分配, 混合計費等)
const generateMockData = () => {
  const baseNames = ["Oliver Smith", "Amelia Jones", "George Williams", "Isla Brown", "Harry Taylor", "Ava Davies", "Jack Evans", "Mia Thomas", "Noah Roberts", "Sophia Johnson"];
  const rooms = ["Baby Room (0-2y)", "Toddler Room (2-3y)", "Pre-School (3-5y)"];
  
  return Array.from({ length: 50 }).map((_, index) => {
    const name = index < 10 ? baseNames[index] : `${baseNames[index % 10]} (Sibling ${index})`;
    const age = (index % 4) + 1; 
    const room = age < 2 ? rooms[0] : age < 3 ? rooms[1] : rooms[2];
    
    const totalHours = 60 + (index % 4) * 20;
    // 痛點 1: 混合計費 (15/30小時免費)
    const fundedHours = age >= 3 ? (index % 2 === 0 ? 30 : 15) : 0; 
    const privateHours = Math.max(0, totalHours - fundedHours);
    
    const rate = 8.50;
    // 痛點 7: 耗材費與附加費
    const consumables = 40 + (index % 3) * 5; 
    const privateFee = privateHours * rate;
    const fundedClaim = fundedHours * 5.50; 
    
    // 痛點 6: SEND (特殊教育需求) 追蹤
    const isSEND = index % 12 === 0; 
    const sendFunding = isSEND ? 150 : 0; 

    const invoiceStatus = index % 5 === 1 ? 'Sent' : 'Pending';
    
    return {
      id: index + 1,
      name,
      age,
      room,
      isSEND,
      email: `parent${index + 1}@example.com`,
      totalHours,
      fundedHours,
      privateHours,
      rate,
      privateFee,
      fundedClaim,
      sendFunding,
      consumables,
      totalParentFee: privateFee + consumables,
      // 痛點 5: TFC 對帳參考碼
      tfcRef: index % 2 === 0 ? `TFC-CHIL${100+index}` : '',
      invoiceStatus,
      paymentStatus: invoiceStatus === 'Sent' ? (index % 3 === 0 ? 'Unpaid' : 'Paid (BACS)') : 'Unpaid'
    };
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState(generateMockData());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [apiStatus, setApiStatus] = useState('loading'); 
  const [searchTerm, setSearchTerm] = useState('');
  // 痛點 8: 多校區選擇狀態
  const [selectedSite, setSelectedSite] = useState('London (Chelsea)');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${APPS_SCRIPT_WEBAPP_URL}?action=getData`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setStudents(data); 
            setApiStatus('connected');
            return;
          }
        }
        throw new Error('Fallback to mock');
      } catch (error) {
        setApiStatus('demo_mode'); 
      }
    };
    fetchData();
  }, []);

  const handleDispatch = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setStudents(students.map(s => ({ ...s, invoiceStatus: 'Sent' })));
      setIsProcessing(false);
      alert('成功！已向家長發送智慧帳單。 (Smart Invoices dispatched)');
    }, 1500);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsReconciling(true);
    setTimeout(() => {
      // 痛點 5: 自動對帳 TFC 付款
      setStudents(students.map(s => s.paymentStatus === 'Unpaid' && s.tfcRef !== '' ? { ...s, paymentStatus: 'Paid (TFC Auto)' } : s));
      setIsReconciling(false);
      alert('對帳完成！已自動匹配 TFC 付款紀錄。 (TFC payments matched automatically)');
    }, 1500);
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const pendingCount = students.filter(s => s.invoiceStatus === 'Pending').length;
  // 痛點 9: 呆帳計算
  const unpaidCount = students.filter(s => s.paymentStatus === 'Unpaid' && s.invoiceStatus === 'Sent').length;
  
  const totalParentRev = students.reduce((acc, curr) => acc + curr.totalParentFee, 0);
  const totalFundedRev = students.reduce((acc, curr) => acc + curr.fundedClaim + curr.sendFunding, 0);
  const totalRev = totalParentRev + totalFundedRev;
  const unpaidAmount = students.filter(s => s.paymentStatus === 'Unpaid' && s.invoiceStatus === 'Sent').reduce((acc, curr) => acc + curr.totalParentFee, 0);

  // 渲染不同模組的內容
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 pb-24 md:pb-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2 mb-2">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">CFO Overview</h3>
                <span className="text-sm text-slate-500 font-medium">30-Day Forecast & Health Metrics</span>
              </div>
              <div className="flex items-center text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm w-fit">
                <Clock size={14} className="mr-1.5" /> Last updated: Just now
              </div>
            </div>
            
            {/* Apple/Google 風格 KPI 卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><TrendingUp size={24} strokeWidth={2.5} /></div>
                  <div className="text-right"><p className="text-sm text-slate-500 font-medium">Est. Gross Margin</p><p className="text-3xl font-bold text-slate-900 mt-1">24.5%</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">+2.1% vs Prev</span>
                  <span className="text-xs text-slate-400">Healthy</span>
                </div>
              </div>
              
              <div className="bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><PieChart size={24} strokeWidth={2.5} /></div>
                  <div className="text-right"><p className="text-sm text-slate-500 font-medium">Occupancy</p><p className="text-3xl font-bold text-slate-900 mt-1">82%</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-md">Target: 85%</span>
                  <span className="text-xs text-slate-400">3 slots left</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><PoundSterling size={24} strokeWidth={2.5} /></div>
                  <div className="text-right"><p className="text-sm text-slate-500 font-medium">Total Income</p><p className="text-3xl font-bold text-emerald-700 mt-1">£{totalRev.toLocaleString(undefined, {maximumFractionDigits:0})}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-medium"><span className="text-slate-500">Parents</span><span className="text-slate-700">£{totalParentRev.toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                  <div className="flex justify-between text-xs font-medium"><span className="text-slate-500">Local Auth.</span><span className="text-slate-700">£{totalFundedRev.toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                </div>
              </div>

              {/* 痛點 9: 現金流斷裂與呆帳追討 (Cashflow at Risk) */}
              <div className="bg-rose-50/50 rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(225,29,72,0.1)] border border-rose-100 flex flex-col justify-between relative overflow-hidden transition-transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="bg-rose-100 p-3 rounded-2xl text-rose-600"><AlertCircle size={24} strokeWidth={2.5} /></div>
                  <div className="text-right"><p className="text-sm text-rose-700/80 font-medium">Cashflow at Risk</p><p className="text-3xl font-bold text-rose-700 mt-1">£{unpaidAmount.toLocaleString(undefined, {maximumFractionDigits:0})}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-rose-100/50 flex items-center justify-between relative z-10">
                  <span className="text-xs text-rose-700 font-bold">{unpaidCount} Overdue Accounts</span>
                  <button className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded-full font-semibold hover:bg-rose-700 transition shadow-sm">Chase</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
               {/* 痛點 4: 勞動成本通膨與人員流失 (Labour Cost Inflation) */}
               <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
                  <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center"><PieChart className="mr-2 text-slate-400" size={20}/> Income vs Labour Cost</h4>
                  <div className="space-y-6">
                     <div>
                       <div className="flex justify-between text-sm mb-2"><span className="text-emerald-700 font-bold">Total Expected Income</span><span className="font-bold text-slate-900">£{totalRev.toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                       <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden"><div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{width: '100%'}}></div></div>
                     </div>
                     <div>
                       <div className="flex justify-between text-sm mb-2"><span className="text-amber-600 font-bold">Est. Labour Costs (Wages/NI/Pension)</span><span className="font-bold text-slate-900">£{(totalRev * 0.62).toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                       <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden relative">
                         <div className="bg-amber-400 h-full rounded-full transition-all duration-1000" style={{width: '62%'}}></div>
                         {/* 合規安全線 Target 65% */}
                         <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-rose-500" style={{left: '65%'}} title="Safe Target: 65%"></div>
                       </div>
                       <p className="text-xs text-slate-400 mt-2">Target benchmark: &lt; 65% of Income</p>
                     </div>
                  </div>
               </div>
               
               <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-6 md:p-8 rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  <h4 className="text-lg font-bold text-blue-50 mb-6 flex items-center relative z-10"><Sparkles size={20} className="mr-2 text-amber-400"/> AI CFO Insights</h4>
                  <ul className="space-y-5 text-sm text-slate-300 relative z-10">
                    <li className="flex items-start bg-white/5 p-4 rounded-2xl border border-white/10">
                      <Star size={18} className="text-emerald-400 mr-3 mt-0.5 shrink-0"/>
                      <span><strong className="text-white block mb-1">Funding Shift Ahead:</strong> 3 children are turning 3 next month. The system has automatically forecast the 15/30 hours entitlement change.</span>
                    </li>
                    <li className="flex items-start bg-white/5 p-4 rounded-2xl border border-white/10">
                      <Wallet size={18} className="text-blue-400 mr-3 mt-0.5 shrink-0"/>
                      <span><strong className="text-white block mb-1">Cashflow Sync:</strong> Open Banking detected £3,400 TFC clearing tomorrow.</span>
                    </li>
                    <li className="flex items-start bg-white/5 p-4 rounded-2xl border border-white/10">
                      <Users size={18} className="text-amber-400 mr-3 mt-0.5 shrink-0"/>
                      <span><strong className="text-white block mb-1">Labour Optimisation:</strong> Thursday PMs run at a 5% loss. Recommend offering Ad-hoc sessions.</span>
                    </li>
                  </ul>
               </div>
            </div>
          </div>
        );

      case 'profitability':
        return (
          <div className="space-y-6 pb-24 md:pb-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance & Optimisation</h3>
                <span className="text-sm text-slate-500 font-medium">Live Ofsted Ratio vs Room Profitability</span>
              </div>
              <button className="flex items-center text-sm bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition w-full md:w-auto justify-center">
                Date: Today <ChevronDown size={16} className="ml-2 text-slate-400"/>
              </button>
            </div>
            
            {/* 痛點 2: 師生比合規與隱性虧損 (Ratio vs Profitability) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Baby Room */}
              <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col">
                <div className="bg-rose-50/50 p-6 border-b border-rose-100 flex justify-between items-center">
                  <h4 className="font-bold text-lg text-rose-950">Baby Room</h4>
                  <span className="text-xs font-bold bg-rose-200/80 text-rose-900 px-3 py-1.5 rounded-full">Ratio 1:3</span>
                </div>
                <div className="p-6 space-y-5 flex-1 flex flex-col">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Children In</span><span className="font-bold text-slate-900 text-base">8 / 12 <span className="text-xs font-normal text-slate-400">(Cap)</span></span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Labour Assigned</span><span className="font-bold text-amber-600 text-base bg-amber-50 px-2 py-0.5 rounded-md">3 (Overstaffed)</span></div>
                  </div>
                  <div className="pt-5 border-t border-slate-100 mt-auto">
                    <div className="flex justify-between items-center text-sm mb-4"><span className="text-slate-500 font-medium">Est. Profit Margin</span><span className="font-bold text-rose-600 text-lg">-2% (Loss)</span></div>
                    {/* 痛點 3: 閒置產能無法變現 (Push Ad-hoc Offer) */}
                    <button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center transition shadow-md active:scale-[0.98]">
                      <Bell size={18} className="mr-2"/> Push Ad-hoc (4 slots)
                    </button>
                  </div>
                </div>
              </div>

              {/* Toddler Room */}
              <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col">
                <div className="bg-amber-50/50 p-6 border-b border-amber-100 flex justify-between items-center">
                  <h4 className="font-bold text-lg text-amber-950">Toddler Room</h4>
                  <span className="text-xs font-bold bg-amber-200/80 text-amber-900 px-3 py-1.5 rounded-full">Ratio 1:4</span>
                </div>
                <div className="p-6 space-y-5 flex-1 flex flex-col">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Children In</span><span className="font-bold text-slate-900 text-base">12 / 12 <span className="text-xs font-normal text-slate-400">(Cap)</span></span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Labour Assigned</span><span className="font-bold text-emerald-600 text-base bg-emerald-50 px-2 py-0.5 rounded-md">3 (Perfect)</span></div>
                  </div>
                  <div className="pt-5 border-t border-slate-100 mt-auto">
                    <div className="flex justify-between items-center text-sm mb-4"><span className="text-slate-500 font-medium">Est. Profit Margin</span><span className="font-bold text-emerald-600 text-lg">28% (Healthy)</span></div>
                    <button className="w-full bg-slate-100 text-slate-400 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center cursor-not-allowed">
                      Full Capacity
                    </button>
                  </div>
                </div>
              </div>

              {/* Pre-School */}
              <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col">
                <div className="bg-emerald-50/50 p-6 border-b border-emerald-100 flex justify-between items-center">
                  <h4 className="font-bold text-lg text-emerald-950">Pre-School</h4>
                  <span className="text-xs font-bold bg-emerald-200/80 text-emerald-900 px-3 py-1.5 rounded-full">Ratio 1:8</span>
                </div>
                <div className="p-6 space-y-5 flex-1 flex flex-col">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Children In</span><span className="font-bold text-slate-900 text-base">22 / 24 <span className="text-xs font-normal text-slate-400">(Cap)</span></span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Labour Assigned</span><span className="font-bold text-emerald-600 text-base bg-emerald-50 px-2 py-0.5 rounded-md">3 (Compliant)</span></div>
                  </div>
                  <div className="pt-5 border-t border-slate-100 mt-auto">
                    <div className="flex justify-between items-center text-sm mb-4"><span className="text-slate-500 font-medium">Est. Profit Margin</span><span className="font-bold text-emerald-600 text-lg">35% (Optimal)</span></div>
                    <button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center transition shadow-md active:scale-[0.98]">
                      <Bell size={18} className="mr-2"/> Push Ad-hoc (2 slots)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'billing':
      default:
        return (
          <div className="pb-24 md:pb-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Funding Decoder</h3>
                <span className="text-sm text-slate-500 font-medium">Hybrid Billing & Reconciliation</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] mb-6 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              <div className="relative w-full md:w-80 h-12">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder="Search child or TFC Ref..." className="w-full h-full pl-12 pr-4 bg-slate-50/50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto p-2 md:p-0">
                <button onClick={handleDispatch} className="flex-1 md:flex-none flex justify-center items-center px-6 h-12 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20 active:scale-[0.98]">
                  {isProcessing ? <RefreshCw className="animate-spin mr-2" size={20} /> : <Mail className="mr-2" size={20} />} Smart Invoices ({pendingCount})
                </button>
                <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCSVUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none flex justify-center items-center px-6 h-12 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition shadow-sm active:scale-[0.98]">
                  {isReconciling ? <RefreshCw className="animate-spin mr-2" size={20} /> : <Wallet className="mr-2" size={20} />} Bank CSV Sync
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center text-sm uppercase tracking-wider"><ShieldCheck size={18} className="mr-2 text-blue-500"/> Invoice Ledger</h3>
                {/* 痛點 10: 合規性與稽核軌跡 (Audit Trails) */}
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded-md"><BadgeInfo size={14} className="mr-1"/> Audit Trail Active</span>
                  <button className="text-xs font-bold text-slate-500 flex items-center hover:text-slate-800 transition"><FileOutput size={14} className="mr-1" /> Export Log</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                {/* 痛點 1: 混合計費 (Hybrid Funding) 表格拆解 */}
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-slate-100"><tr className="text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Child Details</th>
                    <th className="px-6 py-4 font-bold text-center">Funded (Hrs)</th>
                    <th className="px-6 py-4 font-bold text-center">Private (Hrs)</th>
                    {/* 痛點 7: 耗材費與附加費 */}
                    <th className="px-6 py-4 font-bold text-center">Top-ups & Meals</th>
                    <th className="px-6 py-4 font-bold text-right">Parent Total</th>
                    <th className="px-6 py-4 font-bold text-center">Invoice</th>
                    <th className="px-6 py-4 font-bold text-center">Reconciliation</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(s => {
                      const isPaid = s.paymentStatus.includes('Paid');
                      return (
                        <tr key={s.id} className={`hover:bg-slate-50/80 transition group ${isPaid ? 'bg-emerald-50/20' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 flex items-center">
                              {s.name} 
                              {/* 痛點 6: SEND 標籤 */}
                              {s.isSEND && <span className="ml-2 text-[10px] uppercase font-black bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md" title="Special Educational Needs">SEND</span>}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 font-medium flex items-center">
                              {s.tfcRef ? <><span className="w-2 h-2 rounded-full bg-blue-400 mr-1.5"></span>TFC: {s.tfcRef}</> : <><span className="w-2 h-2 rounded-full bg-slate-300 mr-1.5"></span>Self-Pay</>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {s.fundedHours > 0 ? <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">{s.fundedHours}h</span> : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-slate-700">{s.privateHours}h</span>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-500 font-medium">£{s.consumables}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-black text-slate-900 text-base">£{s.totalParentFee.toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {s.invoiceStatus === 'Sent' 
                              ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><Check size={14} className="mr-1"/>Sent</span> 
                              : <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500"><Clock size={14} className="mr-1"/>Draft</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isPaid 
                              ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"><Sparkles size={14} className="mr-1"/>{s.paymentStatus}</span> 
                              : <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100"><AlertCircle size={14} className="mr-1"/>Unpaid</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F5F7] font-sans antialiased text-slate-900 overflow-hidden">
      
      {/* 桌面版側邊欄 (Apple 風格) */}
      <aside className="w-64 bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 hidden md:flex flex-col relative">
        <div className="p-6 pt-8 pb-4">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-sm shadow-blue-500/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <div><h1 className="text-slate-900 font-extrabold text-lg leading-tight tracking-tight">NurseryFinance</h1><p className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">The CFO Brain</p></div>
          </div>
          
          {/* 痛點 8: 多校區選擇器 (Multi-site Selector) */}
          <div className="mb-6 relative">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block px-1">Location</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                <option>London (Chelsea)</option>
                <option>Manchester (Central)</option>
                <option>Bristol (Clifton)</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <nav className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block px-1 mt-4">Modules</label>
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <LayoutDashboard size={20} /><span>CFO Dashboard</span>
            </button>
            <button onClick={() => setActiveTab('billing')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === 'billing' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <FileText size={20} /><span>Funding Decoder</span>
            </button>
            <button onClick={() => setActiveTab('profitability')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition font-medium ${activeTab === 'profitability' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Users size={20} /><span>Optimisation</span>
            </button>
          </nav>
        </div>
        
        <div className="mt-auto p-6 pb-8">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">JD</div>
              <div className="flex flex-col"><span className="text-sm font-bold text-slate-900">Jane Doe</span><span className="text-[10px] text-slate-500 uppercase font-bold">Director</span></div>
            </div>
          </div>
        </div>
      </aside>

      {/* 主要內容區 */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* 行動裝置頂部 Header */}
        <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-5 py-4 shrink-0 z-30 sticky top-0">
          <div className="flex items-center space-x-2">
             <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow-sm"><Sparkles size={16} className="text-white" /></div>
             <h1 className="text-slate-900 font-extrabold text-lg tracking-tight">NurseryFinance</h1>
          </div>
          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">JD</div>
        </header>

        {/* 動態內容渲染區 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>

        {/* 行動裝置底部導覽列 (iOS Bottom Tab Bar) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 flex justify-around p-2 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 min-w-[70px] transition-colors ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
            <LayoutDashboard size={24} className="mb-1" />
            <span className="text-[10px] font-bold">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('billing')} className={`flex flex-col items-center p-2 min-w-[70px] transition-colors ${activeTab === 'billing' ? 'text-blue-600' : 'text-slate-400'}`}>
            <FileText size={24} className="mb-1" />
            <span className="text-[10px] font-bold">Billing</span>
          </button>
          <button onClick={() => setActiveTab('profitability')} className={`flex flex-col items-center p-2 min-w-[70px] transition-colors ${activeTab === 'profitability' ? 'text-blue-600' : 'text-slate-400'}`}>
            <Users size={24} className="mb-1" />
            <span className="text-[10px] font-bold">Optimise</span>
          </button>
        </nav>
      </main>
    </div>
  );
}