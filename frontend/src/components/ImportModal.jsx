import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useToast } from './Toast';

const ImportModal = ({ isOpen, onClose, onSuccess }) => {
    const { showToast } = useToast();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('token');

        try {
            const res = await axios.post(
                'http://localhost:5000/api/excel/upload',
                formData,
                { headers: { 'x-auth-token': token } }
            );
            showToast(`Successfully ingested ${res.data.sheetsProcessed} data structures`);
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error(err);
            showToast('Ingestion failed: ' + (err.response?.data?.msg || 'System error'), 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-black border border-white/10 rounded-[40px] p-12 z-[70] shadow-[0_0_100px_rgba(255,255,255,0.05)]"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4">
                                <Upload size={32} />
                            </div>
                            <div>
                                <h2 className="text-4xl font-black tracking-tighter mb-2">Bulk Ingestion</h2>
                                <p className="text-slate-500 font-medium">Upload Excel or CSV datasets to populate the registry.</p>
                            </div>

                            <div className="w-full mt-8">
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-[32px] hover:border-white/20 transition-all cursor-pointer group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <FileSpreadsheet className={`mb-4 transition-all ${file ? 'text-emerald-500' : 'text-slate-700 group-hover:text-slate-400'}`} size={40} />
                                        <p className="mb-2 text-sm font-bold tracking-tight">
                                            {file ? file.name : <><span className="text-white">Click to upload</span> or drag and drop</>}
                                        </p>
                                        {!file && <p className="text-xs text-slate-600 uppercase tracking-widest font-black">XLSX, XLS, CSV</p>}
                                    </div>
                                    <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                                </label>
                            </div>

                            <div className="flex gap-4 w-full mt-10">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${!file
                                            ? 'bg-white/5 text-slate-700 cursor-not-allowed'
                                            : 'bg-white text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                                        }`}
                                >
                                    {uploading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Check size={18} />}
                                    <span>{uploading ? 'Processing' : 'Execute Import'}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ImportModal;
