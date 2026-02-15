import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, Factory, TrendingUp, Plus } from 'lucide-react';

const FloatingNav = ({ activeSection, scrollToSection, openProduction, openAddComponent }) => {
    const navItems = [
        { id: 'hero', icon: <LayoutDashboard size={20} />, label: 'Overview' },
        { id: 'inventory', icon: <Package size={20} />, label: 'Inventory' },
        { id: 'production', icon: <Factory size={20} />, label: 'Production' },
        { id: 'analytics', icon: <TrendingUp size={20} />, label: 'Analytics' },
    ];

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <motion.div
                className="flex items-center gap-2 px-2 py-2 bg-surface/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, type: "spring" }}
            >
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`relative px-4 py-3 rounded-full flex items-center gap-2 transition-all duration-300 group ${activeSection === item.id ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {item.icon}
                        {activeSection === item.id && (
                            <motion.span
                                layoutId="nav-label"
                                className="text-sm font-medium whitespace-nowrap hidden md:inline-block"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                            >
                                {item.label}
                            </motion.span>
                        )}

                        {/* Tooltip for icon only mode */}
                        {activeSection !== item.id && (
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                                {item.label}
                            </span>
                        )}
                    </button>
                ))}

                <div className="w-px h-6 bg-white/10 mx-2" />

                <button
                    onClick={openProduction}
                    className="p-3 rounded-full bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
                    title="Run Production"
                >
                    <Plus size={20} />
                </button>
            </motion.div>
        </div>
    );
};

export default FloatingNav;
