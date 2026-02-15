import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ArrowRight, Lock, User, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 selection:bg-white selection:text-black">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[440px] space-y-12"
            >
                {/* Brand Identity */}
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                        <Package className="text-black" size={32} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-bold tracking-tighter">Electrolyte</h1>
                        <p className="text-slate-500 font-medium">Solutions & Industrial Intelligence</p>
                    </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Access Identity</label>
                            <div className="relative group">
                                <User className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-white transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    className="w-full bg-transparent border-b border-white/10 focus:border-white py-4 pl-8 text-lg font-bold outline-none placeholder:text-slate-800 transition-all font-sans"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Passkey</label>
                            <div className="relative group">
                                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-white transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-transparent border-b border-white/10 focus:border-white py-4 pl-8 text-lg font-bold outline-none placeholder:text-slate-800 transition-all font-sans"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm font-medium flex items-center gap-3"
                        >
                            <ShieldCheck size={18} />
                            {error}
                        </motion.div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full py-5 bg-white text-black rounded-3xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Establish Connection'}
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                {/* Footer Hint */}
                <p className="text-center text-slate-600 text-sm">
                    Protected by Industrial-Grade Encryption.
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
