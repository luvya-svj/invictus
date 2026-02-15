import React, { useState, useEffect } from 'react';
import { Search, Upload, FileSpreadsheet, Table, ArrowLeft, Loader, BarChart3, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../services/api';
import axios from 'axios';

const ExcelViewer = () => {
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [sheets, setSheets] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('data');
    const [analytics, setAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await api.get('/excel/files');
            setFiles(res.data);
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
        } catch (err) {
            console.error('Error fetching sheets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSheetSelect = async (sheet) => {
        setSelectedSheet(sheet);
        setActiveTab('data');
        setLoading(true);
        try {
            const res = await api.get(`/excel/sheets/${sheet.id}/rows?limit=100&offset=0`);
            setRows(res.data.rows);
            setTotalRows(res.data.total);
        } catch (err) {
            console.error('Error fetching rows:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        if (!selectedSheet) return;
        setLoadingAnalytics(true);
        try {
            const res = await api.get(`/excel/sheets/${selectedSheet.id}/analytics`);
            setAnalytics(res.data);
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'analytics' && selectedSheet && !analytics) {
            fetchAnalytics();
        }
    }, [activeTab, selectedSheet]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');

        try {
            const res = await axios.post(
                'http://localhost:5000/api/excel/upload',
                formData,
                {
                    headers: {
                        'x-auth-token': token,
                    }
                }
            );
            alert(`Upload successful! Processed ${res.data.sheetsProcessed} sheets.`);
            fetchFiles();
        } catch (err) {
            console.error(err);
            alert('Upload failed: ' + (err.response?.data?.msg || 'Unknown error'));
        } finally {
            setUploading(false);
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

    return (
        <div className="min-h-screen bg-background p-8 font-sans text-white">
            <div className="max-w-[1800px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="p-2 bg-surface/50 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                Excel Viewer
                            </h1>
                            <p className="text-slate-400 mt-1">View multi-sheet Excel files with intelligent analytics</p>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 cursor-pointer">
                        <Upload size={18} />
                        <span>{uploading ? 'Uploading...' : 'Upload Excel'}</span>
                        <input type="file" accept=".xlsx,.xls" onChange={handleUpload} className="hidden" disabled={uploading} />
                    </label>
                </div>

                {/* Main Content: 3-Column Layout */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Left: Files List */}
                    <div className="col-span-3 bg-surface/40 border border-white/5 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <FileSpreadsheet className="text-primary" size={20} />
                            Uploaded Files
                        </h2>
                        <div className="space-y-2 max-h-[700px] overflow-y-auto">
                            {files.length === 0 ? (
                                <p className="text-slate-500 text-sm">No files uploaded yet</p>
                            ) : (
                                files.map(file => (
                                    <motion.div
                                        key={file.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => handleFileSelect(file)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all ${selectedFile?.id === file.id
                                                ? 'bg-primary/20 border border-primary/50'
                                                : 'bg-black/20 border border-white/5 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="font-medium text-sm truncate">{file.original_filename}</div>
                                        <div className="text-xs text-slate-500 mt-1">{file.total_sheets} sheets</div>
                                        <div className="text-xs text-slate-600 mt-1">
                                            {new Date(file.uploaded_at).toLocaleDateString()}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Middle: Sheets List */}
                    <div className="col-span-3 bg-surface/40 border border-white/5 rounded-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Table className="text-emerald-400" size={20} />
                            Sheets
                        </h2>
                        {!selectedFile ? (
                            <p className="text-slate-500 text-sm">Select a file to view sheets</p>
                        ) : loading ? (
                            <div className="flex items-center gap-2 text-slate-400">
                                <Loader className="animate-spin" size={16} />
                                <span>Loading...</span>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[700px] overflow-y-auto">
                                {sheets.map(sheet => (
                                    <motion.div
                                        key={sheet.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => handleSheetSelect(sheet)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all ${selectedSheet?.id === sheet.id
                                                ? 'bg-emerald-500/20 border border-emerald-500/50'
                                                : 'bg-black/20 border border-white/5 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="font-medium text-sm">{sheet.sheet_name}</div>
                                        <div className="text-xs text-slate-500 mt-1">{sheet.row_count} rows</div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Data Table or Analytics */}
                    <div className="col-span-6 bg-surface/40 border border-white/5 rounded-2xl p-6">
                        {/* Tabs */}
                        <div className="flex gap-2 mb-4 border-b border-white/10">
                            <button
                                onClick={() => setActiveTab('data')}
                                className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === 'data'
                                        ? 'text-white border-b-2 border-primary'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Table size={16} className="inline mr-2" />
                                Data
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                disabled={!selectedSheet}
                                className={`px-4 py-2 text-sm font-medium transition-all ${activeTab === 'analytics'
                                        ? 'text-white border-b-2 border-emerald-500'
                                        : 'text-slate-400 hover:text-white disabled:opacity-30'
                                    }`}
                            >
                                <BarChart3 size={16} className="inline mr-2" />
                                Analytics
                            </button>
                        </div>

                        {/* Data Tab */}
                        {activeTab === 'data' && (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Data</h2>
                                    {selectedSheet && (
                                        <div className="text-sm text-slate-400">
                                            {filteredRows.length} / {totalRows} rows
                                        </div>
                                    )}
                                </div>

                                {!selectedSheet ? (
                                    <p className="text-slate-500 text-sm">Select a sheet to view data</p>
                                ) : loading ? (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Loader className="animate-spin" size={16} />
                                        <span>Loading rows...</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative mb-4">
                                            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search in table..."
                                                className="w-full bg-black/20 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>

                                        <div className="overflow-x-auto max-h-[600px] border border-white/10 rounded-xl">
                                            <table className="w-full text-sm">
                                                <thead className="bg-black/40 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-slate-400 font-medium border-b border-white/10">
                                                            #
                                                        </th>
                                                        {columns.map((col, i) => (
                                                            <th
                                                                key={i}
                                                                className="px-4 py-3 text-left text-slate-400 font-medium border-b border-white/10"
                                                            >
                                                                {col}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredRows.map((row, idx) => (
                                                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                            <td className="px-4 py-3 text-slate-500">{row.row_number}</td>
                                                            {columns.map((col, i) => (
                                                                <td key={i} className="px-4 py-3 text-slate-200">
                                                                    {row.data[col] || '-'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {/* Analytics Tab */}
                        {activeTab === 'analytics' && (
                            <>
                                {loadingAnalytics ? (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Loader className="animate-spin" size={16} />
                                        <span>Analyzing data...</span>
                                    </div>
                                ) : analytics ? (
                                    <div className="space-y-6 max-h-[650px] overflow-y-auto">
                                        {/* Column Types Info */}
                                        <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                                            <h3 className="text-sm font-bold text-slate-300 mb-3">🔍 Detected Column Types</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(analytics.columnTypes).map(([col, info]) => (
                                                    <div key={col} className="px-3 py-1 bg-surface/50 border border-white/5 rounded-lg text-xs">
                                                        <span className="text-white font-medium">{col}</span>
                                                        <span className={`ml-2 ${info.type === 'numeric' ? 'text-blue-400' :
                                                                info.type === 'date' ? 'text-purple-400' :
                                                                    info.type === 'categorical' ? 'text-emerald-400' : 'text-slate-400'
                                                            }`}>
                                                            {info.type}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Suggested Charts */}
                                        {analytics.suggestedCharts.length > 0 ? (
                                            analytics.suggestedCharts.map((chart, idx) => (
                                                <div key={idx} className="bg-black/20 border border-white/10 rounded-xl p-4">
                                                    <h3 className="text-lg font-bold text-white mb-1">{chart.title}</h3>
                                                    <p className="text-xs text-slate-500 mb-4">{chart.description}</p>

                                                    {/* Render charts based on type */}
                                                    {chart.type === 'bar' && analytics.aggregations.numeric && (
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <BarChart data={Object.entries(analytics.aggregations.numeric).map(([name, data]) => ({ name, value: data.sum }))}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                                                <XAxis dataKey="name" stroke="#888" />
                                                                <YAxis stroke="#888" />
                                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                                                <Bar dataKey="value" fill="#3b82f6" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    )}

                                                    {chart.type === 'topN' && analytics.aggregations.topN && (
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <BarChart data={analytics.aggregations.topN}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                                                <XAxis dataKey="category" stroke="#888" angle={-45} textAnchor="end" height={80} />
                                                                <YAxis stroke="#888" />
                                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                                                <Bar dataKey="total" fill="#10b981" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    )}

                                                    {chart.type === 'timeSeries' && analytics.aggregations.timeSeries && (
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <LineChart data={analytics.aggregations.timeSeries}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                                                <XAxis dataKey="date" stroke="#888" />
                                                                <YAxis stroke="#888" />
                                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                                                <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-slate-500 py-8">
                                                <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
                                                <p>No suitable charts detected for this data structure</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm">Select a sheet to view analytics</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExcelViewer;
