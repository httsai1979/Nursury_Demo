import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Mail, Clock, PoundSterling, FileText, AlertCircle, RefreshCw, 
  Database, Sparkles, Check, Search, Upload, LayoutDashboard, 
  TrendingUp, Users, PieChart, ShieldCheck, Wallet, Bell,
  ChevronDown, MapPin, BadgeInfo, Star, FileOutput, X, Printer, Receipt
} from 'lucide-react';

const APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzvIzwCL52hTRwn07LeE94gMEJzIte92Z-XuBMlrEm3THOESmKd98Lcl00Q_QGsb6W4tw/exec"; 

// 痛點 8: 動態產生不同校區的模擬數據 (100% Local Processing)
const generateMockData = (siteName) => {
  const baseNames = ["Oliver Smith", "Amelia Jones", "George Williams", "Isla Brown", "Harry Taylor", "Ava Davies", "Jack Evans", "Mia Thomas", "Noah Roberts", "Sophia Johnson"];
  const rooms = ["Baby Room (0-2y)", "Toddler Room (2-3y)", "Pre-School (3-5y)"];
  
  const siteModifier = siteName.includes('London') ? 0 : siteName.includes('Manchester') ? 1 : 2;
  const studentCount = 40 + (siteModifier * 10); 

  return Array.from({ length: studentCount }).map((_, index) => {
    const name = index < 10 ? baseNames[index] : `${baseNames[index % 10]} (Sibling ${index})`;
    const age = ((index + siteModifier) % 4) + 1; 
    const room = age < 2 ? rooms[0] : age < 3 ? rooms[1] : rooms[2];
    
    const totalHours = 60 + ((index + siteModifier) % 4) * 20;
    const fundedHours = age >= 3 ? (index % 2 === 0 ? 30 : 15) : 0; 
    const privateHours = Math.max(0, totalHours - fundedHours);
    
    const rate = siteModifier === 0 ? 9.50 : 8.50; 
    const consumables = 40 + (index % 3) * 5; 
    const privateFee = privateHours * rate;
    const fundedClaim = fundedHours * (siteModifier === 0 ? 6.00 : 5.50); 
    
    const isSEND = (index + siteModifier) % 10 === 0; 
    const sendFunding = isSEND ? 150 : 0; 

    const invoiceStatus = (index + siteModifier) % 5 === 1 ? 'Sent' : 'Pending';
    
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
      tfcRef: index % 2 === 0 ? `TFC-CHIL${100+index+siteModifier}` : '',
      invoiceStatus,
      paymentStatus: invoiceStatus === 'Sent' ? ((index + siteModifier) % 3 === 0 ? 'Unpaid' : 'Paid (BACS)') : 'Unpaid'
    };
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSite, setSelectedSite] = useState('London (Chelsea)');
  const [students, setStudents] = useState(() => generateMockData(selectedSite));
  
  // 階段二新增：發票 Modal 狀態
  const [invoiceModalData, setInvoiceModalData] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isChasing, setIsChasing] = useState(false);
  const [apiStatus, setApiStatus] = useState('loading'); 
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setApiStatus('loading');
    const timer = setTimeout(() => {
      setStudents(generateMockData(selectedSite));
      setApiStatus('demo_mode');
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedSite]);

  const handleDispatch = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setStudents(students.map(s => ({ ...s, invoiceStatus: 'Sent' })));
      setIsProcessing(false);
      alert('成功！已向家長發送智慧帳單。 (Smart Invoices dispatched)');
    }, 1500);
  };

  const handleCSVUpload = (e) => {
    if (!e.target.files?.[0]) return;
    setIsReconciling(true);
    setTimeout(() => {
      setStudents(students.map(s => s.paymentStatus === 'Unpaid' && s.tfcRef !== '' ? { ...s, paymentStatus: 'Paid (TFC Auto)' } : s));
      setIsReconciling(false);
      alert('對帳完成！已自動匹配 TFC 付款紀錄。 (TFC payments matched automatically)');
      if(fileInputRef.current) fileInputRef.current.value = '';
    }, 1500);
  };

  const handleChaseDebt = () => {
    setIsChasing(true);
    setTimeout(() => {
      alert(`已自動向 ${unpaidCount} 位家長發送溫和的繳款提醒郵件與簡訊！`);
      setIsChasing(false);
    }, 1000);
  };

  const handleExportLog = () => {
    const headers = ["Child ID", "Name", "Age", "Room", "SEND Status", "Total Hours", "Funded Hours", "Private Hours", "Consumables Fee", "Total Parent Fee (£)", "TFC Reference", "Payment Status"];
    const csvRows = students.map(s => [
      s.id, `"${s.name}"`, s.age, `"${s.room}"`, s.isSEND ? "Yes" : "No", s.totalHours, s.fundedHours,
      s.privateHours, s.consumables, s.totalParentFee, s.tfcRef || "N/A", `"${s.paymentStatus}"`
    ].join(","));

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Audit_Trail_${selectedSite.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 100% 免費的本地端 PDF 列印觸發器
  const handlePrintInvoice = () => {
    window.print();
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const pendingCount = students.filter(s => s.invoiceStatus === 'Pending').length;
  const unpaidCount = students.filter(s => s.paymentStatus === 'Unpaid' && s.invoiceStatus === 'Sent').length;
  
  const totalParentRev = students.reduce((acc, curr) => acc + curr.totalParentFee, 0);
  const totalFundedRev = students.reduce((acc, curr) => acc + curr.fundedClaim + curr.sendFunding, 0);
  const totalRev = totalParentRev + totalFundedRev;
  const unpaidAmount = students.filter(s => s.paymentStatus === 'Unpaid' && s.invoiceStatus === 'Sent').reduce((acc, curr) => acc + curr.totalParentFee, 0);

  const estGrossMargin = selectedSite.includes('London') ? '24.5%' : selectedSite.includes('Manchester') ? '28.1%' : '21.0%';
  const occupancyRate = selectedSite.includes('London') ? '82%' : selectedSite.includes('Manchester') ? '94%' : '76%';

  const renderContent = () => {
    if (apiStatus === 'loading') {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
          <span className="ml-3 text-slate-500 font-medium">Syncing {selectedSite} data...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 pb-24 md:pb-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2 mb-2">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">CFO Overview</h3>
                <span className="text-sm text-slate-500 font-medium">30-Day Forecast & Health Metrics for {selectedSite}</span>
              </div>
              <div className="flex items-center text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm w-fit">
                <Clock size={14} className="mr-1.5" /> Last updated: Just now
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><TrendingUp size={24} strokeWidth={2.5} /></div>
                  <div className="text-right"><p className="text-sm text-slate-500 font-medium">Est. Gross Margin</p><p className="text-3xl font-bold text-slate-900 mt-1">{estGrossMargin}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">+2.1% vs Prev</span>
                  <span className="text-xs text-slate-400">Healthy</span>
                </div>
              </div>
              
              <div className="bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between transition-transform hover:-translate-y-1">
                <div className="flex justify-between items-start">
                  <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><PieChart size={24} strokeWidth={2.5} /></div>
                  <div className="text-right"><p className="text-sm text-slate-500 font-medium">Occupancy</p><p className="text-3xl font-bold text-slate-900 mt-1">{occupancyRate}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-md">Target: 85%</span>
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

              <div className="bg-rose-50/50 rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(225,29,72,0.1)] border border-rose-100 flex flex-col justify-between relative overflow-hidden transition-transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="bg-rose-100 p-3 rounded-2xl text-rose-600"><AlertCircle size={24} strokeWidth={2.5} /></div>
                  <div className="text-right"><p className="text-sm text-rose-700/80 font-medium">Cashflow at Risk</p><p className="text-3xl font-bold text-rose-700 mt-1">£{unpaidAmount.toLocaleString(undefined, {maximumFractionDigits:0})}</p></div>
                </div>
                <div className="mt-4 pt-4 border-t border-rose-100/50 flex items-center justify-between relative z-10">
                  <span className="text-xs text-rose-700 font-bold">{unpaidCount} Overdue Accounts</span>
                  <button 
                    onClick={handleChaseDebt}
                    disabled={unpaidCount === 0 || isChasing}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition shadow-sm flex items-center
                      ${unpaidCount === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
                  >
                    {isChasing ? <RefreshCw size={12} className="animate-spin mr-1"/> : null}
                    Chase
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
               <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
                  <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center"><PieChart className="mr-2 text-slate-400" size={20}/> Income vs Labour Cost ({selectedSite})</h4>
                  <div className="space-y-6">
                     <div>
                       <div className="flex justify-between text-sm mb-2"><span className="text-emerald-700 font-bold">Total Expected Income</span><span className="font-bold text-slate-900">£{totalRev.toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                       <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden"><div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{width: '100%'}}></div></div>
                     </div>
                     <div>
                       <div className="flex justify-between text-sm mb-2"><span className="text-amber-600 font-bold">Est. Labour Costs (Wages/NI/Pension)</span><span className="font-bold text-slate-900">£{(totalRev * 0.62).toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                       <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden relative">
                         <div className="bg-amber-400 h-full rounded-full transition-all duration-1000" style={{width: '62%'}}></div>
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
                      <span><strong className="text-white block mb-1">Funding Shift Ahead:</strong> 3 children in {selectedSite} are turning 3 next month. Forecast updated.</span>
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
                <span className="text-sm text-slate-500 font-medium">Live Ofsted Ratio vs Room Profitability ({selectedSite})</span>
              </div>
              <button className="flex items-center text-sm bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition w-full md:w-auto justify-center">
                Date: Today <ChevronDown size={16} className="ml-2 text-slate-400"/>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center transition shadow-md active:scale-[0.98]">
                      <Bell size={18} className="mr-2"/> Push Ad-hoc (4 slots)
                    </button>
                  </div>
                </div>
              </div>

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
                <span className="text-sm text-slate-500 font-medium">Hybrid Billing & Reconciliation for {selectedSite}</span>
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
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-wrap gap-4">
                <h3 className="font-bold text-slate-800 flex items-center text-sm uppercase tracking-wider"><ShieldCheck size={18} className="mr-2 text-blue-500"/> Invoice Ledger</h3>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded-md hidden md:flex"><BadgeInfo size={14} className="mr-1"/> Audit Trail Active</span>
                  <button onClick={handleExportLog} className="text-xs font-bold text-white bg-slate-800 px-4 py-2 rounded-lg flex items-center hover:bg-slate-700 transition active:scale-[0.98] shadow-sm">
                    <FileOutput size={14} className="mr-2" /> Export CSV Log
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-slate-100"><tr className="text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Child Details</th>
                    <th className="px-6 py-4 font-bold text-center">Funded (Hrs)</th>
                    <th className="px-6 py-4 font-bold text-center">Private (Hrs)</th>
                    <th className="px-6 py-4 font-bold text-center">Top-ups & Meals</th>
                    <th className="px-6 py-4 font-bold text-right">Parent Total</th>
                    <th className="px-6 py-4 font-bold text-center">Status</th>
                    {/* 階段二：新增 Action 欄位 */}
                    <th className="px-6 py-4 font-bold text-center">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(s => {
                      const isPaid = s.paymentStatus.includes('Paid');
                      return (
                        <tr key={s.id} className={`hover:bg-slate-50/80 transition group ${isPaid ? 'bg-emerald-50/20' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 flex items-center">
                              {s.name} 
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
                            {isPaid 
                              ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"><Sparkles size={14} className="mr-1"/>{s.paymentStatus}</span> 
                              : <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100"><AlertCircle size={14} className="mr-1"/>Unpaid</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {/* 階段二：開啟 PDF 發票預覽的按鈕 */}
                            <button onClick={() => setInvoiceModalData(s)} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm active:scale-95">
                              <Receipt size={14} className="mr-1.5"/> View PDF
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
    }
  };

  return (
    <>
      {/* 主要 App 介面 - 當列印時隱藏 (print:hidden) */}
      <div className={`flex h-screen bg-[#F5F5F7] font-sans antialiased text-slate-900 overflow-hidden ${invoiceModalData ? 'print:hidden' : ''}`}>
        
        {/* 桌面版側邊欄 */}
        <aside className="w-64 bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 hidden md:flex flex-col relative">
          <div className="p-6 pt-8 pb-4">
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-sm shadow-blue-500/30">
                <Sparkles size={20} className="text-white" />
              </div>
              <div><h1 className="text-slate-900 font-extrabold text-lg leading-tight tracking-tight">NurseryFinance</h1><p className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">The CFO Brain</p></div>
            </div>
            
            <div className="mb-6 relative">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block px-1">Location</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
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
          <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-5 py-4 shrink-0 z-30 sticky top-0">
            <div className="flex items-center space-x-2">
               <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg shadow-sm"><Sparkles size={16} className="text-white" /></div>
               <h1 className="text-slate-900 font-extrabold text-lg tracking-tight">NurseryFinance</h1>
            </div>
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">JD</div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </div>

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

      {/* 階段二：Smart Invoice PDF Modal (完美解決痛點 1 & 7) */}
      {/* 運用 Tailwind 的 print:* 類別，實現 100% 免費且乾淨的本地端 PDF 產出 */}
      {invoiceModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
            
            {/* Modal 頂部控制列 - 列印時隱藏 */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 print:hidden">
              <h2 className="font-bold text-lg flex items-center text-slate-800"><Receipt className="mr-2 text-blue-600"/> Smart Invoice Preview</h2>
              <button onClick={() => setInvoiceModalData(null)} className="p-2 bg-slate-50 hover:bg-slate-200 rounded-full transition"><X size={20} className="text-slate-500"/></button>
            </div>

            {/* 可列印的發票內容區域 (Printable Area) */}
            <div className="p-8 md:p-10 overflow-y-auto print:overflow-visible">
              
              {/* 發票標頭 */}
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">INVOICE</h1>
                  <p className="text-slate-500 mt-2 font-medium">{selectedSite} Nursery</p>
                  <p className="text-slate-400 text-sm">123 Early Years Road, UK</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Invoice No.</p>
                  <p className="text-xl font-bold text-slate-800">INV-2026-{(invoiceModalData.id).toString().padStart(4, '0')}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-4 mb-1">Date</p>
                  <p className="text-sm font-medium text-slate-800">{new Date().toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              {/* 帳單對象資訊 */}
              <div className="grid grid-cols-2 gap-8 mb-10 p-6 bg-slate-50 rounded-2xl print:border print:border-slate-100 print:bg-transparent">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Billed To (Parent)</p>
                  <p className="font-bold text-slate-800">{invoiceModalData.email.split('@')[0].toUpperCase()} Family</p>
                  <p className="text-sm text-slate-500 mt-1">{invoiceModalData.email}</p>
                  {invoiceModalData.tfcRef && (
                    <p className="text-xs mt-3 font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">TFC Ref: {invoiceModalData.tfcRef}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Child Details</p>
                  <p className="font-bold text-slate-800">{invoiceModalData.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{invoiceModalData.age} Years Old • {invoiceModalData.room}</p>
                </div>
              </div>

              {/* 費用明細表格 (完美拆解 Government Funding 與 Private Fees) */}
              <div className="mb-10">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-400 uppercase tracking-wider text-xs">
                      <th className="pb-3 font-bold">Description (Service Breakdown)</th>
                      <th className="pb-3 font-bold text-center">Hours</th>
                      <th className="pb-3 font-bold text-right">Rate</th>
                      <th className="pb-3 font-bold text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* 政府補助時數 */}
                    <tr className="text-slate-500">
                      <td className="py-4">
                        <span className="font-bold text-slate-700">Government Funded Hours</span>
                        <p className="text-xs mt-1">Early Years Free Entitlement (Local Authority)</p>
                      </td>
                      <td className="py-4 text-center">{invoiceModalData.fundedHours}</td>
                      <td className="py-4 text-right">-</td>
                      <td className="py-4 text-right font-bold text-slate-800">£0.00</td>
                    </tr>
                    {/* 家長自費時數 */}
                    <tr className="text-slate-500">
                      <td className="py-4">
                        <span className="font-bold text-slate-700">Private Childcare Hours</span>
                        <p className="text-xs mt-1">Additional hours outside of funding</p>
                      </td>
                      <td className="py-4 text-center">{invoiceModalData.privateHours}</td>
                      <td className="py-4 text-right">£{invoiceModalData.rate.toFixed(2)}</td>
                      <td className="py-4 text-right font-bold text-slate-800">£{invoiceModalData.privateFee.toFixed(2)}</td>
                    </tr>
                    {/* 耗材與餐費附加 */}
                    <tr className="text-slate-500">
                      <td className="py-4">
                        <span className="font-bold text-slate-700">Consumables & Meals Top-up</span>
                        <p className="text-xs mt-1">Mandatory contribution for meals, snacks & supplies</p>
                      </td>
                      <td className="py-4 text-center">-</td>
                      <td className="py-4 text-right">-</td>
                      <td className="py-4 text-right font-bold text-slate-800">£{invoiceModalData.consumables.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 總結算 */}
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
                  
                  {/* 付款狀態章 */}
                  {invoiceModalData.paymentStatus.includes('Paid') ? (
                     <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-center font-bold flex items-center justify-center">
                        <Sparkles size={16} className="mr-2"/> Payment Received
                     </div>
                  ) : (
                     <div className="mt-4 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-center font-bold flex items-center justify-center">
                        <AlertCircle size={16} className="mr-2"/> Payment Overdue
                     </div>
                  )}
                </div>
              </div>
              
              <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400 print:mt-10">
                <p>NurseryFinance Invoice Engine • Registered in England & Wales</p>
                <p className="mt-1">Please note: Government funding does not cover the cost of meals or consumables.</p>
              </div>

            </div>

            {/* Modal 底部控制列 - 列印時隱藏 */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl print:hidden">
              <button onClick={() => setInvoiceModalData(null)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition active:scale-95">Cancel</button>
              <button onClick={handlePrintInvoice} className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition flex items-center active:scale-95">
                <Printer size={18} className="mr-2"/> Save as PDF / Print
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}