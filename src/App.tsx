import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Mail, Clock, PoundSterling, FileText, AlertCircle, RefreshCw, 
  Database, Sparkles, Check, Search, LayoutDashboard, 
  TrendingUp, Users, PieChart, ShieldCheck, Wallet, Bell,
  ChevronDown, MapPin, BadgeInfo, Star, FileOutput, X, Printer, Receipt,
  UserPlus, UserMinus, UserCheck, AlertTriangle, ShieldAlert, Activity, LineChart, Building,
  ReceiptText, Calculator, Wand2, ArrowDownToLine, Smartphone, Hourglass, Eye, EyeOff, CheckCircle
} from 'lucide-react';

const APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzvIzwCL52hTRwn07LeE94gMEJzIte92Z-XuBMlrEm3THOESmKd98Lcl00Q_QGsb6W4tw/exec"; 

// === 核心資料產生器 ===
const generateMockData = (siteName) => {
  const baseNames = ["Oliver Smith", "Amelia Jones", "George Williams", "Isla Brown", "Harry Taylor", "Ava Davies", "Jack Evans", "Mia Thomas", "Noah Roberts", "Sophia Johnson"];
  const rooms = ["Baby Room (Under 2s)", "Toddler Room (2-3y)", "Pre-School (3-5y)"];
  
  const siteModifier = siteName.includes('London') ? 0 : siteName.includes('Manchester') ? 1 : 2;
  const studentCount = 40 + (siteModifier * 10); 

  return Array.from({ length: studentCount }).map((_, index) => {
    const name = index < 10 ? baseNames[index] : `${baseNames[index % 10]} (Sibling ${index})`;
    const age = ((index + siteModifier) % 4) + 1; 
    const room = age < 2 ? rooms[0] : age < 3 ? rooms[1] : rooms[2];
    
    const totalHours = 60 + ((index + siteModifier) % 4) * 20;
    const fundedHours = age >= 3 ? (index % 2 === 0 ? 30 : 15) : 0; 
    const privateHours = Math.max(0, totalHours - fundedHours);
    
    const fundingType = index % 3 === 0 ? 'Term Time (38w)' : 'Stretched (51w)';
    
    const rate = siteModifier === 0 ? 9.50 : 8.50; 
    const consumables = 40 + (index % 3) * 5; 
    const privateFee = privateHours * rate;
    const fundedClaim = fundedHours * (siteModifier === 0 ? 6.00 : 5.50); 
    
    const isSEND = (index + siteModifier) % 10 === 0; 
    const sendFunding = isSEND ? 150 : 0; 
    
    const hasFundingError = fundedHours > 0 && (index % 11 === 0);
    const invoiceStatus = (index + siteModifier) % 5 === 1 ? 'Sent' : 'Draft';
    
    return {
      id: index + 1,
      name, age, room, isSEND, hasFundingError, fundingType,
      email: `parent${index + 1}@example.com`,
      totalHours, fundedHours, privateHours, rate, privateFee, fundedClaim, sendFunding, consumables,
      totalParentFee: privateFee + consumables,
      tfcRef: index % 2 === 0 ? `TFC-CHIL${100+index+siteModifier}` : '',
      invoiceStatus,
      paymentStatus: invoiceStatus === 'Sent' ? ((index + siteModifier) % 3 === 0 ? 'Unpaid' : 'Paid (Bank Transfer)') : 'Unpaid'
    };
  });
};

