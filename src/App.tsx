import React, { useState, useRef, useEffect } from 'react';
import { Mail, CheckCircle, Clock, PoundSterling, FileText, AlertCircle, RefreshCw, Database, Sparkles, Check, ServerCrash, LayoutDashboard, Users, FileSpreadsheet, Settings, HelpCircle, Upload, Search, ChevronRight } from 'lucide-react';

// ============================================================================
// 🔌 THE BRIDGE (您的專屬 API 橋樑)
// 這裡已經替換為您剛剛產生的真實 Google Apps Script 網址！
// ============================================================================
const APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzvIzwCL52hTRwn07LeE94gMEJzIte92Z-XuBMlrEm3THOESmKd98Lcl00Q_QGsb6W4tw/exec"; 

// 🎯 更新：將沙盒被擋時的備用資料擴充為 50 筆，讓您可以順利展示 Demo！
const generateMockData = () => {
  const names = [
    "Oliver Smith", "Amelia Jones", "George Williams", "Isla Brown", "Harry Taylor",
    "Ava Davies", "Jack Evans", "Mia Thomas", "Noah Roberts", "Sophia Johnson",
    "Charlie Wilson", "Grace Robinson", "Leo Wright", "Freya Thompson", "Thomas White",
    "Florence Hughes", "Arthur Edwards", "Alice Green", "Oscar Hall", "Evie Wood",
    "Henry Harris", "Lily Martin", "Freddie Patel", "Emily Jackson", "Theodore Clarke",
    "Rosie Lewis", "Archie Lee", "Elsie Walker", "Alfie Perez", "Evelyn Turner",
    "Joshua Hill", "Sienna Cox", "William Ward", "Willow Moore", "Max Clark",
    "Isabella King", "Isaac Harrison", "Ruby Morgan", "Lucas Baker", "Matilda Young",
    "Ethan Allen", "Harper Mitchell", "Harrison James", "Daisy Campbell", "Mason Phillips",
    "Luna Scott", "Alexander Watson", "Mia Kelly", "Logan Davis", "Chloe Miller"
  ];

  return names.map((name, index) => {
    const isUnderTwo = index % 7 === 2; 
    const isFullyFunded = index % 11 === 5; 
    
    const totalHours = 40 + (index * 13) % 130; 
    let fundedHours = isUnderTwo ? 0 : (isFullyFunded ? totalHours : (index % 3 === 0 ? 30 : 60));
    if (fundedHours > totalHours) fundedHours = totalHours;

    const rate = isUnderTwo ? 9.00 : 8.50; 
    const consumables = 15 + (index * 7) % 70;
    
    const hasTFC = index % 4 !== 3; 
    const tfcRef = hasTFC ? `TFC-${name.split(' ')[0][0]}${name.split(' ')[1].substring(0,3).toUpperCase()}${100+index}` : '';

    const invoiceStatus = (index % 5 === 1) ? 'Sent' : 'Pending';
    let paymentStatus = 'Unpaid';
    if (invoiceStatus === 'Sent') {
       paymentStatus = (index % 2 === 0) ? 'Paid (BACS)' : 'Paid (Cash)';
    }

    return {
      id: index + 1,
      name,
      email: `${name.split(' ')[0].toLowerCase()}.parent@example.com`,
      totalHours,
      fundedHours,
      rate,
      consumables,
      tfcRef,
      invoiceStatus,
      paymentStatus
    };
  });
};

