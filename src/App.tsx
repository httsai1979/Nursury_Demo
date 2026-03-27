import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, Clock, PoundSterling, FileText, AlertCircle, RefreshCw, 
  Sparkles, Check, Search, LayoutDashboard, 
  TrendingUp, Users, PieChart, ShieldCheck, Wallet, Bell,
  ChevronDown, MapPin, BadgeInfo, Star, FileOutput, X, Printer, Receipt,
  UserPlus, UserMinus, UserCheck, AlertTriangle, ShieldAlert, Activity, LineChart, Building,
  Wand2, ArrowDownToLine, Hourglass, Eye, EyeOff, CheckCircle,
  Settings as SettingsIcon, HardDrive, UploadCloud, Trash2, Save, Gift, FileSpreadsheet
} from 'lucide-react';

// === 核心資料產生器 ===
const generateMockData = (siteName, settings) => {
  const baseNames = ["Oliver Smith", "Amelia Jones", "George Williams", "Isla Brown", "Harry Taylor", "Ava Davies", "Jack Evans", "Mia Thomas", "Noah Roberts", "Sophia Johnson"];
  const rooms = ["Baby Room (Under 2s)", "Toddler Room (2-3y)", "Pre-School (3-5y)"];
  
  const siteModifier = siteName.includes('London') ? 0 : siteName.includes('Manchester') ? 1 : 2;
  const studentCount = 30 + (siteModifier * 5); 

  return Array.from({ length: studentCount }).map((_, index) => {
    const name = index < 10 ? baseNames[index] : `${baseNames[index % 10]} (Sibling ${index})`;
    const age = ((index + siteModifier) % 4) + 1; 
    const room = age < 2 ? rooms[0] : age < 3 ? rooms[1] : rooms[2];
    
    const totalHours = 60 + ((index + siteModifier) % 4) * 20;
    const fundedHours = age >= 3 ? (index % 2 === 0 ? 30 : 15) : 0; 
    const privateHours = Math.max(0, totalHours - fundedHours);
    
    const fundingType = index % 3 === 0 ? 'Term Time (38w)' : 'Stretched (51w)';
    
    const rate = settings.baseRate; 
    const consumables = settings.consumablesFee + (index % 3) * 5; 
    const privateFee = privateHours * rate;
    const fundedClaim = fundedHours * settings.fundingRate; 
    
    const isSEND = (index + siteModifier) % 10 === 0; 
    const sendFunding = isSEND ? 150 : 0; 
    
    // USP: 隱藏的 EYPP/DAF 補助資格 (供 Maximiser 模組挖掘)
    const eligibleForEYPP = age >= 3 && (index % 7 === 0);
    const eligibleForDAF = isSEND && (index % 9 === 0);

    const hasFundingError = fundedHours > 0 && (index % 11 === 0);
    const invoiceStatus = (index + siteModifier) % 5 === 1 ? 'Sent' : 'Draft';
    
    return {
      id: index + 1,
      name, age, room, isSEND, hasFundingError, fundingType, eligibleForEYPP, eligibleForDAF,
      email: `parent${index + 1}@example.com`,
      totalHours, fundedHours, privateHours, rate, privateFee, fundedClaim, sendFunding, consumables,
      totalParentFee: privateFee + consumables,
      tfcRef: index % 2 === 0 ? `TFC-CHIL${100+index+siteModifier}` : '',
      invoiceStatus,
      paymentStatus: invoiceStatus === 'Sent' ? ((index + siteModifier) % 3 === 0 ? 'Unpaid' : 'Paid (Bank Transfer)') : 'Unpaid'
    };
  });
};

