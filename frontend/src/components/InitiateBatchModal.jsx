import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Layers, Cpu, Check } from 'lucide-react';
import api from '../services/api';
import { useToast } from './Toast';

const InitiateBatchModal = ({ isOpen, onClose, onSuccess }) => {
    const { showToast } = useToast();
    const [pcbs, setPcbs] = useState([]);
    const [selectedPcbId, setSelectedPcbId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        console.log("[MODAL] isOpen state changed:", isOpen);
        if (isOpen) {
            fetchPCBs();
        }
    }, [isOpen]);

    const fetchPCBs = async () => {
        try {
            console.log("[PRODUCTION] Loading product structures...");
            const res = await api.get('/pcbs');
            const pcbData = Array.isArray(res.data) ? res.data : [];
            setPcbs(pcbData);
            if (pcbData.length > 0) {
                setSelectedPcbId(pcbData[0].id.toString());
                console.log(`[PRODUCTION] Loaded ${pcbData.length} PCBs`);
            } else {
                console.warn("[PRODUCTION] No PCBs found in database!");
            }
        } catch (err) {
            console.error('[PRODUCTION] Failed to fetch product structures:', err);
            showToast('Failed to fetch product structures', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPcbId) {
            showToast('Please select a product structure', 'error');
            return;
        }
        setStatus('loading');
        try {
            await api.post('/production', {
                pcb_id: parseInt(selectedPcbId),
                quantity: parseInt(quantity)
            });

            setStatus('success');
            showToast(`Batch initiated: ${quantity} units`);
            setTimeout(() => {
                setStatus('idle');
                onSuccess?.();
                onClose();
            }, 1200);
        } catch (err) {
            setStatus('error');
            const errMsg = err.response?.data?.error || err.response?.data?.msg || 'Failed to initiate batch';
            showToast(errMsg, 'error');
            console.error("Production Error Details:", {
                message: err.message,
                response: err.response?.data,
                payload: { pcb_id: selectedPcbId, quantity }
            });
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
                        onClick={() => {
                            console.log("[MODAL] Backdrop clicked. Closing...");
                            onClose();
                        }}
                    />
                    <motion.div
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-black border border-white/10 rounded-[40px] p-12 z-[70] shadow-[0_0_100px_rgba(255,255,255,0.05)]"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-20 h-20 rounded-3xl bg-white text-black flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                                <Play size={32} />
                            </div>
                            <div>
                                <h2 className="text-4xl font-black tracking-tighter mb-2">Start Production</h2>
                                <p className="text-slate-500 font-medium">Configure parameters for the assembly line.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="w-full space-y-8 mt-6">
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 ml-1">Select Product Structure (PCB)</label>
                                    <div className="relative">
                                        <select
                                            value={selectedPcbId.toString()}
                                            onChange={(e) => setSelectedPcbId(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold appearance-none focus:border-white outline-none transition-all disabled:opacity-50"
                                            required
                                            disabled={pcbs.length === 0}
                                        >
                                            {pcbs.length === 0 && <option value="">Loading structures...</option>}
                                            {pcbs.map(pcb => (
                                                <option key={pcb.id} value={pcb.id.toString()} className="bg-zinc-900">
                                                    {pcb.pcb_name || `PCB Identifier #${pcb.id}`}
                                                </option>
                                            ))}
                                        </select>
                                        <Layers size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 ml-1">Batch Quantity</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-2xl font-black focus:border-white outline-none transition-all"
                                            placeholder="Batch size..."
                                            required
                                        />
                                        <Cpu size={24} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex gap-4 w-full pt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/10 text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all font-sans"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${status === 'success' ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.1)] font-sans'
                                            }`}
                                    >
                                        {status === 'loading' ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : status === 'success' ? <Check size={18} /> : <Play size={18} />}
                                        <span>{status === 'loading' ? 'Syncing...' : status === 'success' ? 'Deployed' : 'Start Production'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default InitiateBatchModal;
