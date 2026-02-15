import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, TrendingUp, Package, Cpu, ArrowRight, Search,
    Activity, Layers, ShoppingCart, BarChart3, ChevronRight,
    ExternalLink, RefreshCw, Info
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell, CartesianGrid, AreaChart, Area, PieChart, Pie
} from 'recharts';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        lowStockCount: 0,
        totalComponents: 0,
        lowStockItems: [],
        topConsumed: [],
        recentActivity: [],
        productionDistribution: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const statsRes = await api.get('/analytics/dashboard');
            setStats(prev => ({ ...prev, ...statsRes.data }));
        } catch (e) {
            console.error("DASHBOARD: Failed to fetch stats", e);
            showToast("Global Command Sync Failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const consumptionChartData = stats.topConsumed.map(item => ({
        name: item.part_number,
        total: parseFloat(item.total_consumed)
    }));

    return (
        <div className="min-h-screen bg-black text-white flex selection:bg-white selection:text-black font-sans">
            <Sidebar />

            <main className="flex-1 ml-20 p-12 transition-all duration-300">
                <div className="max-w-7xl mx-auto space-y-12">

                    {/* Branding Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6"
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Operations Command Center</span>
                            </div>
                            <h1 className="text-6xl font-black tracking-tighter mb-2 italic">Electrolyte Solutions</h1>
                            <p className="text-slate-500 font-medium">Real-time neural oversight of manufacturing throughput and asset integrity.</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={fetchData}
                                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-slate-400 group"
                            >
                                <RefreshCw size={18} className="group-active:rotate-180 transition-transform duration-500" />
                            </button>
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-4 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                                <Activity size={18} className="text-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">MindMesh</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* High-Level Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <motion.div whileHover={{ y: -5 }} className="portfolite-card p-8 group relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                            <div className="flex flex-col h-full justify-between gap-12 relative z-10">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-slate-400 group-hover:text-white transition-colors">
                                        <Package size={24} />
                                    </div>
                                    <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Global Registry</h3>
                                    <div className="text-6xl font-black tracking-tighter">{stats.totalComponents}</div>
                                </div>
                                <div className="text-xs font-bold text-slate-500">Connected Nodes</div>
                            </div>
                        </motion.div>

                        <motion.div whileHover={{ y: -5 }} className="portfolite-card p-8 group relative bg-red-500/5 border-red-500/20">
                            <div className="flex flex-col h-full justify-between gap-12">
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                                        <AlertTriangle size={24} className="text-red-500" />
                                    </div>
                                    <h3 className="text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Stock Breaches</h3>
                                    <div className="text-6xl font-black tracking-tighter text-red-500">{stats.lowStockCount}</div>
                                </div>
                                <div className="text-xs font-bold text-red-500/60 uppercase tracking-widest">Procure Required</div>
                            </div>
                        </motion.div>

                        <motion.div whileHover={{ y: -5 }} className="portfolite-card p-8 group relative bg-white/[0.03] border-white/10 lg:col-span-2">
                            <div className="flex flex-col h-full justify-between gap-12 relative">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1 group-hover:text-emerald-400 transition-colors">Production Velocity</h3>
                                        <div className="text-6xl font-black tracking-tighter text-white uppercase">
                                            {stats.productionMetrics?.unitsPerHour || 0} <span className="text-xl tracking-normal opacity-50">u/h</span>
                                        </div>
                                    </div>
                                    <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                                        <Layers size={24} className="text-white" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-white font-black text-2xl tracking-tighter italic">
                                        {String(stats.productionMetrics?.activeLines || 0).padStart(2, '0')} Lines Active
                                    </div>
                                    <button
                                        onClick={() => navigate('/production')}
                                        className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                                    >
                                        Live Feed <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Main Intelligence Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* Consumption Analytics (Top Consumed) */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="portfolite-card p-10 bg-white/[0.02]">
                                <div className="flex justify-between items-center mb-12">
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tighter italic uppercase">Consumption Metrics</h2>
                                        <p className="text-sm text-slate-500 font-medium">Accumulated component-wise utilization across all production cycles.</p>
                                    </div>
                                    <BarChart3 size={32} className="text-slate-700 opacity-50" />
                                </div>

                                <div className="h-[350px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={consumptionChartData}
                                            layout="vertical"
                                            margin={{ left: 20, right: 30 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#ffffff', fontSize: 10, fontWeight: 900 }}
                                                width={100}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontWeight: 'bold' }}
                                            />
                                            <Bar dataKey="total" radius={[0, 10, 10, 0]} barSize={30}>
                                                {consumptionChartData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell - ${index} `}
                                                        fill={index === 0 ? '#ffffff' : index === 1 ? '#cbd5e1' : `rgba(255, 255, 255, ${0.1 + (1 / (index + 2))})`}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Fleet Distribution (By PCB Type) */}
                            <div className="portfolite-card p-10">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-xl font-black tracking-tight flex items-center gap-3 italic uppercase">
                                        <Layers size={20} className="text-emerald-500" />
                                        Fleet Distribution
                                    </h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Total Units: {stats.productionDistribution?.reduce((acc, curr) => acc + parseInt(curr.total_units), 0) || 0}</span>
                                </div>

                                <div className="space-y-6">
                                    {!stats.productionDistribution || stats.productionDistribution.length === 0 ? (
                                        <div className="py-12 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">No Production Data Synced</div>
                                    ) : (
                                        stats.productionDistribution.map((item, idx) => {
                                            const total = stats.productionDistribution.reduce((acc, curr) => acc + parseInt(curr.total_units), 0);
                                            const percentage = ((parseInt(item.total_units) / total) * 100).toFixed(1);

                                            return (
                                                <div key={idx} className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <div className="text-white font-black text-sm tracking-tight">{item.pcb_name}</div>
                                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.total_units} Units Mapped</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-emerald-500 font-black text-lg tracking-tighter">{percentage}%</div>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}%` }}
                                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Critical Sidebar (Low Stock) */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="portfolite-card p-8 border-red-500/20 relative overflow-hidden h-full flex flex-col">
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                </div>

                                <div className="mb-10">
                                    <h2 className="text-2xl font-black tracking-tighter uppercase mb-2 italic">Critical Low Stock</h2>
                                    <p className="text-xs text-slate-500 font-medium">Neural triggers identified components below safety limits.</p>
                                </div>

                                <div className="space-y-4 flex-1 overflow-y-auto max-h-[800px] pr-2">
                                    {stats.lowStockItems.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30">
                                            <Package size={48} className="mb-4" />
                                            <div className="font-bold text-sm tracking-widest uppercase">Nodes Stable</div>
                                        </div>
                                    ) : (
                                        stats.lowStockItems.map((item, idx) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="p-5 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/10 transition-all"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-white text-md tracking-tight">{item.name}</h4>
                                                        <p className="text-[10px] text-slate-500 font-mono uppercase">{item.part_number}</p>
                                                    </div>
                                                    <div className="px-2 py-1 bg-red-500/20 text-red-500 rounded-md text-[9px] font-black uppercase tracking-widest">
                                                        ALERT
                                                    </div>
                                                </div>

                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <div className="text-xs text-slate-600 font-bold uppercase tracking-widest mb-1">Stock Level</div>
                                                        <div className="text-2xl font-black tracking-tighter text-red-500 font-mono">
                                                            {item.stock_quantity} <span className="text-[10px] text-slate-700">/ {item.low_stock_threshold}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => navigate('/procurement')}
                                                        className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                                    >
                                                        <ShoppingCart size={16} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/10">
                                    <button
                                        onClick={() => navigate('/procurement')}
                                        className="w-full py-4 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-white hover:border-white/30 transition-all group"
                                    >
                                        Open Supply Chain Manager
                                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;
