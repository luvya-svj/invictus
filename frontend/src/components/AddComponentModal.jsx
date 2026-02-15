import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShieldAlert, Cpu, Layers } from 'lucide-react';
import api from '../services/api';
import { useToast } from './Toast';

const AddComponentModal = ({ isOpen, onClose, onSuccess }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        part_number: '',
        description: '',
        stock_quantity: '',
        low_stock_threshold: '',
        monthly_demand: ''
    });
    const [status, setStatus] = useState('idle');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await api.post('/components', formData);
            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                setFormData({ name: '', part_number: '', description: '', stock_quantity: '', low_stock_threshold: '', monthly_demand: '' });
                onSuccess?.();
                onClose();
            }, 1200);
        } catch (err) {
            console.error("Error adding component:", err);
            setStatus('error');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                        className="fixed right-0 top-0 bottom-0 w-full md:w-[650px] bg-black border-l border-white/5 z-[70] flex flex-col shadow-[0_0_100px_rgba(255,255,255,0.02)] overflow-y-auto"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 200, mass: 1 }}
                    >
                        {/* Header */}
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/50 sticky top-0 backdrop-blur-xl z-20">
                            <div>
                                <h2 className="text-4xl font-black tracking-tighter">Register Asset</h2>
                                <p className="text-slate-500 text-sm mt-1 font-medium">Define metadata and stock metrics for the enterprise registry.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
                            >
                                <X size={22} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="flex-1 p-10 space-y-16">

                            {/* Identity Section */}
                            <div className="space-y-10">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <Cpu size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Core Identity</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Part Identifier</label>
                                        <input
                                            name="part_number"
                                            value={formData.part_number}
                                            onChange={handleChange}
                                            required
                                            placeholder="PN-X-900"
                                            className="w-full bg-transparent border-b border-white/10 focus:border-white py-4 text-xl font-bold tracking-tight outline-none placeholder:text-slate-800 transition-all font-mono uppercase"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Component Label</label>
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Formal Name"
                                            className="w-full bg-transparent border-b border-white/10 focus:border-white py-4 text-xl font-bold tracking-tight outline-none placeholder:text-slate-800 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Asset Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Brief technical summary..."
                                        rows="1"
                                        className="w-full bg-transparent border-b border-white/10 focus:border-white py-4 text-lg font-medium tracking-tight outline-none placeholder:text-slate-800 transition-all resize-none"
                                    />
                                </div>
                            </div>

                            {/* Metrics Section */}
                            <div className="space-y-10 pb-10">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <Layers size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Lifecycle Metrics</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Active Allocation</label>
                                        <input
                                            type="number"
                                            name="stock_quantity"
                                            value={formData.stock_quantity}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full bg-transparent border-b border-white/10 focus:border-white py-4 text-2xl font-black tracking-tighter outline-none placeholder:text-slate-800 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Safety Floor</label>
                                        <input
                                            type="number"
                                            name="low_stock_threshold"
                                            value={formData.low_stock_threshold}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full bg-transparent border-b border-white/10 focus:border-white py-4 text-2xl font-black tracking-tighter outline-none placeholder:text-slate-800 transition-all text-red-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Monthly Demand</label>
                                        <input
                                            type="number"
                                            name="monthly_demand"
                                            value={formData.monthly_demand}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full bg-transparent border-b border-white/10 focus:border-white py-4 text-2xl font-black tracking-tighter outline-none placeholder:text-slate-800 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Footer / Submit */}
                        <div className="p-10 border-t border-white/5 bg-black sticky bottom-0">
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={status === 'loading'}
                                className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 transition-all duration-500 ${status === 'success' ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_40px_rgba(255,255,255,0.1)]'
                                    }`}
                            >
                                {status === 'loading' ? (
                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                ) : status === 'success' ? (
                                    <Check size={20} />
                                ) : (
                                    <span>Synchronize Registry</span>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AddComponentModal;
