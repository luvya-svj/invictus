import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Package, ArrowRight, CornerDownRight } from 'lucide-react';
import api from '../services/api';

const AuditDetailsModal = ({ isOpen, onClose, runId, pcbName }) => {
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && runId) {
            fetchDetails();
        }
    }, [isOpen, runId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/production/history/${runId}`);
            setDetails(res.data);
        } catch (err) {
            console.error("Error fetching audit details:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-4xl bg-black border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.05)] flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 text-emerald-500 mb-3">
                                <Activity size={18} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Traceability</span>
                            </div>
                            <h2 className="text-4xl font-black tracking-tighter text-white">
                                {pcbName} <span className="text-slate-600">Audit</span>
                            </h2>
                            <p className="text-slate-500 font-medium mt-1">Component snapshots recorded at production timestamp.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-4 rounded-2xl hover:bg-white hover:text-black transition-all text-slate-500"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                                <div className="w-10 h-10 border-t-2 border-white rounded-full animate-spin" />
                                <span className="text-xs font-black uppercase tracking-widest">Reconstructing Snapshots...</span>
                            </div>
                        ) : details.length === 0 ? (
                            <div className="text-center py-20 text-slate-700 font-black uppercase tracking-widest text-sm">
                                No traceability data found for this run.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {details.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-white/10 transition-all"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-black transition-all">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">{item.part_number}</div>
                                                <h4 className="text-xl font-black tracking-tight">{item.component_name}</h4>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-12 text-center">
                                            <div className="flex flex-col items-center min-w-[80px]">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">Before</span>
                                                <span className="text-xl font-bold tracking-tighter">{item.stock_before}</span>
                                            </div>

                                            <div className="flex flex-col items-center text-emerald-500 group-hover:translate-x-1 transition-transform">
                                                <CornerDownRight size={14} className="mb-1 opacity-30" />
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Used</div>
                                                <div className="bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-black">-{item.quantity_used}</div>
                                            </div>

                                            <div className="flex flex-col items-center min-w-[80px]">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">After</span>
                                                <span className="text-xl font-bold tracking-tighter text-white/90">{item.stock_after}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-center">
                        <button
                            onClick={onClose}
                            className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        >
                            Acknowledge Report
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AuditDetailsModal;
