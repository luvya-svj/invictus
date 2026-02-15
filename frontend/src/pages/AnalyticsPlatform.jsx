import React, { useState, useEffect, cloneElement } from 'react';
import {
    Search, Upload, FileSpreadsheet, BarChart3, TrendingUp, Database,
    Layers, ArrowLeft, Loader, LayoutDashboard, Trash2, PieChart as PieIcon,
    HelpCircle, X, Trash, RefreshCw, AreaChart as AreaChartIcon,
    ChevronRight, Info, AlertCircle, Sparkles, Map, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';

const AnalyticsPlatform = () => {
    const { showToast } = useToast();
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [sheets, setSheets] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeView, setActiveView] = useState('charts');
    const [analytics, setAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await api.get('/excel/files');
            setFiles(res.data);
            if (res.data.length > 0 && !selectedFile) {
                handleFileSelect(res.data[0]);
            }
        } catch (err) {
            console.error('Error fetching files:', err);
        }
    };

    const handleFileSelect = async (file) => {
        setSelectedFile(file);
        setSelectedSheet(null);
        setRows([]);
        setAnalytics(null);
        setLoading(true);
        try {
            const res = await api.get(`/excel/files/${file.id}/sheets`);
            setSheets(res.data);
            if (res.data.length > 0) {
                handleSheetSelect(res.data[0]);
            }
        } catch (err) {
            console.error('Error fetching sheets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSheetSelect = async (sheet) => {
        setSelectedSheet(sheet);
        setLoading(true);
        setLoadingAnalytics(true);

        try {
            const [rowsRes, analyticsRes] = await Promise.all([
                api.get(`/excel/sheets/${sheet.id}/rows?limit=100&offset=0`),
                api.get(`/excel/sheets/${sheet.id}/analytics`)
            ]);

            setRows(rowsRes.data.rows);
            setTotalRows(rowsRes.data.total);
            setAnalytics(analyticsRes.data);
        } catch (err) {
            console.error('Error fetching sheet data:', err);
        } finally {
            setLoading(false);
            setLoadingAnalytics(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/excel/upload', formData);
            showToast(`Ingested ${res.data.sheetsProcessed} sheets successfully`, 'success');
            fetchFiles();
        } catch (err) {
            console.error(err);
            showToast('Ingestion pipeline failure', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteFile = async (e, fileId) => {
        e.stopPropagation();
        if (!window.confirm('Wipe this dataset from memory? This is irreversible.')) return;
        try {
            await api.delete(`/excel/files/${fileId}`);
            showToast('Dataset purged successfully', 'success');
            fetchFiles();
            if (selectedFile?.id === fileId) {
                setSelectedFile(null);
                setSheets([]);
                setSelectedSheet(null);
                setRows([]);
                setAnalytics(null);
            }
        } catch (err) {
            showToast('Purge operation failed', 'error');
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('ARE YOU SURE? This will permanently wipe all uploaded datasets.')) return;
        try {
            await api.delete('/excel/files');
            showToast('Mainframe cache cleared', 'success');
            setFiles([]);
            setSelectedFile(null);
            setSheets([]);
            setSelectedSheet(null);
            setRows([]);
            setAnalytics(null);
        } catch (err) {
            showToast('Wipe operation failed', 'error');
        }
    };

    const filteredRows = rows.filter(row => {
        if (!searchTerm) return true;
        const dataStr = JSON.stringify(row.data).toLowerCase();
        return dataStr.includes(searchTerm.toLowerCase());
    });

    const getColumns = () => {
        if (!selectedSheet) return [];
        if (selectedSheet.column_headers) {
            return Object.values(selectedSheet.column_headers).filter(h => h);
        }
        if (rows.length > 0) {
            return Object.keys(rows[0].data);
        }
        return [];
    };

    const columns = getColumns();

    // AI Assistant Logic (Simulated Intelligence)
    const getInsights = () => {
        if (!analytics) return [];
        const insights = [];
        if (analytics.kpis.dataCoverage < 95) {
            insights.push({ type: 'warning', text: `Data quality alert: ${100 - analytics.kpis.dataCoverage}% missing fields detected.` });
        }
        if (analytics.kpis.numericColumns > 0) {
            insights.push({ type: 'success', text: `Strong correlation identified across ${analytics.kpis.numericColumns} key performance indicators.` });
        }
        if (analytics.totalRows > 500) {
            insights.push({ type: 'info', text: 'Enterprise-scale dataset detected. Applying vector-optimized pattern matching.' });
        }
        return insights;
    };

    const GeminiAI = () => (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-96 bg-black border-l border-white/10 z-[100] p-10 shadow-[-50px_0_100px_rgba(0,0,0,0.5)] flex flex-col"
        >
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter uppercase">Gemini</h2>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Gemini Pulse Active</span>
                    </div>
                </div>
                <button onClick={() => setIsAssistantOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Real-time Insights</div>
                    {getInsights().map((insight, idx) => (
                        <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2">
                                {insight.type === 'warning' ? <AlertCircle size={14} className="text-amber-500" /> : <Info size={14} className="text-blue-500" />}
                                <span className={`text-[10px] font-black uppercase tracking-widest ${insight.type === 'warning' ? 'text-amber-500' : 'text-slate-400'}`}>
                                    {insight.type.toUpperCase()}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-slate-300 leading-relaxed">{insight.text}</p>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-white text-black rounded-2xl space-y-4 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <h3 className="font-black tracking-tight text-lg">Suggestive Actions</h3>
                    <p className="text-xs font-medium opacity-70">Based on your current {selectedSheet?.sheet_name || 'context'}, I recommend exploring the categorical distribution.</p>
                    <button className="w-full py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all">
                        Execute Pivot Analysis
                    </button>
                </div>
            </div>

            <div className="pt-8 border-t border-white/10">
                <div className="flex items-center gap-4 text-slate-600">
                    <Activity size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Latency: 14ms</span>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-black text-white flex selection:bg-white selection:text-black overflow-hidden">
            <Sidebar />

            <AnimatePresence>
                {isAssistantOpen && <GeminiAI />}
            </AnimatePresence>

            <main className="flex-1 ml-20 p-12 transition-all duration-300 overflow-y-auto h-screen relative">
                <div className="max-w-7xl mx-auto space-y-12">

                    {/* Navigation Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${isFileMenuOpen ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/30'}`}
                            >
                                <Database size={24} />
                            </button>
                            <div>
                                <h1 className="text-6xl font-black tracking-tighter mb-1 italic">Electrolyte Intelligence</h1>
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-600 font-bold uppercase text-[10px] tracking-[0.3em]">Quantum Data Pipeline</span>
                                    <div className="h-px w-10 bg-white/10" />
                                    <span className="text-emerald-500 font-black text-[10px] tracking-[0.3em] uppercase animate-pulse">Live</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsAssistantOpen(true)}
                                className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest text-white group"
                            >
                                <Sparkles size={16} className="text-emerald-400 group-hover:scale-125 transition-transform" />
                                AI Insight
                            </button>

                            <label className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl hover:bg-slate-200 transition-all font-black text-[10px] uppercase tracking-[0.2em] group shadow-[0_0_50px_rgba(255,255,255,0.1)] cursor-pointer hover:scale-[1.03] active:scale-[0.97]">
                                <Upload size={18} />
                                <span>{uploading ? 'Parsing...' : 'Ingest Data'}</span>
                                <input type="file" accept=".xlsx,.xls" onChange={handleUpload} className="hidden" disabled={uploading} />
                            </label>

                            <button
                                onClick={handleClearAll}
                                className="flex items-center justify-center w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                                title="Flush Core Cache"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>

                    {/* File Menu (Side Drawer) */}
                    <AnimatePresence>
                        {isFileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="portfolite-card p-4 space-y-2 absolute top-40 left-12 w-80 z-50 bg-black/90 backdrop-blur-xl border-white/10"
                            >
                                <div className="p-3 mb-2 flex justify-between items-center bg-white/5 rounded-xl">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Connected Nodes</span>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                </div>
                                {files.length === 0 ? (
                                    <div className="p-8 text-center opacity-30 italic text-sm font-medium">No datasets loaded.</div>
                                ) : (
                                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                                        {files.map(file => (
                                            <div
                                                key={file.id}
                                                className={`flex items-center justify-between p-4 rounded-xl group transition-all cursor-pointer ${selectedFile?.id === file.id ? 'bg-white text-black' : 'hover:bg-white/5'}`}
                                                onClick={() => handleFileSelect(file)}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <FileSpreadsheet size={16} className={selectedFile?.id === file.id ? 'text-black' : 'text-slate-700'} />
                                                    <span className="text-xs font-black truncate tracking-tight">{file.original_filename}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteFile(e, file.id)}
                                                    className={`p-1.5 opacity-0 group-hover:opacity-100 transition-all rounded-lg ${selectedFile?.id === file.id ? 'hover:bg-black/10 text-black/40 hover:text-red-600' : 'hover:bg-red-500/10 text-slate-700 hover:text-red-500'}`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* KPI Cards (Bento Style) */}
                    {analytics && analytics.kpis && (
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                            {[
                                { label: 'Total Syncs', val: analytics.kpis.totalRows.toLocaleString(), icon: <Database /> },
                                { label: 'Layers', val: sheets.length, icon: <Layers /> },
                                { label: 'Numeric Tags', val: analytics.kpis.numericColumns, icon: <TrendingUp /> },
                                { label: 'Clusters', val: analytics.kpis.categoricalColumns, icon: <LayoutDashboard /> },
                                { label: 'Dimension', val: analytics.kpis.totalColumns, icon: <Activity /> },
                                { label: 'Reliability', val: `${analytics.kpis.dataCoverage}%`, icon: <StatusPulse /> }
                            ].map((kpi, i) => (
                                <div key={i} className="portfolite-card p-8 flex flex-col justify-between group hover:border-white/30 transition-all hover:scale-[1.02]">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-slate-700 group-hover:bg-white group-hover:text-black transition-all">
                                        {cloneElement(kpi.icon, { size: 20 })}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-3xl font-black tracking-tighter italic">{kpi.val}</div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover:text-slate-400 transition-all">{kpi.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Sheet Tabs */}
                    {sheets.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {sheets.map(sheet => (
                                <button
                                    key={sheet.id}
                                    onClick={() => handleSheetSelect(sheet)}
                                    className={`px-6 py-3 rounded-2xl transition-all whitespace-nowrap text-sm font-bold border ${selectedSheet?.id === sheet.id
                                        ? 'bg-white text-black border-white'
                                        : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {sheet.sheet_name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Content View */}
                    {!selectedFile ? (
                        <div className="portfolite-card h-[400px] flex flex-col items-center justify-center opacity-30">
                            <Upload size={64} className="mb-6 text-slate-700" />
                            <h3 className="text-2xl font-bold tracking-tighter uppercase">No Active Context</h3>
                            <p className="text-slate-500 font-medium">Upload industrial dataset to initialize analyzer.</p>
                        </div>
                    ) : loading || loadingAnalytics ? (
                        <div className="portfolite-card h-[400px] flex flex-col items-center justify-center gap-6">
                            <div className="w-10 h-10 border-b-2 border-white rounded-full animate-spin" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Vectorizing Data Patterns...</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* View Selector */}
                            <div className="flex gap-4 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit">
                                <button
                                    onClick={() => setActiveView('charts')}
                                    className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${activeView === 'charts' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'
                                        }`}
                                >
                                    Gallery
                                </button>
                                <button
                                    onClick={() => setActiveView('data')}
                                    className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${activeView === 'data' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'
                                        }`}
                                >
                                    Registry
                                </button>
                            </div>

                            {/* Charts View */}
                            {activeView === 'charts' && analytics && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {analytics.suggestedCharts && analytics.suggestedCharts.map((chart, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="portfolite-card p-10"
                                        >
                                            <div className="mb-10">
                                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-2">Automated Perspective</div>
                                                <h3 className="text-3xl font-black tracking-tighter mb-2">{chart.title}</h3>
                                                <p className="text-slate-500 font-medium">{chart.description}</p>
                                            </div>

                                            <div className="h-[300px] w-full mt-4">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    {chart.type === 'bar' ? (
                                                        <BarChart data={Object.entries(analytics.aggregations.numeric).map(([name, data]) => ({ name, value: data.sum }))}>
                                                            <XAxis dataKey="name" hide />
                                                            <Tooltip
                                                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                                            />
                                                            <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                                                                <Cell fill="#ffffff" />
                                                            </Bar>
                                                        </BarChart>
                                                    ) : chart.type === 'area' || chart.type === 'timeSeries' ? (
                                                        <AreaChart data={analytics.aggregations.timeSeries}>
                                                            <defs>
                                                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <XAxis dataKey="date" hide />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                                            />
                                                            <Area type="monotone" dataKey="value" stroke="#818cf8" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                                                        </AreaChart>
                                                    ) : chart.type === 'pie' ? (
                                                        <PieChart>
                                                            <Pie
                                                                data={analytics.aggregations.topN}
                                                                dataKey="total"
                                                                nameKey="category"
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={60}
                                                                outerRadius={100}
                                                                paddingAngle={5}
                                                            >
                                                                {analytics.aggregations.topN.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={['#ffffff', '#6366f1', '#f43f5e', '#fbbf24', '#10b981'][index % 5]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                                            />
                                                        </PieChart>
                                                    ) : (
                                                        <BarChart data={analytics.aggregations.topN}>
                                                            <XAxis dataKey="category" hide />
                                                            <Tooltip
                                                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                                                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                                            />
                                                            <Bar dataKey="total" radius={[10, 10, 10, 10]} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" />
                                                        </BarChart>
                                                    )}
                                                </ResponsiveContainer>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Data View */}
                            {activeView === 'data' && (
                                <div className="portfolite-card overflow-hidden">
                                    <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                        <div className="relative w-96 group">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-white" />
                                            <input
                                                type="text"
                                                placeholder="Filter local records..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm font-bold placeholder:text-slate-800 focus:outline-none transition-all"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto max-h-[600px]">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">Row</th>
                                                    {columns.map((col, i) => (
                                                        <th key={i} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {filteredRows.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{row.row_number}</td>
                                                        {columns.map((col, i) => (
                                                            <td key={i} className="px-6 py-4 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                                                                {row.data[col] || '-'}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const StatusPulse = ({ size }) => <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}><Database size={size} /></motion.div>;

export default AnalyticsPlatform;
