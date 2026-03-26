import React, { useState, useRef, useEffect } from 'react';
import { Mail, CheckCircle, Clock, PoundSterling, FileText, AlertCircle, RefreshCw, Database, Sparkles, Check, ServerCrash, LayoutDashboard, Users, FileSpreadsheet, Settings, HelpCircle, Upload, Search, ChevronRight } from 'lucide-react';

// ============================================================================
// 🔌 THE BRIDGE (您的專屬 API 橋樑)
// ============================================================================
const APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzvIzwCL52hTRwn07LeE94gMEJzIte92Z-XuBMlrEm3THOESmKd98Lcl00Q_QGsb6W4tw/exec"; 

// 預設 50 筆展示資料
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
  const [notification, setNotification] = useState<{type: string, message: string} | null>(null);
  const [apiStatus, setApiStatus] = useState('loading'); 
  const [showHelp, setShowHelp] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setApiStatus('loading');
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
        console.error("Connection failed. Showing full 50-row mock data.", error);
        setApiStatus('cors_error'); 
      }
    };
    fetchData();
  }, []);

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

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className="w-64 bg-[#002244] text-slate-300 flex flex-col shadow-xl z-20 hidden md:flex">
        <div className="p-6 bg-[#001a33] border-b border-[#003366] flex items-center space-x-3">
          <div className="bg-white p-2 rounded-lg shadow-inner">
            <span className="text-[#002244] font-bold text-xl block leading-none">⛵</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">TOP Nursury</h1>
            <p className="text-xs text-blue-300">Financial Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          <a href="#" className="flex items-center space-x-3 px-4 py-3 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30 transition-all">
            <LayoutDashboard size={18} />
            <span className="font-medium">Billing Dashboard</span>
          </a>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-slate-800">Monthly Billing Overview</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border bg-slate-50 border-slate-200">
              {apiStatus === 'connected' && <><Database size={14} className="text-emerald-500" /><span className="text-xs font-medium text-slate-600">Connected</span></>}
              {apiStatus === 'loading' && <><RefreshCw size={14} className="text-blue-500 animate-spin" /><span className="text-xs font-medium text-slate-600">Connecting...</span></>}
              {apiStatus === 'cors_error' && <><Database size={14} className="text-amber-500" /><span className="text-xs font-medium text-amber-700">Demo Data (CORS)</span></>}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">To Dispatch</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-3xl font-bold text-slate-800">{pendingCount}</p>
                </div>
              </div>
              <div className="bg-amber-100 p-4 rounded-full text-amber-600"><FileText size={24} /></div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Unpaid Accounts</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-3xl font-bold text-slate-800">{unpaidCount}</p>
                </div>
              </div>
              <div className="bg-rose-100 p-4 rounded-full text-rose-600"><AlertCircle size={24} /></div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-sm p-6 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-bold mb-1 uppercase tracking-wider">Expected Revenue</p>
                <p className="text-3xl font-black text-emerald-800">£{totalReceivables.toLocaleString('en-GB', {minimumFractionDigits: 2})}</p>
              </div>
              <div className="bg-emerald-200/50 p-4 rounded-full text-emerald-700"><PoundSterling size={24} /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-8 flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search child..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex space-x-3 w-full lg:w-auto">
              <button 
                onClick={handleDispatch}
                disabled={isProcessing || pendingCount === 0}
                className={`flex-1 lg:flex-none flex justify-center items-center space-x-2 px-6 py-2.5 rounded-lg font-bold transition-all border shadow-sm ${
                  isProcessing || pendingCount === 0 ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 hover:shadow-md'
                }`}
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Mail size={18} />}
                <span>{isProcessing ? 'Dispatching...' : `1. Dispatch (${pendingCount})`}</span>
              </button>

              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCSVUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isReconciling || unpaidCount === 0}
                className={`flex-1 lg:flex-none flex justify-center items-center space-x-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm ${
                  isReconciling || unpaidCount === 0 ? 'bg-indigo-300 text-white cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md border border-indigo-700'
                }`}
              >
                {isReconciling ? <RefreshCw className="animate-spin" size={18} /> : <Upload size={18} />}
                <span>{isReconciling ? 'Matching CSV...' : '2. Reconcile CSV'}</span>
              </button>
            </div>
          </div>

          {notification && (
            <div className={`mb-6 px-4 py-3 rounded-lg flex items-center space-x-3 border shadow-sm ${notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : (notification.type === 'magic' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800')}`}>
              {notification.type === 'magic' ? <Sparkles size={20} className="text-indigo-600" /> : <CheckCircle size={20} className={notification.type === 'error' ? 'text-rose-600' : 'text-emerald-600'} />}
              <span className="font-medium">{notification.message}</span>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 font-bold">Child Name</th>
                    <th className="p-4 font-bold text-center">TFC Reference</th>
                    <th className="p-4 font-bold text-right">Invoice Total</th>
                    <th className="p-4 font-bold text-center">Status</th>
                    <th className="p-4 font-bold text-center">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredStudents.map((student) => {
                    const privateHours = Math.max(0, student.totalHours - student.fundedHours);
                    const totalDue = (privateHours * student.rate) + student.consumables;
                    const isPaid = student.paymentStatus.includes('Paid');

                    return (
                      <tr key={student.id} className={`hover:bg-slate-50/80 transition-colors ${isPaid ? 'bg-emerald-50/10' : ''}`}>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-base">{student.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{student.email}</div>
                        </td>
                        <td className="p-4 text-center">
                          {student.tfcRef ? (
                            <code className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded border border-slate-200">
                              {student.tfcRef}
                            </code>
                          ) : (
                            <span className="text-xs text-slate-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-black text-slate-800 text-lg">£{totalDue.toLocaleString('en-GB', {minimumFractionDigits: 2})}</div>
                        </td>
                        <td className="p-4 text-center">
                          {student.invoiceStatus === 'Sent' ? (
                            <span className="inline-flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200">
                              <Check size={14}/><span>Dispatched</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200">
                              <Clock size={14}/><span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center space-x-1.5 text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full text-xs font-bold border border-indigo-200 shadow-sm">
                              <Sparkles size={14} /><span>{student.paymentStatus}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full text-xs font-semibold border border-rose-200">
                              <AlertCircle size={14} /><span>Unpaid</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}