import React, { useState, useEffect } from 'react';
import { Factory, Play, Pause, AlertCircle, Clock, Trash2, Package, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import InitiateBatchModal from '../components/InitiateBatchModal';
import AuditDetailsModal from '../components/AuditDetailsModal';
import { useToast } from '../components/Toast';

const LayersIcon = () => (
    <div className="flex flex-col gap-0.5">
        <div className="w-4 h-0.5 bg-current opacity-30"></div>
        <div className="w-4 h-0.5 bg-current opacity-60"></div>
        <div className="w-4 h-0.5 bg-current"></div>
    </div>
);

const TrendingUpIcon = ({ size, className }) => (
    <motion.div
        className={className}
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
    >
        <Factory size={size} />
    </motion.div>
);

const Production = () => {
    const { showToast } = useToast();
    const [pcbs, setPcbs] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [selectedRun, setSelectedRun] = useState(null);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

    useEffect(() => {
        fetchPCBs();
        fetchHistory();
    }, []);

    const fetchPCBs = async () => {
        try {
            const res = await api.get('/production/pcbs');
            setPcbs(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching PCBs:', err);
            showToast('Failed to sync active lines', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/production/history');
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching history:', err);
        }
    };

    return (
        <React.Fragment>
            <div className="min-h-screen bg-black text-white flex selection:bg-white selection:text-black">
                <Sidebar />

                <main className="flex-1 ml-20 p-12 transition-all duration-300">
                    <div className="max-w-7xl mx-auto space-y-12">

                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                            <div>
                                <h1 className="text-5xl font-black tracking-tighter mb-2 italic text-white uppercase">Electrolyte Production</h1>
                                <p className="text-slate-500 font-medium">Real-time monitoring of assembly line throughput and yield.</p>
                            </div>
                            <div className="flex gap-3 relative z-[100]">
                                <button
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl hover:bg-slate-200 transition-all font-bold group shadow-[0_0_50px_rgba(255,255,255,0.2)] relative z-[110] cursor-pointer"
                                    onClick={() => {
                                        console.log("CRITICAL: Start Production Clicked");
                                        setIsBatchModalOpen(true);
                                    }}
                                >
                                    <Play size={18} /> <span>Start Production</span>
                                </button>
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="portfolite-card p-8 flex flex-col justify-between h-48">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Active Lines</span>
                                <div className="flex items-end justify-between">
                                    <span className="text-6xl font-black tracking-tighter">{String(pcbs.length).padStart(2, '0')}</span>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                </div>
                            </div>
                            <div className="portfolite-card p-8 flex flex-col justify-between h-48">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Throughput / hr</span>
                                <div className="flex items-end justify-between">
                                    <span className="text-6xl font-black tracking-tighter">84</span>
                                    <TrendingUpIcon size={32} className="text-slate-800" />
                                </div>
                            </div>
                            <div className="portfolite-card p-8 flex flex-col justify-between h-48">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Scheduled Batches</span>
                                <div className="flex items-end justify-between">
                                    <span className="text-6xl font-black tracking-tighter">12</span>
                                    <Clock size={32} className="text-slate-800" />
                                </div>
                            </div>
                        </div>

                        {/* PCB Queue */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-slate-700">
                                <LayersIcon />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Batch Registry</span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {loading ? (
                                    <div className="portfolite-card p-12 flex flex-col items-center gap-4 text-slate-500 uppercase tracking-widest text-xs font-bold">
                                        <div className="w-6 h-6 border-b-2 border-white rounded-full animate-spin" />
                                        Synchronizing Production...
                                    </div>
                                ) : pcbs.length === 0 ? (
                                    <div className="portfolite-card p-12 flex flex-col items-center gap-4 opacity-30">
                                        <AlertCircle size={48} className="text-slate-700" />
                                        <p className="font-black text-2xl tracking-tighter uppercase">No active lines.</p>
                                    </div>
                                ) : (
                                    pcbs.map((pcb, idx) => (
                                        <motion.div
                                            key={pcb.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="portfolite-card p-8 group flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-8">
                                                <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-black transition-all">
                                                    <Factory size={28} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{pcb.id?.toString().slice(0, 8)}</div>
                                                    <h3 className="text-3xl font-black tracking-tighter">{pcb.pcb_name}</h3>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-12">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1">Status</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        <span className="text-sm font-bold">In Progress</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1">Yield</span>
                                                    <span className="text-lg font-black tracking-tighter">98.4%</span>
                                                </div>
                                                <button
                                                    className="p-4 rounded-full border border-white/5 hover:bg-white hover:text-black transition-all group-hover:border-white/20 shadow-none"
                                                    onClick={() => showToast(`Assembly Line ${pcb.pcb_name?.split(' ')[0] || 'PCB'} ${idx + 1} paused`, 'info')}
                                                >
                                                    <Pause size={20} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Production History Log */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-slate-700">
                                <Clock size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Chronology</span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {history.length === 0 ? (
                                    <div className="portfolite-card p-12 flex flex-col items-center gap-4 opacity-30 italic text-slate-500">
                                        No historical logs found. Recorded runs will appear here.
                                    </div>
                                ) : (
                                    history.map((run, idx) => (
                                        <motion.div
                                            key={run.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-white/10 hover:bg-white/[0.04] cursor-pointer transition-all"
                                            onClick={() => {
                                                setSelectedRun(run);
                                                setIsAuditModalOpen(true);
                                            }}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="text-[9px] font-black text-slate-700 border border-slate-800 px-2 py-1 rounded">
                                                    ID: {run.id}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black tracking-tight">{run.pcb_name}</h4>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                                                        <Clock size={10} /> {new Date(run.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-10">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Produced</span>
                                                    <span className="text-2xl font-black tracking-tighter text-white">{run.quantity_produced} Units</span>
                                                </div>
                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white group-hover:text-black transition-all">
                                                    <Activity size={18} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* MODAL LAYER - Absolute Global Root */}
            <div style={{ position: 'relative', zIndex: 9999 }}>
                <InitiateBatchModal
                    isOpen={isBatchModalOpen}
                    onClose={() => setIsBatchModalOpen(false)}
                    onSuccess={() => {
                        console.log("Batch Success Event Triggered");
                        fetchPCBs();
                        fetchHistory();
                    }}
                />

                <AuditDetailsModal
                    isOpen={isAuditModalOpen}
                    onClose={() => setIsAuditModalOpen(false)}
                    runId={selectedRun?.id}
                    pcbName={selectedRun?.pcb_name}
                />
            </div>
        </React.Fragment>
    );
};
export default Production;