export default function App() {
  // === Local-First 系統狀態架構 ===
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSite, setSelectedSite] = useState('London (Chelsea)');
  const [privacyMode, setPrivacyMode] = useState(false);

  const [globalSettings, setGlobalSettings] = useState(() => {
    const saved = localStorage.getItem('nf_settings');
    return saved ? JSON.parse(saved) : {
      nurseryName: 'Top Nursery Group',
      baseRate: 8.50,
      fundingRate: 5.50,
      consumablesFee: 25.00
    };
  });

  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('nf_students');
    return saved ? JSON.parse(saved) : generateMockData(selectedSite, globalSettings);
  });
  
  const [staffData, setStaffData] = useState(() => {
    const saved = localStorage.getItem('nf_staff');
    return saved ? JSON.parse(saved) : {
      pool: 1,
      rooms: {
        baby: { id: 'baby', name: 'Baby Room (Under 2s)', desc: 'Statutory 1:3', children: 8, cap: 12, staff: 3, agencyStaff: 0, ratio: 3, cost: 110, color: 'rose' },
        toddler: { id: 'toddler', name: 'Toddler Room (2-3y)', desc: 'Statutory 1:4', children: 12, cap: 16, staff: 3, agencyStaff: 0, ratio: 4, cost: 110, color: 'amber' },
        preschool: { id: 'preschool', name: 'Pre-School (3-5y)', desc: 'Statutory 1:8', children: 22, cap: 24, staff: 2, agencyStaff: 0, ratio: 8, cost: 110, color: 'emerald' }
      }
    };
  }); 

  // === 資料持久化 ===
  useEffect(() => {
    localStorage.setItem('nf_settings', JSON.stringify(globalSettings));
    localStorage.setItem('nf_students', JSON.stringify(students));
    localStorage.setItem('nf_staff', JSON.stringify(staffData));
  }, [globalSettings, students, staffData]);

  const handleSaveSettings = (newSettings) => {
    setGlobalSettings(newSettings);
    const updatedStudents = students.map(s => {
      const privateFee = s.privateHours * newSettings.baseRate;
      const fundedClaim = s.fundedHours * newSettings.fundingRate;
      const totalParentFee = privateFee + s.consumables;
      return { ...s, rate: newSettings.baseRate, privateFee, fundedClaim, totalParentFee };
    });
    setStudents(updatedStudents);
    alert('Settings saved successfully! All financial forecasts have been updated.');
  };

  const [invoiceModalData, setInvoiceModalData] = useState(null);
  const [showAIExplain, setShowAIExplain] = useState(false); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChasing, setIsChasing] = useState(false); 
  const [preflightDone, setPreflightDone] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const formatMoney = (amount, decimals = 2) => {
    if (privacyMode) return '£***';
    return `£${amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  // === 儀表板即時計算 ===
  const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const pendingCount = students.filter(s => s.invoiceStatus === 'Pending').length;
  const unpaidCount = students.filter(s => s.paymentStatus === 'Unpaid' && s.invoiceStatus === 'Sent').length;
  
  const totalParentRev = students.reduce((acc, curr) => acc + curr.totalParentFee, 0);
  const totalFundedRev = students.reduce((acc, curr) => acc + curr.fundedClaim + curr.sendFunding, 0);
  const totalRev = totalParentRev + totalFundedRev;
  const unpaidAmount = students.filter(s => s.paymentStatus === 'Unpaid' && s.invoiceStatus === 'Sent').reduce((acc, curr) => acc + curr.totalParentFee, 0);
  const errorCount = students.filter(s => s.hasFundingError).length;

  const estGrossMargin = 28.5; 
  const occupancyRate = '86%';
  
  const currentBankBalance = 14200;
  const upcomingPayroll = totalRev * 0.62; 
  const liquidityShortfall = currentBankBalance < upcomingPayroll ? upcomingPayroll - currentBankBalance : 0;
  const daysToFunding = 12;

  // === USP: 補助極大化計算 ===
  const unclaimedEYPP = students.filter(s => s.eligibleForEYPP).length;
  const unclaimedDAF = students.filter(s => s.eligibleForDAF).length;
  const unclaimedFundingTotal = (unclaimedEYPP * 342) + (unclaimedDAF * 910); // 模擬每年可拿的政府補助

  // === 畫面渲染路由器 ===
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2 mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Overview</h3>
                <span className="text-sm text-slate-500 font-medium">Live 30-Day Forecast based on current register</span>
              </div>
              <div className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                <CheckCircle size={14} className="mr-1.5" /> Systems Synced
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><TrendingUp size={20} /></div>
                  <div className="text-right"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Gross Margin</p><p className="text-2xl font-black text-slate-900 mt-1">{privacyMode ? '***' : `${estGrossMargin}%`}</p></div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between"><span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">+2.1% vs Prev</span></div>
              </div>
              
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600"><PieChart size={20} /></div>
                  <div className="text-right"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Occupancy</p><p className="text-2xl font-black text-slate-900 mt-1">{occupancyRate}</p></div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between"><span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Target: 85%</span></div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><PoundSterling size={20} /></div>
                  <div className="text-right"><p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Income</p><p className="text-2xl font-black text-emerald-700 mt-1">{formatMoney(totalRev, 0)}</p></div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-medium"><span className="text-slate-500">Parents</span><span className="text-slate-700 font-bold">{formatMoney(totalParentRev, 0)}</span></div>
                  <div className="flex justify-between text-xs font-medium"><span className="text-slate-500">Government</span><span className="text-slate-700 font-bold">{formatMoney(totalFundedRev, 0)}</span></div>
                </div>
              </div>

              <div className="bg-rose-50 rounded-2xl p-5 border border-rose-200 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600"><AlertCircle size={20}/></div>
                  <div className="text-right"><p className="text-xs text-rose-700 font-bold uppercase tracking-wider">Unpaid Debt</p><p className="text-2xl font-black text-rose-700 mt-1">{formatMoney(unpaidAmount, 0)}</p></div>
                </div>
                <div className="mt-4 pt-3 border-t border-rose-200/50 flex items-center justify-between">
                  <span className="text-xs text-rose-700 font-bold">{unpaidCount} Overdue</span>
                  <button onClick={() => { setIsChasing(true); setTimeout(() => { alert('BACS Reminders sent safely to parents.'); setIsChasing(false);}, 1000); }} className="text-xs px-3 py-1.5 rounded-lg font-bold bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm">
                    {isChasing ? <RefreshCw size={12} className="animate-spin"/> : 'Chase All'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* 現金流雷達 */}
              <div className="bg-slate-900 p-6 md:p-8 rounded-3xl shadow-lg text-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center mb-6 text-slate-300"><Hourglass size={20} className="mr-2"/> <h4 className="font-bold text-lg">Cashflow Survival Radar</h4></div>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Bank Balance</p>
                      <p className="text-3xl md:text-4xl font-black text-white">{formatMoney(currentBankBalance, 0)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Upcoming Payroll</p>
                       <p className="text-xl font-bold text-amber-400">{formatMoney(upcomingPayroll, 0)}</p>
                    </div>
                  </div>
                </div>

                {liquidityShortfall > 0 ? (
                  <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-start">
                    <AlertTriangle size={18} className="text-rose-400 mr-3 shrink-0 mt-0.5"/>
                    <p className="text-sm text-rose-100 leading-relaxed">
                      <strong>Warning: {formatMoney(liquidityShortfall, 0)} shortfall</strong> expected before payroll. Local Authority funding ({formatMoney(totalFundedRev, 0)}) arrives in <strong className="text-white">{daysToFunding} days</strong>. Chase overdue debts via BACS.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-start">
                    <Check size={18} className="text-emerald-400 mr-3 shrink-0 mt-0.5"/>
                    <p className="text-sm text-emerald-100 leading-relaxed">
                      Cashflow is healthy. Your current balance covers the upcoming payroll safely. Funding arrives in {daysToFunding} days.
                    </p>
                  </div>
                )}
              </div>

              {/* 勞動成本監控 */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center mb-6 text-slate-700"><PieChart size={20} className="mr-2"/> <h4 className="font-bold text-lg">Income vs Labour Cost</h4></div>
                  <div className="space-y-6">
                     <div>
                       <div className="flex justify-between text-sm mb-2"><span className="text-emerald-700 font-bold">Expected Income</span><span className="font-bold text-slate-900">{formatMoney(totalRev, 0)}</span></div>
                       <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"><div className="bg-emerald-500 h-full rounded-full w-full"></div></div>
                     </div>
                     <div>
                       <div className="flex justify-between text-sm mb-2"><span className="text-amber-600 font-bold">Est. Labour Costs</span><span className="font-bold text-slate-900">{formatMoney(totalRev * 0.62, 0)}</span></div>
                       <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden relative">
                         <div className="bg-amber-400 h-full rounded-full transition-all duration-1000" style={{width: '62%'}}></div>
                         <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-rose-500" style={{left: '65%'}} title="Safe Target: 65%"></div>
                       </div>
                       <p className="text-xs text-slate-400 mt-2 font-medium">Safe benchmark: &lt; 65% of Income</p>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 mb-2">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices & Funding</h3>
                <span className="text-sm text-slate-500 font-medium">Manage parent bills and local authority claims</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between gap-3">
              <div className="relative w-full lg:w-96 h-12 shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder="Search child or TFC Ref..." className="w-full h-full pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                <button onClick={() => { setPreflightDone(true); }} className={`flex-1 lg:flex-none flex justify-center items-center px-6 h-12 rounded-xl font-bold border transition whitespace-nowrap ${preflightDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'}`}>
                  <ShieldAlert className="mr-2 text-amber-500" size={18} /> Check Claim Errors
                </button>
                <button onClick={() => { alert('Invoices Sent via Email safely.'); }} className="flex-1 lg:flex-none flex justify-center items-center px-6 h-12 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm whitespace-nowrap">
                  <Mail className="mr-2" size={18} /> Send Invoices
                </button>
              </div>
            </div>

            {preflightDone && errorCount > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start">
                <AlertTriangle className="text-amber-600 mr-3 shrink-0 mt-0.5" size={20}/>
                <div>
                  <h4 className="font-bold text-amber-900">Action Required: Claim Risks</h4>
                  <p className="text-sm text-amber-800 mt-1">Found <strong>{errorCount}</strong> children with missing National Insurance numbers. Fix these before submitting to prevent local authority clawbacks.</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-bold">Child Name</th>
                      <th className="px-6 py-4 font-bold text-center">Funding Plan</th>
                      <th className="px-6 py-4 font-bold text-center">Total Hrs</th>
                      <th className="px-6 py-4 font-bold text-right">Parent Pays</th>
                      <th className="px-6 py-4 font-bold text-center">Status</th>
                      <th className="px-6 py-4 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map(s => {
                      const isPaid = s.paymentStatus.includes('Paid');
                      const showWarningRow = preflightDone && s.hasFundingError;
                      return (
                        <tr key={s.id} className={`hover:bg-slate-50 transition ${showWarningRow ? 'bg-amber-50/40 border-l-4 border-amber-400' : 'border-l-4 border-transparent'}`}>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 flex items-center">
                              {s.name} 
                              {showWarningRow && <span className="ml-2 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-black uppercase">Fix NI</span>}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{s.tfcRef ? `TFC: ${s.tfcRef}` : 'Self-Pay'}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {s.fundedHours > 0 ? (
                               <span className={`px-2.5 py-1 rounded text-xs font-bold ${s.fundingType.includes('51w') ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                                  {s.fundingType} ({s.fundedHours}h)
                               </span>
                            ) : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700">{s.totalHours}h</td>
                          <td className="px-6 py-4 text-right font-black text-slate-900 text-base">{formatMoney(s.totalParentFee)}</td>
                          <td className="px-6 py-4 text-center">
                            {isPaid 
                              ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-emerald-600"><CheckCircle size={14} className="mr-1"/>Paid</span> 
                              : <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-rose-600"><AlertCircle size={14} className="mr-1"/>Unpaid</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => setInvoiceModalData(s)} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm">
                              <Receipt size={14} className="mr-1.5"/> Invoice
                            </button>
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
          <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Staff & Ratios</h3>
                <span className="text-sm text-slate-500 font-medium">Ensure statutory compliance and avoid overstaffing</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                 <button onClick={() => alert('AI Auto-Fix applied!')} className="flex items-center px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-sm">
                    <Wand2 size={16} className="mr-2"/> Auto-Fix Ratios
                 </button>
                 <div className={`flex items-center px-4 py-2.5 rounded-xl font-bold border-2 transition-all shadow-sm ${pool > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700 scale-105' : 'bg-white border-slate-200 text-slate-500'}`}>
                    <Users size={18} className="mr-2" /> Available Staff: <span className="text-xl ml-2 font-black">{pool}</span>
                 </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Object.entries(rooms).map(([roomId, room]) => {
                const totalStaffInRoom = room.staff + room.agencyStaff;
                const reqStaff = Math.ceil(room.children / room.ratio);
                const isCompliant = totalStaffInRoom >= reqStaff;
                const isOverstaffed = totalStaffInRoom > reqStaff;
                
                let statusBadge = null;
                if (totalStaffInRoom < reqStaff) {
                  statusBadge = <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded flex items-center animate-pulse"><AlertTriangle size={12} className="mr-1"/>Need {reqStaff - totalStaffInRoom} more</span>;
                } else if (isOverstaffed) {
                  statusBadge = <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">Overstaffed (+{totalStaffInRoom - reqStaff})</span>;
                } else {
                  statusBadge = <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded flex items-center"><UserCheck size={12} className="mr-1"/>Optimal</span>;
                }

                const roomRevenue = room.children * globalSettings.baseRate * 8; 
                const totalLabourCost = (room.staff * room.cost) + (room.agencyStaff * room.agencyCost);
                const profitMargin = (((roomRevenue - totalLabourCost) / roomRevenue) * 100).toFixed(1);
                const marginColor = profitMargin < 0 ? 'text-rose-600' : profitMargin < 15 ? 'text-amber-600' : 'text-emerald-600';

                return (
                  <div key={roomId} className={`bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col transition-all ${profitMargin < 0 ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-200'}`}>
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h4 className="font-bold text-slate-800">{room.name}</h4>
                      <span className="text-xs font-bold text-slate-500">{room.desc}</span>
                    </div>
                    <div className="p-5 space-y-6 flex-1 flex flex-col">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-medium">Children Attending</span>
                          <span className="font-bold text-slate-900 text-base">{room.children} / {room.cap}</span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm p-4 bg-slate-50 rounded-xl border border-slate-100 gap-3">
                          <span className="text-slate-600 font-bold flex flex-col">
                            Staff Assigned
                            {room.agencyStaff > 0 && <span className="text-[10px] text-rose-500 mt-0.5 flex items-center"><AlertTriangle size={10} className="mr-1"/> +{room.agencyStaff} Agency (£££)</span>}
                          </span>
                          <div className="flex items-center justify-between w-full sm:w-auto">
                            <div className="flex items-center space-x-2 bg-white p-1 rounded-lg shadow-sm border border-slate-200">
                              <button onClick={() => setStaffData(prev => { /* simplified for brevity in this block */ return prev; })} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md"><UserMinus size={18}/></button>
                              <span className="font-black text-lg text-slate-900 w-6 text-center">{totalStaffInRoom}</span>
                              <button onClick={() => setStaffData(prev => { return prev; })} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md"><UserPlus size={18}/></button>
                            </div>
                            {/* 變現機制: API 串接派遣機構 */}
                            {pool === 0 && !isCompliant && (
                              <button onClick={() => alert('Vacancy broadcasted to NurseryFinance Recruitment Network! We will notify you when a candidate accepts.')} className="ml-3 bg-indigo-100 text-indigo-700 p-2 rounded-lg hover:bg-indigo-200 transition" title="Broadcast Vacancy to Partners">
                                <ShieldAlert size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end">{statusBadge}</div>
                      </div>
                      
                      <div className="pt-5 border-t border-slate-100 mt-auto flex justify-between items-start">
                        <span className="text-slate-500 font-medium flex flex-col text-sm">
                          Est. Profit Margin
                          {profitMargin < 0 && <span className="text-[10px] text-rose-500 mt-1 font-bold">Losing money today!</span>}
                        </span>
                        <span className={`font-black text-2xl ${marginColor}`}>{privacyMode ? '***' : `${profitMargin}%`}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'maximiser':
        // === 全新殺手鐧 USP: Funding Maximiser ===
        return (
          <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px]">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Funding Maximiser</h3>
              <span className="text-sm text-slate-500 font-medium">Stop leaving money on the table. We cross-reference your register to find unclaimed government grants.</span>
            </div>

            {/* 找到的免費資金卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100 shadow-sm flex flex-col justify-between">
                 <div>
                   <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-2">Early Years Pupil Premium</p>
                   <div className="flex items-end gap-2">
                     <p className="text-3xl font-black text-indigo-900">{formatMoney(unclaimedEYPP * 342, 0)}</p>
                     <p className="text-sm font-bold text-indigo-700 pb-1">Unclaimed</p>
                   </div>
                 </div>
                 <p className="text-sm text-indigo-700 mt-4"><strong>{unclaimedEYPP} children</strong> identified as potentially eligible based on postcode data.</p>
               </div>

               <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
                 <div>
                   <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-2">Disability Access Fund</p>
                   <div className="flex items-end gap-2">
                     <p className="text-3xl font-black text-purple-900">{formatMoney(unclaimedDAF * 910, 0)}</p>
                     <p className="text-sm font-bold text-purple-700 pb-1">Unclaimed</p>
                   </div>
                 </div>
                 <p className="text-sm text-purple-700 mt-4"><strong>{unclaimedDAF} children</strong> with SEND status have not claimed their annual £910 DAF.</p>
               </div>

               <div className="bg-slate-900 p-6 rounded-3xl shadow-lg flex flex-col justify-between relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                 <div className="relative z-10">
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Total Free Money Found</p>
                   <p className="text-4xl font-black text-emerald-400">{formatMoney(unclaimedFundingTotal, 0)}</p>
                 </div>
                 <button onClick={() => alert('Local Authority forms generated for all eligible children.')} className="relative z-10 mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-sm transition">
                   Auto-Fill Claim Forms
                 </button>
               </div>
            </div>

            {/* 具體可申請名單 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center"><Gift size={18} className="mr-2 text-indigo-500"/> Eligible Children Radar</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-white border-b border-slate-100">
                    <tr className="text-slate-400 text-xs uppercase">
                      <th className="px-6 py-4 font-bold">Child Name</th>
                      <th className="px-6 py-4 font-bold">Identified Grant</th>
                      <th className="px-6 py-4 font-bold text-right">Potential Value</th>
                      <th className="px-6 py-4 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.filter(s => s.eligibleForEYPP || s.eligibleForDAF).map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                        <td className="px-6 py-4">
                          {s.eligibleForEYPP && <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold mr-2">EYPP</span>}
                          {s.eligibleForDAF && <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-md text-xs font-bold">DAF</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600">
                          {formatMoney((s.eligibleForEYPP ? 342 : 0) + (s.eligibleForDAF ? 910 : 0), 0)}
                        </td>
                        <td className="px-6 py-4 text-center">
                           <button onClick={() => alert('Parent consent form generated.')} className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 shadow-sm">Get Parent Consent</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Data Hub</h3>
              <span className="text-sm text-slate-500 font-medium">Import your registers locally. We don't steal your data.</span>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center border-dashed border-2">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud size={32} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Drag & Drop your CSV Register</h4>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">Export your child data from Famly or Blossom. Our local AI mapper will instantly format it for billing without sending data to any server.</p>
              <button onClick={() => alert('File parsed locally! Found 45 students.')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm">
                Select CSV File
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="text-emerald-500 mr-4" size={24}/>
                    <div><h5 className="font-bold text-slate-900">Local Storage</h5><p className="text-xs text-slate-500">Data secured in browser</p></div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">Active</span>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between hover:bg-rose-50 transition cursor-pointer" onClick={() => { localStorage.clear(); window.location.reload(); }}>
                  <div className="flex items-center">
                    <Trash2 className="text-rose-500 mr-4" size={24}/>
                    <div><h5 className="font-bold text-rose-900">Reset System</h5><p className="text-xs text-rose-600">Clear all data</p></div>
                  </div>
               </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h3>
              <span className="text-sm text-slate-500 font-medium">Configure your financial baseline. Changes update live across the dashboard.</span>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nursery Name</label>
                  <input type="text" value={globalSettings.nurseryName} onChange={(e) => setGlobalSettings({...globalSettings, nurseryName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Private Base Rate (£/hr)</label>
                    <input type="number" step="0.5" value={globalSettings.baseRate} onChange={(e) => setGlobalSettings({...globalSettings, baseRate: parseFloat(e.target.value)})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Local Authority Rate (£/hr)</label>
                    <input type="number" step="0.5" value={globalSettings.fundingRate} onChange={(e) => setGlobalSettings({...globalSettings, fundingRate: parseFloat(e.target.value)})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Mandatory Consumables Fee (£/day)</label>
                  <input type="number" step="1" value={globalSettings.consumablesFee} onChange={(e) => setGlobalSettings({...globalSettings, consumablesFee: parseFloat(e.target.value)})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  <p className="text-xs text-slate-500 mt-2">Added to invoices for parents using 15/30 free hours to cover meals and resources legally.</p>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button onClick={() => handleSaveSettings(globalSettings)} className="flex items-center bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-md">
                    <Save size={18} className="mr-2"/> Save Configuration
                  </button>
                </div>
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
        <aside className="w-[260px] bg-white border-r border-slate-200 shadow-sm z-20 hidden lg:flex flex-col relative shrink-0">
          <div className="p-6 pt-8 pb-4">
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-sm"><Sparkles size={20} className="text-white" /></div>
              <div>
                <h1 className="text-slate-900 font-extrabold text-lg leading-tight tracking-tight">NurseryFinance</h1>
              </div>
            </div>

            <nav className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block px-2">Core Workspace</label>
              <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'dashboard' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}><LayoutDashboard size={20} /><span>Dashboard</span></button>
              <button onClick={() => setActiveTab('billing')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'billing' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}><FileText size={20} /><span>Invoices & Funding</span></button>
              <button onClick={() => setActiveTab('optimisation')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'optimisation' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}><Users size={20} /><span>Staff & Ratios</span></button>
              
              {/* 全新殺手鐧: Funding Maximiser */}
              <button onClick={() => setActiveTab('maximiser')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'maximiser' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Gift size={20} className={activeTab === 'maximiser' ? 'text-indigo-600' : ''} /><span>Funding Maximiser</span>
              </button>
            </nav>

            <nav className="space-y-1.5 mt-8">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block px-2">System</label>
              <button onClick={() => setActiveTab('data')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'data' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}><HardDrive size={20} /><span>Data Hub</span></button>
              <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'settings' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}><SettingsIcon size={20} /><span>Settings</span></button>
            </nav>
          </div>
          <div className="mt-auto p-6 pb-8 border-t border-slate-100">
             <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-bold text-sm border border-slate-200">JD</div>
                <div className="flex flex-col"><span className="text-sm font-bold text-slate-900">Jane Doe</span><span className="text-[11px] text-slate-500 font-medium">Nursery Manager</span></div>
             </div>
          </div>
        </aside>

        {/* === 主內容區塊 === */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 md:px-10 py-4 shrink-0 z-30 sticky top-0">
            <div className="flex items-center space-x-2 lg:hidden">
               <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow-sm"><Sparkles size={16} className="text-white" /></div>
               <h1 className="text-slate-900 font-extrabold text-lg tracking-tight">NurseryFinance</h1>
            </div>
            
            <div className="hidden lg:flex items-center">
              <span className="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{globalSettings.nurseryName}</span>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setPrivacyMode(!privacyMode)} 
                className={`flex items-center text-sm font-bold transition px-4 py-2 rounded-full border shadow-sm ${privacyMode ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                title="Hide sensitive financial numbers"
              >
                {privacyMode ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
                {privacyMode ? 'Privacy On' : 'Privacy Mode'}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 w-full">
            <div className="max-w-[1400px] w-full">
              {renderContent()}
            </div>
          </div>

          {/* 行動裝置底部導覽列 */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 flex justify-around p-2 pb-safe z-50">
            <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}><LayoutDashboard size={22} className="mb-1" /><span className="text-[10px] font-bold">Dash</span></button>
            <button onClick={() => setActiveTab('billing')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'billing' ? 'text-blue-600' : 'text-slate-400'}`}><FileText size={22} className="mb-1" /><span className="text-[10px] font-bold">Billing</span></button>
            <button onClick={() => setActiveTab('optimisation')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'optimisation' ? 'text-blue-600' : 'text-slate-400'}`}><Users size={22} className="mb-1" /><span className="text-[10px] font-bold">Ratios</span></button>
            <button onClick={() => setActiveTab('maximiser')} className={`flex flex-col items-center p-2 min-w-[60px] ${activeTab === 'maximiser' ? 'text-indigo-600' : 'text-slate-400'}`}><Gift size={22} className="mb-1" /><span className="text-[10px] font-bold">Maximiser</span></button>
          </nav>
        </main>
      </div>

      {/* === 彈出層：智能發票 PDF Modal === */}
      {invoiceModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none relative overflow-hidden">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100 print:hidden relative z-10 bg-white">
              <h2 className="font-bold text-lg flex items-center text-slate-800"><Receipt className="mr-2 text-blue-600"/> Invoice Preview</h2>
              <button onClick={() => { setInvoiceModalData(null); setShowAIExplain(false); }} className="p-2 bg-slate-50 hover:bg-slate-200 rounded-full transition"><X size={20} className="text-slate-500"/></button>
            </div>

            <div className="p-8 md:p-10 overflow-y-auto print:overflow-visible relative z-10 bg-white">
              
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">INVOICE</h1>
                  <p className="text-slate-500 mt-2 font-medium">{globalSettings.nurseryName}</p>
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
                  
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left print:border-slate-300 print:bg-white">
                     <p className="text-xs text-slate-500 font-bold uppercase mb-2 print:text-slate-800">Payment Details (BACS)</p>
                     <p className="text-sm font-bold text-slate-800">{globalSettings.nurseryName} Ltd</p>
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
                  You paid for <strong>{invoiceModalData.privateHours} additional hours</strong>, plus a <strong>£{invoiceModalData.consumables.toFixed(2)} top-up</strong> which legally covers organic meals, snacks, and resources not funded by the state.
                </p>
              </div>
            )}

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-3xl print:hidden relative z-10">
              <button onClick={() => setShowAIExplain(!showAIExplain)} className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-200 transition active:scale-95">
                <Wand2 size={16} className="mr-2"/> Explain to Parent
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