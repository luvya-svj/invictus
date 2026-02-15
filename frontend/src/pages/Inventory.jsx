import React, { useState, useEffect } from 'react';
import { Search, Plus, Upload, Download, Package, AlertTriangle, TrendingUp, Edit2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import AddComponentModal from '../components/AddComponentModal';
import EditComponentModal from '../components/EditComponentModal';
import ImportModal from '../components/ImportModal';
import { useToast } from '../components/Toast';

const Inventory = () => {
    const { showToast } = useToast();
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);

    useEffect(() => {
        fetchComponents();
    }, []);

    const fetchComponents = async () => {
        try {
            const res = await api.get('/components');
            setComponents(res.data);
        } catch (error) {
            console.error('Error fetching inventory', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredComponents = components.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.part_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white flex selection:bg-white selection:text-black font-sans antialiased">
            <Sidebar />

            <main className="flex-1 ml-20 p-12 transition-all duration-300">
                <div className="max-w-7xl mx-auto space-y-12">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter mb-2">Electrolyte Inventory</h1>
                            <p className="text-slate-500 font-medium font-sans">Comprehensive asset management with high-fidelity tracking.</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors text-slate-300 text-sm font-bold"
                                onClick={() => setIsImportModalOpen(true)}
                            >
                                <Upload size={16} /> <span>Import</span>
                            </button>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-2xl hover:bg-slate-200 transition-all text-sm font-bold group shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98]" onClick={() => setIsAddModalOpen(true)}>
                                <Plus size={16} /> <span>Register Item</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats & Search Overview (Bento Style) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="portfolite-card p-6 flex flex-col justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Master Stock Count</span>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-black tracking-tighter">{components.length}</span>
                                <Package size={18} className="text-slate-700" />
                            </div>
                        </div>
                        <div className="portfolite-card p-6 flex flex-col justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Stock Integrity</span>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-black tracking-tighter">100%</span>
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-2 portfolite-card p-6 flex items-center gap-6">
                            <div className="flex-1">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1 block">Quick Query</span>
                                <div className="relative">
                                    <Search size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-700" />
                                    <input
                                        type="text"
                                        placeholder="Search by part number, name, or description..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-transparent border-none text-xl font-bold pl-8 focus:ring-0 placeholder:text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Table (Portfolite Minimalist Style) */}
                    <div className="portfolite-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-600">Part Info</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-600">Stock Context</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-600">Demand Cycle</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-600">Safety Threshold</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-600 text-right">Ops</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-6 h-6 border-b-2 border-white rounded-full animate-spin" />
                                                    <span className="text-slate-500 text-sm font-bold tracking-widest uppercase">Syncing Local Registry...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredComponents.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-30">
                                                    <Package size={48} className="text-slate-600" />
                                                    <p className="font-black text-2xl tracking-tighter uppercase">No assets identified.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredComponents.map((component, idx) => (
                                            <motion.tr
                                                key={component.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="group hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black tracking-widest text-slate-500 mb-1 font-mono">{component.part_number}</span>
                                                        <span className="text-lg font-black tracking-tight text-white group-hover:text-emerald-500 transition-colors">{component.name}</span>
                                                        <span className="text-xs text-slate-600 font-medium line-clamp-1 max-w-[200px] mt-1">{component.description}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl font-black tracking-tighter">{component.stock_quantity ?? 0}</span>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${component.stock_quantity <= component.low_stock_threshold ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                                            }`} />
                                                    </div>
                                                    <div className="w-24 h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${component.stock_quantity <= component.low_stock_threshold ? 'bg-red-500' : 'bg-white'
                                                                }`}
                                                            style={{ width: `${Math.min((component.stock_quantity / (component.monthly_demand || 100)) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <TrendingUp size={14} className="opacity-40" />
                                                        <span className="text-sm font-black tracking-tight">{component.monthly_demand ?? 0}</span>
                                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">/mo</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <AlertTriangle size={14} className="opacity-40" />
                                                        <span className="text-sm font-bold tracking-tight">{component.low_stock_threshold ?? 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all"
                                                            onClick={() => {
                                                                setSelectedComponent(component);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all"
                                                            onClick={() => showToast(`Asset Type: ${component.name} | Identifier: ${component.part_number}`, 'info')}
                                                        >
                                                            <Info size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <AddComponentModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={fetchComponents}
                />

                <EditComponentModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    component={selectedComponent}
                    onSuccess={fetchComponents}
                />

                <ImportModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onSuccess={fetchComponents}
                />
            </main>
        </div>
    );
};

export default Inventory;
