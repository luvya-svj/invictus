import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Search, ChevronRight, Save, Trash2, Package, Cpu, ArrowLeft, Check } from 'lucide-react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';

const Mapping = () => {
    const { showToast } = useToast();
    const [pcbs, setPcbs] = useState([]);
    const [selectedPcb, setSelectedPcb] = useState(null);
    const [mapping, setMapping] = useState([]); // [{ component_id, quantity_required, component_name, part_number }]
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPcbName, setNewPcbName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        fetchPCBs();
        fetchInventory();
    }, []);

    const fetchPCBs = async () => {
        try {
            const res = await api.get('/pcbs');
            setPcbs(res.data);
        } catch (err) {
            console.error('Error fetching PCBs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const res = await api.get('/components');
            setInventory(res.data);
        } catch (err) {
            console.error('Error fetching inventory:', err);
        }
    };

    const fetchMapping = async (pcbId) => {
        try {
            const res = await api.get(`/pcbs/${pcbId}/components`);
            setMapping(res.data);
        } catch (err) {
            console.error('Error fetching mapping:', err);
        }
    };

    const handleSelectPcb = (pcb) => {
        setSelectedPcb(pcb);
        fetchMapping(pcb.id);
    };

    const handleCreatePcb = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/pcbs', { pcb_name: newPcbName });
            setPcbs([res.data, ...pcbs]);
            setNewPcbName('');
            setIsCreateModalOpen(false);
            handleSelectPcb(res.data);
            showToast('PCB structure initialized');
        } catch (err) {
            console.error('Error creating PCB:', err);
            showToast('Failed to create structure', 'error');
        }
    };

    const handleDeletePcb = async (e, pcbId) => {
        e.stopPropagation();
        if (!window.confirm('Delete this product structure? All mappings will be lost.')) return;
        try {
            await api.delete(`/pcbs/${pcbId}`);
            setPcbs(pcbs.filter(p => p.id !== pcbId));
            if (selectedPcb?.id === pcbId) setSelectedPcb(null);
            showToast('Structure removed from registry');
        } catch (err) {
            showToast('Failed to delete structure', 'error');
        }
    };

    const handleAddComponent = (component) => {
        if (mapping.find(m => m.component_id === component.id)) return;
        setMapping([...mapping, {
            component_id: component.id,
            quantity_required: 1,
            component_name: component.name,
            part_number: component.part_number
        }]);
    };

    const handleRemoveComponent = (compId) => {
        setMapping(mapping.filter(m => m.component_id !== compId));
    };

    const handleQtyChange = (compId, qty) => {
        setMapping(mapping.map(m =>
            m.component_id === compId ? { ...m, quantity_required: parseInt(qty) || 0 } : m
        ));
    };

    const handleSaveMapping = async () => {
        if (!selectedPcb) return;
        setStatus('saving');
        try {
            await api.post(`/pcbs/${selectedPcb.id}/components`, { components: mapping });
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {
            console.error('Error saving mapping:', err);
            setStatus('error');
        }
    };

    const filteredInventory = inventory.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.part_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white flex selection:bg-white selection:text-black">
            <Sidebar />

            <main className="flex-1 ml-20 p-12 transition-all duration-300">
                <div className="max-w-7xl mx-auto space-y-12">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter mb-2">Electrolyte Mapping</h1>
                            <p className="text-slate-500 font-medium">Define structural dependencies and component allocation.</p>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-white text-black px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2 group shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        >
                            <Plus size={18} /> <span>New PCB Structure</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column: PCB List */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-slate-700">
                                <Layers size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Master PCB List</span>
                            </div>

                            <div className="portfolite-card overflow-hidden">
                                {loading ? (
                                    <div className="p-12 flex flex-col items-center gap-4 text-slate-500">
                                        <div className="w-6 h-6 border-b-2 border-white rounded-full animate-spin" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Loading...</span>
                                    </div>
                                ) : pcbs.length === 0 ? (
                                    <div className="p-12 text-center opacity-30">
                                        <Layers size={48} className="mx-auto mb-4" />
                                        <p className="font-bold">No PCBs defined</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {pcbs.map(pcb => (
                                            <button
                                                key={pcb.id}
                                                onClick={() => handleSelectPcb(pcb)}
                                                className={`w-full p-6 text-left flex items-center justify-between group transition-all ${selectedPcb?.id === pcb.id ? 'bg-white/10' : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <div>
                                                    <h3 className={`font-black tracking-tight ${selectedPcb?.id === pcb.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                                        {pcb.pcb_name}
                                                    </h3>
                                                    <span className="text-[10px] font-mono text-slate-600">ID: {pcb.id}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={(e) => handleDeletePcb(e, pcb.id)}
                                                        className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <ChevronRight size={18} className={selectedPcb?.id === pcb.id ? 'text-white' : 'text-slate-800 group-hover:text-slate-500'} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Mapping Interface */}
                        <div className="lg:col-span-2 space-y-6">
                            {!selectedPcb ? (
                                <div className="portfolite-card h-full flex flex-col items-center justify-center p-20 opacity-20">
                                    <Cpu size={64} className="mb-6" />
                                    <h2 className="text-2xl font-black tracking-tighter uppercase">Select a PCB</h2>
                                    <p className="text-slate-500 font-medium text-center max-w-xs mt-2">Choose an entry from the list to begin component mapping.</p>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-8"
                                >
                                    {/* Header Info */}
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">Active Specification</span>
                                            <h2 className="text-4xl font-black tracking-tighter">{selectedPcb.pcb_name}</h2>
                                        </div>
                                        <button
                                            onClick={handleSaveMapping}
                                            disabled={status === 'saving'}
                                            className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all ${status === 'success' ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                                                }`}
                                        >
                                            {status === 'saving' ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : status === 'success' ? <Check size={16} /> : <Save size={16} />}
                                            <span>{status === 'saving' ? 'Syncing...' : status === 'success' ? 'Synchronized' : 'Save Structure'}</span>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Assigned Components */}
                                        <div className="space-y-4">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Assigned Components</div>
                                            <div className="portfolite-card min-h-[400px]">
                                                {mapping.length === 0 ? (
                                                    <div className="p-12 text-center opacity-20">
                                                        <Package size={40} className="mx-auto mb-4" />
                                                        <p className="text-sm font-bold">No components mapped</p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-white/5">
                                                        {mapping.map(m => (
                                                            <div key={m.component_id} className="p-5 flex items-center justify-between group">
                                                                <div className="flex-1">
                                                                    <div className="font-bold text-sm tracking-tight">{m.component_name}</div>
                                                                    <div className="text-[10px] font-mono text-slate-500">{m.part_number}</div>
                                                                </div>
                                                                <input
                                                                    type="number"
                                                                    value={m.quantity_required}
                                                                    onChange={(e) => handleQtyChange(m.component_id, e.target.value)}
                                                                    className="w-16 bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-center text-sm font-black focus:border-white outline-none mr-4"
                                                                />
                                                                <button
                                                                    onClick={() => handleRemoveComponent(m.component_id)}
                                                                    className="text-slate-700 hover:text-red-500 transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Inventory Selector */}
                                        <div className="space-y-4">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Asset Inventory</div>
                                            <div className="portfolite-card flex flex-col h-[400px]">
                                                <div className="p-4 border-b border-white/5 relative">
                                                    <Search size={14} className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-600" />
                                                    <input
                                                        type="text"
                                                        placeholder="Quick search..."
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-bold outline-none focus:border-white/20 transition-all"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                                                    {filteredInventory.map(comp => (
                                                        <button
                                                            key={comp.id}
                                                            onClick={() => handleAddComponent(comp)}
                                                            className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors group"
                                                        >
                                                            <div>
                                                                <div className="text-sm font-bold tracking-tight">{comp.name}</div>
                                                                <div className="text-[10px] font-mono text-slate-500">{comp.part_number}</div>
                                                            </div>
                                                            <Plus size={16} className="text-slate-800 group-hover:text-white transition-colors" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Create PCB Modal */}
                <AnimatePresence>
                    {isCreateModalOpen && (
                        <>
                            <motion.div
                                className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsCreateModalOpen(false)}
                            />
                            <motion.div
                                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-black border border-white/10 rounded-3xl p-10 z-[110] shadow-[0_0_100px_rgba(255,255,255,0.05)]"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <h2 className="text-3xl font-black tracking-tighter mb-2">New Structure</h2>
                                <p className="text-slate-500 text-sm mb-8">Define the identity for a new PCB configuration.</p>

                                <form onSubmit={handleCreatePcb} className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 ml-1">PCB Label / Code</label>
                                        <input
                                            autoFocus
                                            value={newPcbName}
                                            onChange={(e) => setNewPcbName(e.target.value)}
                                            placeholder="e.g. CORE-V2"
                                            className="w-full bg-transparent border-b border-white/10 focus:border-white py-4 text-xl font-bold tracking-tight outline-none placeholder:text-slate-800 transition-all font-mono uppercase"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Initialize Registry
                                    </button>
                                </form>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Mapping;
