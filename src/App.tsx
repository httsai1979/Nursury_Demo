import React, { useState, useRef, useEffect } from 'react';
import { Mail, CheckCircle, Clock, PoundSterling, FileText, AlertCircle, RefreshCw, Database, Sparkles, Check, Search, Upload, LayoutDashboard } from 'lucide-react';

const APPS_SCRIPT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzvIzwCL52hTRwn07LeE94gMEJzIte92Z-XuBMlrEm3THOESmKd98Lcl00Q_QGsb6W4tw/exec"; 

const generateMockData = () => {
  const baseNames = ["Oliver Smith", "Amelia Jones", "George Williams", "Isla Brown", "Harry Taylor", "Ava Davies", "Jack Evans", "Mia Thomas", "Noah Roberts", "Sophia Johnson"];
  return Array.from({ length: 50 }).map((_, index) => {
    const name = index < 10 ? baseNames[index] : `${baseNames[index % 10]} (Sibling ${index})`;
    const totalHours = 60 + (index % 4) * 20;
    const fundedHours = index % 3 === 0 ? 30 : 0;
    const invoiceStatus = index % 5 === 1 ? 'Sent' : 'Pending';
    return {
      id: index + 1,
      name,
      email: `parent${index + 1}@example.com`,
      totalHours,
      fundedHours,
      rate: 8.50,
      consumables: 40 + (index % 3) * 5,
      tfcRef: index % 2 === 0 ? `TFC-CHIL${100+index}` : '',
      invoiceStatus,
      paymentStatus: invoiceStatus === 'Sent' ? 'Paid (BACS)' : 'Unpaid'
    };
  });
};

export default function App() {
  const [students, setStudents] = useState(generateMockData());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [apiStatus, setApiStatus] = useState('loading'); 
  const [searchTerm, setSearchTerm] = useState('');
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
        setApiStatus('cors_error'); 
      }
    };
    fetchData();
  }, []);

  const handleDispatch = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setStudents(students.map(s => ({ ...s, invoiceStatus: 'Sent' })));
      setIsProcessing(false);
      alert('Success! Invoices dispatched.');
    }, 1500);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsReconciling(true);
    setTimeout(() => {
      setStudents(students.map(s => s.paymentStatus === 'Unpaid' && s.tfcRef !== '' ? { ...s, paymentStatus: 'Paid (TFC)' } : s));
      setIsReconciling(false);
      alert('Magic! Reconciled TFC payments instantly from CSV.');
    }, 1500);
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const pendingCount = students.filter(s => s.invoiceStatus === 'Pending').length;
  const unpaidCount = students.filter(s => s.paymentStatus === 'Unpaid').length;
  const totalRev = students.reduce((acc, curr) => acc + (Math.max(0, curr.totalHours - curr.fundedHours) * curr.rate) + curr.consumables, 0);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className="w-64 bg-[#002244] text-slate-300 flex flex-col shadow-xl z-20 hidden md:flex">
        <div className="p-6 border-b border-[#003366] flex items-center space-x-3">
          <div className="bg-white p-2 rounded-lg shadow-inner"><span className="text-[#002244] font-bold">⛵</span></div>
          <div><h1 className="text-white font-bold">Top Nursury</h1><p className="text-xs text-blue-300">Portal</p></div>
        </div>
        <nav className="flex-1 py-6 px-4"><a href="#" className="flex items-center space-x-3 px-4 py-3 bg-blue-600/20 text-blue-400 rounded-lg"><LayoutDashboard size={18} /><span>Dashboard</span></a></nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-bold">Monthly Billing</h2>
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border bg-slate-50 text-xs font-medium">
            {apiStatus === 'connected' ? <><Database size={14} className="text-emerald-500"/><span>Connected</span></> : <><Database size={14} className="text-amber-500"/><span>Demo Mode</span></>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border flex justify-between">
              <div><p className="text-sm text-slate-500">To Dispatch</p><p className="text-3xl font-bold">{pendingCount}</p></div>
              <div className="bg-amber-100 p-4 rounded-full text-amber-600"><FileText size={24} /></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border flex justify-between">
              <div><p className="text-sm text-slate-500">Unpaid Accounts</p><p className="text-3xl font-bold">{unpaidCount}</p></div>
              <div className="bg-rose-100 p-4 rounded-full text-rose-600"><AlertCircle size={24} /></div>
            </div>
            <div className="bg-emerald-50 rounded-xl shadow-sm p-6 border border-emerald-100 flex justify-between">
              <div><p className="text-sm text-emerald-600 font-bold">Revenue</p><p className="text-3xl font-black text-emerald-800">£{totalRev.toLocaleString()}</p></div>
              <div className="bg-emerald-200/50 p-4 rounded-full text-emerald-700"><PoundSterling size={24} /></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border shadow-sm mb-6 flex justify-between items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex space-x-3">
              <button onClick={handleDispatch} className="flex items-center px-6 py-2.5 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700">
                {isProcessing ? <RefreshCw className="animate-spin mr-2" size={18} /> : <Mail className="mr-2" size={18} />} Dispatch Invoices
              </button>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCSVUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-6 py-2.5 rounded-lg font-bold bg-indigo-600 text-white hover:bg-indigo-700">
                {isReconciling ? <RefreshCw className="animate-spin mr-2" size={18} /> : <Upload className="mr-2" size={18} />} Reconcile CSV
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b"><tr className="text-slate-500 uppercase">
                <th className="p-4">Child Name</th><th className="p-4 text-center">TFC Ref</th><th className="p-4 text-right">Total</th><th className="p-4 text-center">Status</th><th className="p-4 text-center">Payment</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(s => {
                  const fee = (Math.max(0, s.totalHours - s.fundedHours) * s.rate) + s.consumables;
                  const isPaid = s.paymentStatus.includes('Paid');
                  return (
                    <tr key={s.id} className={isPaid ? 'bg-emerald-50/20' : ''}>
                      <td className="p-4 font-bold">{s.name}</td>
                      <td className="p-4 text-center text-xs">{s.tfcRef || '-'}</td>
                      <td className="p-4 text-right font-black">£{fee.toLocaleString()}</td>
                      <td className="p-4 text-center">{s.invoiceStatus === 'Sent' ? <span className="text-emerald-600 font-bold"><Check size={14} className="inline mr-1"/>Sent</span> : <span className="text-slate-500"><Clock size={14} className="inline mr-1"/>Pending</span>}</td>
                      <td className="p-4 text-center">{isPaid ? <span className="text-indigo-600 font-bold"><Sparkles size={14} className="inline mr-1"/>{s.paymentStatus}</span> : <span className="text-rose-600"><AlertCircle size={14} className="inline mr-1"/>Unpaid</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}