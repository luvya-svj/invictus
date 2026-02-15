import React, { useState, useEffect } from 'react';
import { ShoppingCart, AlertTriangle, CheckCircle2, Package, RefreshCw, Filter, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';

const Procurement = () => {
    const { showToast } = useToast();
    const [triggers, setTriggers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        fetchTriggers();
    }, []);

    const fetchTriggers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/procurement/triggers');
            setTriggers(res.data);
        } catch (err) {
            console.error('Error fetching triggers:', err);
            showToast('Sync failed: Could not reach supply chain node.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFulfill = async (id, componentName) => {
        try {
            await api.post(`/procurement/triggers/${id}/fulfill`, { quantity: 1000 });
            showToast(`${componentName} stock replenished.`, 'success');
            fetchTriggers();
        } catch (err) {
            showToast('Procurement fulfillment failed.', 'error');
        }
    };

    const filteredTriggers = triggers.filter(t => t.status === filter);

    return (
        <div className="min-h-screen bg-black text-white flex selection:bg-white selection:text-black">
            <Sidebar />

            <main className="flex-1 ml-20 p-12 transition-all duration-300">
                <div className="max-w-7xl mx-auto space-y-12">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter mb-2 italic text-white uppercase">Electrolyte Supply</h1>
                            <p className="text-slate-500 font-medium">Supply chain intelligence and automated restocking triggers.</p>
                        </div>
                        <div className="flex gap-3 bg-white/5 p-1 rounded-2xl border border-white/10">
                            {['pending', 'fulfilled'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-6 py-3 rounded-xl font-bold transition-all text-sm uppercase tracking-widest ${filter === f ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Triggers Table */}
                    <div className="portfolite-card overflow-hidden">
                        {loading ? (
                            <div className="p-24 flex flex-col items-center gap-6 text-slate-500 uppercase tracking-[0.3em] font-black text-xs">
                                <div className="w-8 h-8 border-b-2 border-white rounded-full animate-spin" />
                                Analyzing Supply Chain...
                            </div>
                        ) : filteredTriggers.length === 0 ? (
                            <div className="p-24 flex flex-col items-center gap-6 opacity-30 italic">
                                <CheckCircle2 size={48} className="text-emerald-500" />
                                <p className="font-black text-2xl tracking-tighter uppercase">No {filter} triggers.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Resource</th>
                                            <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Stock</th>
                                            <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Monthly Demand</th>
                                            <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">Trigger Date</th>
                                            <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <AnimatePresence>
                                            {filteredTriggers.map((t, idx) => (
                                                <motion.tr
                                                    key={t.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-6">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${filter === 'pending' ? 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-black' : 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black'}`}>
                                                                {filter === 'pending' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{t.part_number}</div>
                                                                <div className="text-xl font-black tracking-tighter">{t.component_name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-center font-bold font-mono text-slate-400">
                                                        {t.stock_quantity.toLocaleString()}
                                                    </td>
                                                    <td className="p-8 text-center font-bold font-mono text-slate-400">
                                                        {t.monthly_demand.toLocaleString()}
                                                    </td>
                                                    <td className="p-8 text-center text-sm font-medium text-slate-600">
                                                        {new Date(t.trigger_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        {t.status === 'pending' ? (
                                                            <button
                                                                onClick={() => handleFulfill(t.id, t.component_name)}
                                                                className="px-6 py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 ml-auto shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                                            >
                                                                <RefreshCw size={14} /> Fulfill
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest ml-auto justify-end">
                                                                <CheckCircle2 size={14} /> Completed
                                                            </div>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Procurement;