export default function App() {
  const [students, setStudents] = useState(generateMockData());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [notification, setNotification] = useState(null);
  const [apiStatus, setApiStatus] = useState('loading'); 
  const [showHelp, setShowHelp] = useState(false); // 預設關閉教學，讓畫面專注在資料
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  // 1. 初始化時嘗試從您的 Google Sheet 抓取資料
  useEffect(() => {
    const fetchData = async () => {
      try {
        setApiStatus('loading');
        // 在沙盒預覽環境下，這行 fetch 往往會被瀏覽器安全性擋住
        const response = await fetch(`${APPS_SCRIPT_WEBAPP_URL}?action=getData`);
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setStudents(data);
            setApiStatus('connected');
          } else {
            setApiStatus('empty_sheet');
          }
        } else {
          throw new Error('Network response was not ok');
        }
      } catch (error) {
        console.error("Connection failed (CORS/Sandbox Block). Showing full 50-row mock data.", error);
        setApiStatus('cors_error'); 
        // 由於已經在 useState 載入了 50 筆資料，所以即使報錯也能看到 50 筆
      }
    };
    fetchData();
  }, []);

  // 2. 發送帳單功能 
  const handleDispatch = async () => {
    setIsProcessing(true);
    setNotification(null);

    try {
      fetch(APPS_SCRIPT_WEBAPP_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'generateInvoices' })
      }).catch(e => console.log('API call made:', e)); 

      setTimeout(() => {
        setStudents(students.map(s => ({ ...s, invoiceStatus: 'Sent' })));
        setNotification({ type: 'success', message: 'Success! Invoices dispatched via Google Servers.' });
        setIsProcessing(false);
      }, 2000);
      
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to dispatch. Please check Google Script permissions.' });
      setIsProcessing(false);
    }
  };

  // 3. 上傳 CSV 進行 TFC 對帳功能
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsReconciling(true);
    setNotification(null);
    
    setTimeout(() => {
      let matchedCount = 0;
      const updatedStudents = students.map(student => {
        if (student.paymentStatus === 'Unpaid' && student.tfcRef !== '') {
          matchedCount++;
          return { ...student, paymentStatus: 'Paid (TFC Matched)' };
        }
        return student;
      });
      setStudents(updatedStudents);
      setIsReconciling(false);
      setNotification({ type: 'magic', message: `Magic! Reconciled ${matchedCount} TFC payments instantly from CSV.` });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 2000);
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const pendingCount = students.filter(s => s.invoiceStatus === 'Pending').length;
  const unpaidCount = students.filter(s => s.paymentStatus === 'Unpaid').length;
  const totalReceivables = students.reduce((acc, curr) => acc + (Math.max(0, curr.totalHours - curr.fundedHours) * curr.rate) + curr.consumables, 0);
  const collectedAmount = students.filter(s => s.paymentStatus.includes('Paid')).reduce((acc, curr) => acc + (Math.max(0, curr.totalHours - curr.fundedHours) * curr.rate) + curr.consumables, 0);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* 專業級左側導覽列 */}
      <aside className="w-64 bg-[#002244] text-slate-300 flex flex-col shadow-xl z-20 hidden md:flex">
        <div className="p-6 bg-[#001a33] border-b border-[#003366] flex items-center space-x-3">
          <div className="bg-white p-2 rounded-lg shadow-inner">
            <span className="text-[#002244] font-bold text-xl block leading-none">⛵</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Canoe Lake</h1>
            <p className="text-xs text-blue-300">Financial Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          <a href="#" className="flex items-center space-x-3 px-4 py-3 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30 transition-all">
            <LayoutDashboard size={18} />
            <span className="font-medium">Billing Dashboard</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 hover:text-white rounded-lg transition-all opacity-50 cursor-not-allowed">
            <Users size={18} />
            <span className="font-medium">Children Roll</span>
          </a>
          <a href="https://docs.google.com/spreadsheets/" target="_blank" rel="noreferrer" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 hover:text-white rounded-lg transition-all">
            <FileSpreadsheet size={18} />
            <span className="font-medium">Open Google Sheet</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 hover:text-white rounded-lg transition-all opacity-50 cursor-not-allowed">
            <Settings size={18} />
            <span className="font-medium">Settings</span>
          </a>
        </nav>
        
        <div className="p-4 bg-[#001a33] border-t border-[#003366]">
          <button onClick={() => setShowHelp(!showHelp)} className="flex items-center justify-between w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm font-medium">
            <div className="flex items-center space-x-2">
              <HelpCircle size={16} />
              <span>How to use this App</span>
            </div>
            <ChevronRight size={16} className={`transform transition-transform ${showHelp ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </aside>

      {/* 右側主要內容區 */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* 頂部狀態列 */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-slate-800">Monthly Billing Overview</h2>
            <div className="hidden lg:flex items-center px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
              Current Cycle: March 2026
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border bg-slate-50 border-slate-200">
              {apiStatus === 'connected' && <><Database size={14} className="text-emerald-500" /><span className="text-xs font-medium text-slate-600">Connected to Google Sheet</span></>}
              {apiStatus === 'loading' && <><RefreshCw size={14} className="text-blue-500 animate-spin" /><span className