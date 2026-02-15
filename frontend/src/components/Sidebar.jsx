import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Factory, LogOut, Settings, BarChart3, ChevronLeft, ChevronRight, Layers, ShoppingCart, Building2, Mail, ShieldCheck, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
        { name: 'Inventory', path: '/inventory', icon: <Package size={20} /> },
        { name: 'Production', path: '/production', icon: <Factory size={20} /> },
        { name: 'PCB Mapping', path: '/mapping', icon: <Layers size={20} /> },
        { name: 'Procurement', path: '/procurement', icon: <ShoppingCart size={20} /> },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <motion.div
            className="fixed left-0 top-0 h-full bg-black border-r border-white/5 z-50 flex flex-col selection:bg-white selection:text-black"
            initial={{ width: '5rem' }}
            animate={{ width: isExpanded ? '18rem' : '5rem' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Logo Section */}
            <div className="h-24 flex items-center justify-center border-b border-white/5">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <Settings size={22} />
                </div>
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            className="ml-4 overflow-hidden whitespace-nowrap"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                        >
                            <h1 className="font-black text-xl tracking-tighter text-white uppercase">Electrolyte</h1>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Solutions</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-10 px-3 space-y-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-4 rounded-2xl transition-all duration-300 relative group overflow-hidden ${isActive
                                ? 'text-black'
                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className="relative z-10">{item.icon}</div>
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.span
                                            className="ml-4 font-bold tracking-tight text-sm z-10"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-white z-0"
                                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}

                {/* Corporate Identity Section (Immediately below Procurement) */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mt-6 px-5 py-6 bg-white/[0.03] border border-white/5 rounded-3xl space-y-4 overflow-hidden"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                                    <ShieldCheck size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">ISO 2015:9001</span>
                                </div>
                                <h4 className="text-[11px] font-black text-white uppercase tracking-tighter italic">Electrolyte Solutions</h4>
                                <p className="text-[9px] text-slate-500 leading-relaxed font-medium">An ISO Certified Enterprise</p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <div className="flex items-start gap-3 group">
                                    <Building2 size={12} className="text-slate-600 mt-0.5 group-hover:text-white transition-colors" />
                                    <p className="text-[8px] text-slate-500 leading-relaxed font-medium group-hover:text-slate-400 transition-colors">
                                        Unit 11, Gami Industrial Park, TTC MIDC, Navi Mumbai - 400710
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 group">
                                    <Mail size={12} className="text-slate-600 group-hover:text-white transition-colors" />
                                    <p className="text-[8px] text-slate-500 font-medium group-hover:text-slate-400 transition-colors">contact@electrolytesoln.com</p>
                                </div>
                                <div className="flex items-center gap-2 group">
                                    <FileText size={12} className="text-slate-600 group-hover:text-white transition-colors" />
                                    <p className="text-[8px] text-slate-500 font-mono group-hover:text-slate-400 transition-colors">27AJYPY7934L1ZS</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-4 rounded-2xl text-slate-500 hover:text-red-500 hover:bg-red-500/5 transition-all group"
                >
                    <LogOut size={20} />
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.span
                                className="ml-4 font-bold tracking-tight text-sm"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                            >
                                Sign Out
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.div>
    );
};

export default Sidebar;