const generateMockExpenses = () => [
  { id: 1, date: 'Today', vendor: 'Tesco Business', category: 'Consumables', amount: 145.20, status: 'Logged' },
  { id: 2, date: 'Yesterday', vendor: 'Nursery Supplies UK', category: 'Resources', amount: 320.50, status: 'Needs Review' },
  { id: 3, date: '3 days ago', vendor: 'British Gas', category: 'Utilities', amount: 450.00, status: 'Logged' },
  { id: 4, date: 'Last Week', vendor: 'Amazon UK', category: 'Consumables', amount: 85.90, status: 'Logged' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSite, setSelectedSite] = useState('London (Chelsea)');
  const [students, setStudents] = useState(() => generateMockData(selectedSite));
  const [expenses, setExpenses] = useState(generateMockExpenses());
  
  const [invoiceModalData, setInvoiceModalData] = useState(null);
  const [showAIExplain, setShowAIExplain] = useState(false); 
  const [staffData, setStaffData] = useState({ pool: 0, rooms: {} }); 

  const [isProcessing, setIsProcessing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isChasing, setIsChasing] = useState(false); 
  const [isSyncingEYFS, setIsSyncingEYFS] = useState(false); 
  const [isPreflightRunning, setIsPreflightRunning] = useState(false); 
  const [preflightDone, setPreflightDone] = useState(false);
  const [isScanning, setIsScanning] = useState(false); 

  // 優化 1: GDPR 隱私防偷窺模式 (Privacy Mode)
  const [privacyMode, setPrivacyMode] = useState(false);

  const [apiStatus, setApiStatus] = useState('loading'); 
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setApiStatus('loading');
    setPreflightDone(false); 
    const timer = setTimeout(() => {
      setStudents(generateMockData(selectedSite));
      setExpenses(generateMockExpenses());
      
      setStaffData({
        pool: 0,
        rooms: {
          baby: { id: 'baby', name: 'Baby Room (Under 2s)', desc: 'Statutory 1:3', children: 8, cap: 12, staff: 4, agencyStaff: 0, ratio: 3, revenue: 560, cost: 120, agencyCost: 240, color: 'rose' },
          toddler: { id: 'toddler', name: 'Toddler Room (2-3y)', desc: 'Statutory 1:4', children: 12, cap: 12, staff: 3, agencyStaff: 0, ratio: 4, revenue: 840, cost: 120, agencyCost: 240, color: 'amber' },
          preschool: { id: 'preschool', name: 'Pre-School (3-5y)', desc: 'Statutory 1:8', children: 22, cap: 24, staff: 2, agencyStaff: 0, ratio: 8, revenue: 1540, cost: 120, agencyCost: 240, color: 'emerald' }
        }
      });
      setApiStatus('demo_mode');
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedSite]);

  // === 輔助函數：隱私金額格式化 ===
  const formatMoney = (amount, decimals = 2) => {
    if (privacyMode) return '£***';
    return `£${amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  // === 操作邏輯 (彈性與自動化) ===
  const handleRemoveStaff = (roomId) => {
    setStaffData(prev => {
      const newRooms = { ...prev.rooms };
      if (newRooms[roomId].agencyStaff > 0) {
        newRooms[roomId].agencyStaff -= 1;
        return { ...prev, rooms: newRooms };
      }
      if (newRooms[roomId].staff > 0) {
        newRooms[roomId].staff -= 1;
        return { ...prev, pool: prev.pool + 1, rooms: newRooms };
      }
      return prev;
    });
  };

  const handleAddStaff = (roomId) => {
    setStaffData(prev => {
      if (prev.pool > 0) {
        const newRooms = { ...prev.rooms };
        newRooms[roomId].staff += 1;
        return { ...prev, pool: prev.pool - 1, rooms: newRooms };
      }
      return prev;
    });
  };

  // 優化 3: AI 自動排班 (Auto-Fix Ratios) - 保留彈性的自動化
  const handleAutoFixRatios = () => {
    setStaffData(prev => {
      let currentPool = prev.pool;
      const newRooms = { ...prev.rooms };
      
      // 1. 先把過度排班 (Overstaffed) 的人抽出來放回 Pool
      Object.keys(newRooms).forEach(roomId => {
          const room = newRooms[roomId];
          const reqStaff = Math.ceil(room.children / room.ratio);
          while (room.staff > reqStaff) {
              room.staff -= 1;
              currentPool += 1;
          }
      });

      // 2. 把 Pool 的人補給違法 (Non-compliant) 的房間
      Object.keys(newRooms).forEach(roomId => {
        const room = newRooms[roomId];
        const reqStaff = Math.ceil(room.children / room.ratio);
        while ((room.staff + room.agencyStaff) < reqStaff && currentPool > 0) {
          room.staff += 1;
          currentPool -= 1;
        }
      });
      return { pool: currentPool, rooms: newRooms };
    });
    alert('AI has redistributed staff to ensure statutory compliance where possible.');
  };

  const handleAddAgencyStaff = (roomId) => {
    setStaffData(prev => {
      const newRooms = { ...prev.rooms };
      newRooms[roomId].agencyStaff += 1;
      return { ...prev, rooms: newRooms };
    });
  };

  const handlePreflightCheck = () => {
    setIsPreflightRunning(true);
    setTimeout(() => { setIsPreflightRunning(false); setPreflightDone(true); }, 2000);
  };

  const handleDispatch = () => {
    setIsProcessing(true);
    setTimeout(() => { setStudents(students.map(s => ({ ...s, invoiceStatus: 'Sent' }))); setIsProcessing(false); alert('Invoices sent to parents.'); }, 1500);
  };

  const handleCSVUpload = (e) => {
    if (!e.target.files?.[0]) return;
    setIsReconciling(true);
    setTimeout(() => { setStudents(students.map(s => s.paymentStatus === 'Unpaid' && s.tfcRef !== '' ? { ...s, paymentStatus: 'Paid (TFC Bank)' } : s)); setIsReconciling(false); alert('Bank reconciliation complete.'); if(fileInputRef.current) fileInputRef.current.value = ''; }, 1500);
  };

  // 優化 3: 手動覆寫付款狀態 (Manual Override)
  const handleManualPayment = (id) => {
    setStudents(students.map(s => s.id === id ? { ...s, paymentStatus: 'Paid (Cash/Manual)' } : s));
  };

  const handleChaseDebt = () => {
    setIsChasing(true);
    setTimeout(() => { 
      alert(`Automated BACS reminders sent to ${unpaidCount} parents. Funds will clear directly into your nursery bank account.`); 
      setIsChasing(false); 
    }, 1200);
  };

  const handleSyncEYFS = () => {
    setIsSyncingEYFS(true);
    setTimeout(() => { alert('Attendance synced successfully.'); setIsSyncingEYFS(false); }, 1500);
  };

  const handleScanReceipt = () => {
    setIsScanning(true);
    setTimeout(() => { 
      setExpenses([{ id: Date.now(), date: 'Just Now', vendor: 'Smart AI Scan', category: 'Consumables', amount: 56.20, status: 'Logged' }, ...expenses]);
      setIsScanning(false); 
      alert('Receipt processed.'); 
    }, 1500);
  };

  const handleExportLog = () => {
    const headers = ["Child ID", "Name", "Funding Type", "Total Hours", "Total Parent Fee (£)", "TFC Ref", "Payment Status"];
    const csvRows = students.map(s => [s.id, `"${s.name}"`, s.fundingType, s.totalHours, s.totalParentFee, s.tfcRef || "N/A", `"${s.paymentStatus}"`].join(","));
    downloadCSV(headers, csvRows, `Compliance_Log_${selectedSite}`);
  };

  const handleExportBankPnL = () => {
    const headers = ["Category", "Amount (£)", "Percentage", "Notes"];
    const csvRows = [
      ["Gross Revenue", totalRev.toFixed(2), "100%", "Includes Private & Funded"],
      ["Labour Cost", (totalRev * 0.62).toFixed(2), "62%", "Salaries & NI"],
      ["Overheads & Rent", (totalRev * 0.15).toFixed(2), "15%", "Fixed Costs"],
      ["Est. Profit", (totalRev * 0.23).toFixed(2), "23%", "Pre-tax"]
    ].map(row => row.join(","));
    downloadCSV(headers, csvRows, `Financial_Report_${selectedSite}`);
  };

  const downloadCSV = (headers, rows, filename) => {
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${filename.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintInvoice = () => { window.print(); };

  // === 即時計算區 ===
  const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const pendingCount = students.filter(s => s.invoiceStatus === 'Pending').length;
  const unpaidCount = students.filter(s => s.paymentStatus === 'Unpaid' && s.invoiceStatus === 'Sent').length;
  
  const totalParentRev = students.reduce((acc, curr) => acc + curr.totalParentFee, 0);
  const totalFundedRev = students.reduce((acc, curr) => acc + curr.fundedClaim + curr.sendFunding, 0);
  const totalRev = totalParentRev + totalFundedRev;
  const unpaidAmount = students.filter(s => s.paymentStatus === 'Unpaid' && s.invoiceStatus === 'Sent').reduce((acc, curr) => acc + curr.totalParentFee, 0);
  const errorCount = students.filter(s => s.hasFundingError).length;

  const estGrossMargin = selectedSite.includes('London') ? 24.5 : selectedSite.includes('Manchester') ? 28.1 : 21.0;
  const occupancyRate = selectedSite.includes('London') ? '82%' : selectedSite.includes('Manchester') ? '94%' : '76%';
  
  const currentBankBalance = selectedSite.includes('London') ? 14200 : selectedSite.includes('Manchester') ? 28500 : 9400;
  const upcomingPayroll = totalRev * 0.62; 
  const liquidityShortfall = currentBankBalance < upcomingPayroll ? upcomingPayroll - currentBankBalance : 0;
  const daysToFunding = selectedSite.includes('London') ? 12 : selectedSite.includes('Manchester') ? 5 : 18;

  const estimatedValuation = (totalRev * 12 * (estGrossMargin/100) * 4); 

  // === 畫面渲染路由器 ===
  const renderContent = () => {
    if (apiStatus === 'loading') {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-blue-500 mr-3" size={32} />
          <span className="text-slate-500 font-medium">Syncing data safely...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 pb-24 md:pb-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2 mb-2">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Overview</h3>
                <span className="text-sm text-slate-500 font-medium">30-Day Forecast for {selectedSite}</span>
              </div>
              <div className="flex items-center text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm w-fit">
                <Clock size={14} className="mr-1.5" /> Updated: Just now
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><TrendingUp size={24} /></div>
                  <div className="text-right"><p className="text-sm text-slate-500 font-medium">Est. Gross Margin</p><p className="text-3xl font-bold text-slate-900 mt-1">{privacyMode ? '***' : `${estGrossMargin}%`}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between"><span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">+2.1% vs Prev</span><span className="text-xs text-slate-400">Healthy</span></div>
              </div>
              
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><PieChart size={24} /></div>
                  <div className="text-right"><p className="text-sm text-slate-500 font-medium">Occupancy</p><p className="text-3xl font-bold text-slate-900 mt-1">{occupancyRate}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between"><span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-md">Target: 85%</span></div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><PoundSterling size={24} /></div>
                  <div className="text-right"><p className="text-sm text-slate-500 font-medium">Total Income</p><p className="text-3xl font-bold text-emerald-700 mt-1">{formatMoney(totalRev, 0)}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-medium"><span className="text-slate-500">Parents</span><span className="text-slate-700">{formatMoney(totalParentRev, 0)}</span></div>
                  <div className="flex justify-between text-xs font-medium"><span className="text-slate-500">Local Authority</span><span className="text-slate-700">{formatMoney(totalFundedRev, 0)}</span></div>
                </div>
              </div>

              <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-100 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="bg-rose-100 p-3 rounded-2xl text-rose-600"><AlertCircle size={24}/></div>
                  <div className="text-right"><p className="text-sm text-rose-700/80 font-medium">Cashflow at Risk</p><p className="text-3xl font-bold text-rose-700 mt-1">{formatMoney(unpaidAmount, 0)}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-rose-100/50 flex items-center justify-between relative z-10">
                  <span className="text-xs text-rose-700 font-bold">{unpaidCount} Overdue</span>
                  <button 
                    onClick={handleChaseDebt} 
                    disabled={unpaidCount === 0 || isChasing} 
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold flex items-center transition shadow-sm ${unpaidCount === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95'}`}
                  >
                    {isChasing ? <RefreshCw size={12} className="animate-spin mr-1"/> : <Mail size={12} className="mr-1"/>}
                    Chase Reminders
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden flex flex-col">
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mb-10"></div>
                <div className="relative z-10 flex-1">
                  <div className="flex items-center mb-4 text-slate-300"><Hourglass size={20} className="mr-2"/> <h4 className="font-bold">Cashflow Survival Radar</h4></div>
                  
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Bank Balance</p>
                      <p className="text-3xl font-black text-white">{formatMoney(currentBankBalance, 0)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Upcoming Payroll</p>
                       <p className="text-lg font-bold text-amber-400">{formatMoney(upcomingPayroll, 0)}</p>
                    </div>
                  </div>

                  {liquidityShortfall > 0 ? (
                    <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-start">
                      <AlertTriangle size={16} className="text-rose-400 mr-2 shrink-0 mt-0.5"/>
                      <p className="text-xs text-rose-200 leading-relaxed">
                        <strong>Warning: {formatMoney(liquidityShortfall, 0)} shortfall</strong> expected before payroll. Local Authority funding ({formatMoney(totalFundedRev, 0)}) arrives in <strong className="text-white">{daysToFunding} days</strong>. Chase overdue debts via BACS or <a href="#" className="underline font-bold hover:text-white">explore 14-day bridge finance</a>. {/* 優化 5: 變現機制 C (資金過橋推薦) */}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-start">
                      <Check size={16} className="text-emerald-400 mr-2 shrink-0 mt-0.5"/>
                      <p className="text-xs text-emerald-200 leading-relaxed">
                        Cashflow is healthy. Your current balance covers the upcoming payroll. Local Authority funding arrives in {daysToFunding} days to replenish reserves.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center mb-4 text-indigo-200"><Activity size={20} className="mr-2"/> <h4 className="font-bold">Future Admissions (Waitlist)</h4></div>
                  <div className="flex justify-between items-end mb-6">
                    <div><p className="text-xs text-indigo-300 uppercase">Potential Revenue</p><p className="text-3xl font-black">{formatMoney(24500, 0)}</p></div>
                    <div className="text-right"><p className="text-lg font-bold text-emerald-400">+12 Children</p></div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="h-2 bg-slate-800 rounded-full flex overflow-hidden mb-2">
                       <div className="bg-indigo-500" style={{width: '60%'}}></div><div className="bg-amber-500" style={{width: '30%'}}></div><div className="bg-emerald-500" style={{width: '10%'}}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase"><span>Baby (60%)</span><span>Toddler (30%)</span><span>Pre (10%)</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
               <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center"><PieChart className="mr-2 text-slate-400" size={20}/> Income vs Labour Cost ({selectedSite})</h4>
                  <div className="space-y-6">
                     <div>
                       <div className="flex justify-between text-sm mb-2"><span className="text-emerald-700 font-bold">Total Expected Income</span><span className="font-bold text-slate-900">{formatMoney(totalRev, 0)}</span></div>
                       <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden"><div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{width: '100%'}}></div></div>
                     </div>
                     <div>
                       <div className="flex justify-between text-sm mb-2"><span className="text-amber-600 font-bold">Est. Labour Costs (Wages/NI/Pension)</span><span className="font-bold text-slate-900">{formatMoney(totalRev * 0.62, 0)}</span></div>
                       <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden relative">
                         <div className="bg-amber-400 h-full rounded-full transition-all duration-1000" style={{width: '62%'}}></div>
                         <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-rose-500" style={{left: '65%'}} title="Safe Target: 65%"></div>
                       </div>
                       <p className="text-xs text-slate-400 mt-2">Target benchmark: &lt; 65% of Income</p>
                     </div>
                  </div>
               </div>
               
               <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-6 md:p-8 rounded-3xl shadow-sm text-slate-800 relative overflow-hidden flex flex-col justify-between border border-slate-300">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center"><Building size={20} className="mr-2 text-slate-500"/> Nursery Valuation Estimate</h4>
                    <p className="text-xs text-slate-500 mb-6">Based on your current {privacyMode ? '***' : `${estGrossMargin}%`} gross margin and run-rate.</p>
                    <div className="flex justify-between items-end mb-4">
                      <div><p className="text-xs text-slate-500 uppercase font-bold">Market Value</p><p className="text-3xl font-black text-slate-900">{formatMoney(estimatedValuation, 0)}</p></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-300">
                     <button onClick={handleExportBankPnL} className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 py-2.5 rounded-xl text-sm font-bold flex justify-center items-center transition shadow-sm">
                       <ArrowDownToLine size={16} className="mr-2"/> Export Financial Report
                     </button>
                  </div>
               </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="pb-24 md:pb-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices & Funding</h3>
                <span className="text-sm text-slate-500 font-medium">Manage parent bills and local authority claims</span>
              </div>
              <button onClick={handleSyncEYFS} disabled={isSyncingEYFS} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-100 transition active:scale-95">
                <RefreshCw size={16} className={`mr-2 ${isSyncingEYFS ? 'animate-spin' : ''}`}/> Sync Registers (Famly/Blossom)
              </button>
            </div>

            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col xl:flex-row justify-between gap-3">
              <div className="relative w-full xl:w-80 h-12 shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder="Search child or TFC Ref..." className="w-full h-full pl-12 pr-4 bg-slate-50 border-0 rounded-xl text-sm outline-none" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex flex-col md:flex-row gap-3 p-2 xl:p-0 w-full xl:w-auto">
                <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCSVUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 xl:flex-none flex justify-center items-center px-4 h-12 rounded-xl font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition shadow-sm active:scale-[0.98] whitespace-nowrap">
                  <Wallet className="mr-2" size={18} /> Sync Bank CSV
                </button>
                <button onClick={handlePreflightCheck} disabled={isPreflightRunning || preflightDone} className={`flex-1 xl:flex-none flex justify-center items-center px-5 h-12 rounded-xl font-bold border transition whitespace-nowrap ${preflightDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'}`}>
                  {isPreflightRunning ? <RefreshCw className="animate-spin mr-2" size={18} /> : preflightDone ? <Check className="mr-2" size={18}/> : <ShieldAlert className="mr-2 text-amber-500" size={18} />} 
                  Check Funding Errors
                </button>
                <button onClick={handleDispatch} className="flex-1 xl:flex-none flex justify-center items-center px-6 h-12 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm whitespace-nowrap">
                  Send Invoices
                </button>
              </div>
            </div>

            {preflightDone && errorCount > 0 && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start animate-in slide-in-from-top-4">
                <AlertTriangle className="text-amber-600 mr-3 shrink-0 mt-0.5" size={20}/>
                <div>
                  <h4 className="font-bold text-amber-900">Action Required: Local Authority Claim Risks</h4>
                  <p className="text-sm text-amber-800 mt-1">Found <strong>{errorCount}</strong> children with missing National Insurance numbers or invalid codes. Please fix these before submitting to prevent clawbacks.</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-wrap gap-4">
                <h3 className="font-bold text-slate-800 flex items-center text-sm uppercase tracking-wider"><FileText size={18} className="mr-2 text-slate-400"/> Parent Accounts</h3>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded-md hidden sm:flex"><BadgeInfo size={14} className="mr-1"/> Compliant Record</span>
                  <button onClick={handleExportLog} className="text-xs font-bold text-white bg-slate-800 px-4 py-2 rounded-lg flex items-center hover:bg-slate-700 transition active:scale-[0.98] shadow-sm">
                    <FileOutput size={14} className="mr-2" /> Export to Excel
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
                  <thead className="bg-white border-b border-slate-100">
                    <tr className="text-slate-400 text-xs uppercase">
                      <th className="px-6 py-4 font-bold">Child Name</th>
                      <th className="px-6 py-4 font-bold text-center">Funding Plan</th>
                      <th className="px-6 py-4 font-bold text-center">Total Hrs</th>
                      <th className="px-6 py-4 font-bold text-center">Meals/Extras</th>
                      <th className="px-6 py-4 font-bold text-right">Parent Pays</th>
                      <th className="px-6 py-4 font-bold text-center">Status</th>
                      <th className="px-6 py-4 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(s => {
                      const isPaid = s.paymentStatus.includes('Paid');
                      const showWarningRow = preflightDone && s.hasFundingError;
                      return (
                        <tr key={s.id} className={`hover:bg-slate-50/80 transition ${showWarningRow ? 'bg-amber-50/50 border-l-4 border-amber-400' : 'border-l-4 border-transparent'} ${isPaid && !showWarningRow ? 'bg-emerald-50/20' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 flex items-center">
                              {s.name} 
                              {s.isSEND && <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md font-black uppercase">SEND</span>}
                              {showWarningRow && <span className="ml-2 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-md font-black uppercase flex items-center"><AlertTriangle size={10} className="mr-1"/>Fix NI</span>}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 font-medium">{s.tfcRef ? `TFC: ${s.tfcRef}` : 'Self-Pay'}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {s.fundedHours > 0 ? (
                               <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${showWarningRow ? 'bg-amber-100 text-amber-800' : s.fundingType.includes('51w') ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {s.fundingType} ({s.fundedHours}h)
                               </span>
                            ) : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700">{s.totalHours}h</td>
                          <td className="px-6 py-4 text-center text-slate-500">{formatMoney(s.consumables)}</td>
                          <td className="px-6 py-4 text-right font-black text-slate-900 text-base">{formatMoney(s.totalParentFee)}</td>
                          <td className="px-6 py-4 text-center">
                            {isPaid 
                              ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><Sparkles size={14} className="mr-1"/>{s.paymentStatus}</span> 
                              : <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100"><AlertCircle size={14} className="mr-1"/>Unpaid</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                                {/* 優化 3: 手動覆寫標記為已付款按鈕 */}
                                {!isPaid && (
                                   <button onClick={() => handleManualPayment(s.id)} title="Mark as Paid (Cash/Manual)" className="p-1.5 rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition">
                                     <CheckCircle size={16}/>
                                   </button>
                                )}
                                <button onClick={() => { setInvoiceModalData(s); setShowAIExplain(false); }} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm active:scale-95">
                                  <Receipt size={14} className="mr-1.5"/> Invoice
                                </button>
                            </div>
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

      case 'optimisation':
        const { pool, rooms } = staffData;
        return (
          <div className="space-y-6 pb-24 md:pb-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Ratios & Rooms</h3>
                <span className="text-sm text-slate-500 font-medium">Ensure statutory compliance and avoid overstaffing</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                 {/* 優化 3: AI 自動調整按鈕 (Auto-Fix Ratios) */}
                 <button onClick={handleAutoFixRatios} className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-sm">
                    <Wand2 size={16} className="mr-2"/> Auto-Fix Ratios
                 </button>
                 <div className={`flex items-center px-4 py-2.5 rounded-xl font-bold border-2 transition-all shadow-sm ${pool > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700 scale-105' : 'bg-white border-slate-200 text-slate-500'}`}>
                    <Users size={18} className="mr-2" /> Available Staff: <span className="text-xl ml-2 font-black">{pool}</span>
                 </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {Object.entries(rooms).map(([roomId, room]) => {
                const totalStaffInRoom = room.staff + room.agencyStaff;
                const reqStaff = Math.ceil(room.children / room.ratio);
                const isCompliant = totalStaffInRoom >= reqStaff;
                const isOverstaffed = totalStaffInRoom > reqStaff;
                
                let statusBadge = null;
                if (totalStaffInRoom < reqStaff) {
                  statusBadge = <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded-md flex items-center animate-pulse"><AlertTriangle size={12} className="mr-1"/>Non-Compliant (Need {reqStaff - totalStaffInRoom} more)</span>;
                } else if (isOverstaffed) {
                  statusBadge = <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-md">Overstaffed (+{totalStaffInRoom - reqStaff})</span>;
                } else {
                  statusBadge = <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md flex items-center"><UserCheck size={12} className="mr-1"/>Optimal</span>;
                }

                const totalLabourCost = (room.staff * room.cost) + (room.agencyStaff * room.agencyCost);
                const profitMargin = (((room.revenue - totalLabourCost) / room.revenue) * 100).toFixed(1);
                const marginColor = profitMargin < 0 ? 'text-rose-600' : profitMargin < 15 ? 'text-amber-600' : 'text-emerald-600';

                const themeClasses = {
                  rose: { bg: 'bg-rose-50/50', border: 'border-rose-100', text: 'text-rose-950', badgeBg: 'bg-rose-200/80', badgeText: 'text-rose-900' },
                  amber: { bg: 'bg-amber-50/50', border: 'border-amber-100', text: 'text-amber-950', badgeBg: 'bg-amber-200/80', badgeText: 'text-amber-900' },
                  emerald: { bg: 'bg-emerald-50/50', border: 'border-emerald-100', text: 'text-emerald-950', badgeBg: 'bg-emerald-200/80', badgeText: 'text-emerald-900' }
                };
                const t = themeClasses[room.color];

                return (
                  <div key={roomId} className={`bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col transition-all hover:shadow-lg ${profitMargin < 0 ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-100'}`}>
                    <div className={`${t.bg} p-6 border-b ${t.border} flex justify-between items-center`}>
                      <h4 className={`font-bold text-lg ${t.text}`}>{room.name}</h4>
                      <span className={`text-xs font-bold ${t.badgeBg} ${t.badgeText} px-3 py-1.5 rounded-full`} title="Ofsted Requirement">{room.desc}</span>
                    </div>
                    <div className="p-6 space-y-6 flex-1 flex flex-col">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-medium">Children Attending</span>
                          <span className="font-bold text-slate-900 text-base">{room.children} / {room.cap} <span className="text-xs font-normal text-slate-400">(Capacity)</span></span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner gap-3">
                          <span className="text-slate-600 font-bold flex flex-col">
                            Staff Assigned
                            {room.agencyStaff > 0 && <span className="text-[10px] text-rose-500 mt-0.5 flex items-center"><AlertTriangle size={10} className="mr-1"/> +{room.agencyStaff} Agency (£££)</span>}
                          </span>
                          <div className="flex items-center justify-between w-full sm:w-auto">
                            <div className="flex items-center space-x-3 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                              <button onClick={() => handleRemoveStaff(roomId)} disabled={totalStaffInRoom === 0} className={`p-2 rounded-lg transition ${totalStaffInRoom === 0 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100 hover:text-rose-600 active:scale-95'}`}><UserMinus size={18}/></button>
                              <span className="font-black text-xl text-slate-900 w-6 text-center">{totalStaffInRoom}</span>
                              <button onClick={() => handleAddStaff(roomId)} disabled={pool === 0} className={`p-2 rounded-lg transition ${pool === 0 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-600 active:scale-95'}`} title="Assign Available Staff"><UserPlus size={18}/></button>
                            </div>
                            {/* 優化 5: 變現機制 B (派遣媒合抽成) */}
                            {pool === 0 && !isCompliant && (
                              <button onClick={() => handleAddAgencyStaff(roomId)} className="ml-2 bg-rose-100 text-rose-700 p-2 rounded-xl hover:bg-rose-200 transition active:scale-95 border border-rose-200" title="Request Agency Staff Cover">
                                <ShieldAlert size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end">{statusBadge}</div>
                      </div>
                      
                      <div className="pt-6 border-t border-slate-100 mt-auto flex justify-between items-start">
                        <span className="text-slate-500 font-medium flex flex-col">
                          Est. Room Profitability
                          {profitMargin < 0 && <span className="text-[10px] text-rose-500 mt-1 font-bold">Losing money today!</span>}
                        </span>
                        <span className={`font-black text-2xl transition-colors duration-300 ${marginColor}`}>{privacyMode ? '***' : `${profitMargin}%`}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-start">
                 <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 mr-4 shrink-0"><LineChart size={24}/></div>
                 <div>
                   <h4 className="font-bold text-slate-900">Dynamic Pricing Check</h4>
                   <p className="text-sm text-slate-500 mt-1">Inflation data shows local nursery operating costs rose 3.2% this quarter. Your current private rate is £{selectedSite.includes('London') ? '9.50' : '8.50'}/hr.</p>
                 </div>
               </div>
               <div className="flex flex-col items-end shrink-0">
                 <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-md mb-2">Suggested Rate: £{selectedSite.includes('London') ? '9.85' : '8.80'} (+4%)</span>
                 <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-800 transition active:scale-95">Update Future Fees</button>
               </div>
            </div>
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-6 pb-24 md:pb-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Receipts & Expenses</h3>
                <span className="text-sm text-slate-500 font-medium">Scan receipts and track supplier costs</span>
              </div>
              <button onClick={handleScanReceipt} disabled={isScanning} className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition active:scale-95 shadow-md">
                {isScanning ? <RefreshCw size={18} className="animate-spin mr-2"/> : <Smartphone size={18} className="mr-2"/>}
                {isScanning ? 'Processing Image...' : 'Scan Receipt'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
               <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                 <div><p className="text-sm text-slate-500 font-medium">Monthly Outgoings</p><p className="text-2xl font-bold text-slate-900 mt-1">{formatMoney(3420.50)}</p></div>
                 <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><ArrowDownToLine size={20}/></div>
               </div>
               
               {/* 優化 5: 變現機制 A (商用能源/保險切換推薦) */}
               <div className="lg:col-span-2 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-3xl border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                 <div>
                   <p className="text-sm text-emerald-800 font-bold flex items-center"><Sparkles size={16} className="mr-1.5"/> Smart Savings Alert</p>
                   <p className="text-sm text-emerald-700 mt-1">Our AI noticed you are paying above average for your commercial energy. Switch to a green tariff and save approximately £400/year.</p>
                 </div>
                 <a href="#" className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-700 whitespace-nowrap transition">Compare Tariffs</a>
               </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center"><ReceiptText size={18} className="mr-2 text-slate-400"/> Recent Logged Expenses</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-white border-b border-slate-100">
                    <tr className="text-slate-400 text-xs uppercase">
                      <th className="px-6 py-4 font-bold">Date</th>
                      <th className="px-6 py-4 font-bold">Supplier</th>
                      <th className="px-6 py-4 font-bold">Category</th>
                      <th className="px-6 py-4 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {expenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 text-slate-500 font-medium">{exp.date}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{exp.vendor}</td>
                        <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold">{exp.category}</span></td>
                        <td className="px-6 py-4 text-right font-black text-slate-800">{formatMoney(exp.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
    }
  };

  // === 系統主佈局 ===
  return (
    <>
      <div className={`flex h-screen bg-[#F5F5F7] font-sans antialiased text-slate-900 overflow-hidden ${invoiceModalData ? 'print:hidden' : ''}`}>
        
        {/* === 桌機版側邊欄 === */}
        <aside className="w-64 bg-white border-r border-slate-200 shadow-sm z-20 hidden md:flex flex-col relative shrink-0">
          <div className="p-6 pt-8 pb-4">
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-sm"><Sparkles size={20} className="text-white" /></div>
              <div>
                <h1 className="text-slate-900 font-extrabold text-lg leading-tight tracking-tight">NurseryFinance</h1>
                <p className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">For Managers</p>
              </div>
            </div>
            
            <div className="mb-6 relative">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block px-1">Location</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                  value={selectedSite} 
                  onChange={(e) => setSelectedSite(e.target.value)}
                >
                  <option value="London (Chelsea)">London (Chelsea)</option>
                  <option value="Manchester (Central)">Manchester (Central)</option>
                  <option value="Bristol (Clifton)">Bristol (Clifton)</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <nav className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block px-1 mt-4">Workspace</label>
              <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}><LayoutDashboard size={20} /><span>Dashboard</span></button>
              <button onClick={() => setActiveTab('billing')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'billing' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}><FileText size={20} /><span>Invoices & Funding</span></button>
              <button onClick={() => setActiveTab('optimisation')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'optimisation' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}><Users size={20} /><span>Staff Ratios</span></button>
              <button onClick={() => setActiveTab('expenses')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'expenses' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}><Calculator size={20} /><span>Receipts & Costs</span></button>
            </nav>
          </div>
          <div className="mt-auto p-6 pb-8">
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2"><div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">JD</div><div className="flex flex-col"><span className="text-sm font-bold text-slate-900">Jane Doe</span><span className="text-[10px] text-slate-500 uppercase font-bold">Manager</span></div></div>
             </div>
          </div>
        </aside>

        {/* === 主內容區塊 === */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
          {/* 行動裝置/桌面通用 Header */}
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-5 md:px-8 py-4 shrink-0 z-30 sticky top-0">
            <div className="flex items-center space-x-2 md:hidden">
               <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow-sm"><Sparkles size={16} className="text-white" /></div>
               <h1 className="text-slate-900 font-extrabold text-lg tracking-tight">NurseryFinance</h1>
            </div>
            <div className="hidden md:block">
               {/* 桌面版保留空白或麵包屑 */}
            </div>
            <div className="flex items-center space-x-4">
              {/* 優化 1: 隱私模式開關 */}
              <button 
                onClick={() => setPrivacyMode(!privacyMode)} 
                className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200"
                title="Hide sensitive financial numbers"
              >
                {privacyMode ? <EyeOff size={16} className="mr-1.5" /> : <Eye size={16} className="mr-1.5" />}
                {privacyMode ? 'Privacy On' : 'Privacy Off'}
              </button>
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm md:hidden">JD</div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 2xl:p-10 w-full">
            {/* 優化 1: 滿版超寬螢幕支援 */}
            <div className="max-w-[1600px] mx-auto w-full">
              {renderContent()}
            </div>
          </div>

          {/* 行動裝置底部導覽列 */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 flex justify-around p-2 pb-safe z-50">
            <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}><LayoutDashboard size={22} className="mb-1" /><span className="text-[10px] font-bold">Dash</span></button>
            <button onClick={() => setActiveTab('billing')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'billing' ? 'text-blue-600' : 'text-slate-400'}`}><FileText size={22} className="mb-1" /><span className="text-[10px] font-bold">Billing</span></button>
            <button onClick={() => setActiveTab('optimisation')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'optimisation' ? 'text-blue-600' : 'text-slate-400'}`}><Users size={22} className="mb-1" /><span className="text-[10px] font-bold">Ratios</span></button>
            <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'expenses' ? 'text-blue-600' : 'text-slate-400'}`}><Calculator size={22} className="mb-1" /><span className="text-[10px] font-bold">Receipts</span></button>
          </nav>
        </main>
      </div>

      {/* === 彈出層：智能發票 PDF Modal === */}
      {invoiceModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none relative overflow-hidden">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100 print:hidden relative z-10 bg-white">
              <h2 className="font-bold text-lg flex items-center text-slate-800"><Receipt className="mr-2 text-blue-600"/> Invoice Preview</h2>
              <button onClick={() => { setInvoiceModalData(null); setShowAIExplain(false); }} className="p-2 bg-slate-50 hover:bg-slate-200 rounded-full transition"><X size={20} className="text-slate-500"/></button>
            </div>

            <div className="p-8 md:p-10 overflow-y-auto print:overflow-visible relative z-10 bg-white">
              
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">INVOICE</h1>
                  <p className="text-slate-500 mt-2 font-medium">{selectedSite} Nursery</p>
                  <p className="text-slate-400 text-sm">123 Early Years Road, UK</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Invoice No.</p>
                  <p className="text-xl font-bold text-slate-800">INV-2026-{(invoiceModalData.id).toString().padStart(4, '0')}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-4 mb-1">Date</p>
                  <p className="text-sm font-medium text-slate-800">{new Date().toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10 p-6 bg-slate-50 rounded-2xl print:border print:border-slate-100 print:bg-transparent">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Billed To (Parent)</p>
                  <p className="font-bold text-slate-800">{invoiceModalData.email.split('@')[0].toUpperCase()} Family</p>
                  <p className="text-sm text-slate-500 mt-1">{invoiceModalData.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Child Details</p>
                  <p className="font-bold text-slate-800">{invoiceModalData.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{invoiceModalData.age} Years Old • {invoiceModalData.room}</p>
                  <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded mt-2 inline-block">Funding: {invoiceModalData.fundingType}</p>
                </div>
              </div>

              <div className="mb-10">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-400 uppercase text-xs">
                      <th className="pb-3 font-bold">Service Breakdown</th>
                      <th className="pb-3 font-bold text-center">Hours</th>
                      <th className="pb-3 font-bold text-right">Rate</th>
                      <th className="pb-3 font-bold text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="text-slate-500">
                      <td className="py-4"><span className="font-bold text-slate-700">Gov. Funded Hours</span></td>
                      <td className="py-4 text-center">{invoiceModalData.fundedHours}</td>
                      <td className="py-4 text-right">-</td>
                      <td className="py-4 text-right font-bold text-slate-800">£0.00</td>
                    </tr>
                    <tr className="text-slate-500">
                      <td className="py-4"><span className="font-bold text-slate-700">Private Hours</span></td>
                      <td className="py-4 text-center">{invoiceModalData.privateHours}</td>
                      <td className="py-4 text-right">£{invoiceModalData.rate.toFixed(2)}</td>
                      <td className="py-4 text-right font-bold text-slate-800">£{invoiceModalData.privateFee.toFixed(2)}</td>
                    </tr>
                    <tr className="text-slate-500">
                      <td className="py-4"><span className="font-bold text-slate-700">Consumables Top-up</span></td>
                      <td className="py-4 text-center">-</td>
                      <td className="py-4 text-right">-</td>
                      <td className="py-4 text-right font-bold text-slate-800">£{invoiceModalData.consumables.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2 text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span>£{invoiceModalData.totalParentFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-4 border-t-2 border-slate-800 mt-2">
                    <span className="text-lg font-bold text-slate-900">Total Due</span>
                    <span className="text-2xl font-black text-slate-900">£{invoiceModalData.totalParentFee.toFixed(2)}</span>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-left print:border-slate-300 print:bg-white">
                     <p className="text-xs text-blue-700 font-bold uppercase mb-2 print:text-slate-800">Payment Details (BACS)</p>
                     <p className="text-sm font-bold text-slate-800">NurseryFinance Ltd</p>
                     <p className="text-sm text-slate-600">Sort Code: <span className="font-mono font-bold text-slate-800">20-40-60</span></p>
                     <p className="text-sm text-slate-600">Account: <span className="font-mono font-bold text-slate-800">87654321</span></p>
                     <p className="text-xs text-blue-600 mt-2 print:text-slate-800">Ref: <span className="font-bold">{invoiceModalData.name.split(' ')[0]}INV</span></p>
                  </div>
                </div>
              </div>
            </div>

            {showAIExplain && (
              <div className="absolute bottom-[80px] right-6 w-80 bg-white border border-indigo-100 shadow-2xl rounded-2xl p-5 z-50 animate-in slide-in-from-bottom-4 print:hidden">
                <div className="flex items-center mb-3">
                  <Wand2 className="text-indigo-500 mr-2" size={18}/>
                  <h4 className="font-bold text-indigo-900 text-sm">Explain to Parent</h4>
                  <button onClick={()=>setShowAIExplain(false)} className="ml-auto text-slate-400 hover:text-slate-600"><X size={16}/></button>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Hi {invoiceModalData.email.split('@')[0]}! This month, the government covered <strong>{invoiceModalData.fundedHours} hours</strong> (£0 to you). <br/><br/>
                  You paid for <strong>{invoiceModalData.privateHours} additional hours</strong>, plus a <strong>£{invoiceModalData.consumables.toFixed(2)} top-up</strong> which legally covers organic meals, snacks, and nappies not funded by the state.
                </p>
              </div>
            )}

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-3xl print:hidden relative z-10">
              <button onClick={() => setShowAIExplain(!showAIExplain)} className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-200 transition active:scale-95">
                <Wand2 size={16} className="mr-2"/> Generate Parent Reply
              </button>
              <div className="flex gap-3">
                 <button onClick={() => { setInvoiceModalData(null); setShowAIExplain(false); }} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border hover:bg-slate-50 transition active:scale-95">Close</button>
                 <button onClick={handlePrintInvoice} className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition flex items-center active:scale-95">
                   <Printer size={18} className="mr-2"/> Save PDF
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}