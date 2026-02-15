import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

const ProductionModal = ({ isOpen, onClose, onSuccess }) => {
    const [selectedPcb, setSelectedPcb] = useState('');
    const [quantity, setQuantity] = useState('');
    const [status, setStatus] = useState('idle');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPcb || !quantity) return;

        setStatus('producing');
        try {
            const pcbId = parseInt(selectedPcb);
            const qty = parseInt(quantity);
            await api.post('/production', { pcb_id: pcbId, quantity: qty });

            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                setQuantity('');
                setSelectedPcb('');
                onSuccess?.();
                onClose();
            }, 1500);
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-background border-l border-white/10 z-50 p-8 shadow-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-white">Run Production</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">PCB Configuration</label>
                                <select
                                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={selectedPcb}
                                    onChange={(e) => setSelectedPcb(e.target.value)}
                                >
                                    <option value="">Select PCB Type...</option>
                                    <option value="1">PCB-A (Power Supply)</option>
                                    <option value="2">PCB-B (Control Unit)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Batch Size</label>
                                <input
                                    type="number"
                                    className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="Enter quantity..."
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    min="1"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'producing'}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${status === 'success' ? 'bg-emerald-500' :
                                        status === 'error' ? 'bg-red-500' :
                                            'bg-primary hover:bg-primary-dark'
                                    }`}
                            >
                                {status === 'producing' ? <RefreshCw className="animate-spin" /> :
                                    status === 'success' ? <CheckCircle /> :
                                        status === 'error' ? <AlertCircle /> : <Play fill="currentColor" size={18} />}
                                <span>
                                    {status === 'producing' ? 'PRODUCING...' :
                                        status === 'success' ? 'COMPLETED' :
                                            status === 'error' ? 'FAILED' : 'INITIATE RUN'}
                                </span>
                            </button>
                        </form>

                        <div className="mt-8 p-4 bg-surface/50 rounded-xl border border-white/5">
                            <h3 className="text-sm text-slate-500 uppercase tracking-wider mb-2">Simulation Log</h3>
                            <div className="font-mono text-xs text-slate-400 space-y-1">
                                <p>{'>'} System Ready</p>
                                <p>{'>'} Waiting for input...</p>
                                {status === 'producing' && <p className="text-primary">{'>'} Allocating resources...</p>}
                                {status === 'success' && <p className="text-emerald-400">{'>'} Batch completed successfully.</p>}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ProductionModal;
