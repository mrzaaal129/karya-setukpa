import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import LoginHero from '../assets/login-hero-latest.png';

const Login: React.FC = () => {
    const [nosis, setNosis] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(nosis.trim(), password);
            setNosis('');
            setPassword('');
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login gagal. Periksa kembali NOSIS dan password Anda.');
            setPassword('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden relative">

            {/* 1. Rich Corporate Background */}
            <div className="absolute inset-0 z-0 bg-slate-50">
                {/* Mesh Gradients - Dynamic & Colorful but Elegant */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-indigo-500/20 rounded-full blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-amber-400/10 rounded-full blur-[80px] mix-blend-multiply" />

                {/* Subtle Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#1e40af 1px, transparent 1px), linear-gradient(90deg, #1e40af 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            </div>

            {/* 2. Main Glassmorphism Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-6xl bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-2xl shadow-blue-900/10 border border-white/50 overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[600px] md:h-[650px]"
            >
                {/* Left Side - Login Form (Professional & Compact) */}
                <div className="w-full md:w-[42%] p-10 lg:p-14 flex flex-col justify-center relative z-20">

                    <div className="mb-10">
                        {/* Logo Header with Glass Badge */}
                        <div className="inline-flex items-center gap-3 mb-8 px-4 py-2 bg-white/50 rounded-2xl border border-white/60 shadow-sm backdrop-blur-sm">
                            <img src="/logo_setukpa.png" alt="Logo Setukpa" className="w-10 h-10 object-contain" />
                            <div className="h-6 w-px bg-slate-300 mx-1"></div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-slate-800 leading-none tracking-tight">SETUKPA</span>
                                <span className="text-[9px] font-bold text-blue-600 tracking-widest uppercase mt-0.5">Lemdiklat Polri</span>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                                Selamat Datang
                            </h2>
                            <p className="text-slate-500 text-base leading-relaxed">
                                Sistem Manajemen Makalah Digital.<br />
                                <span className="text-blue-600 font-medium">Karya Setukpa</span> - Profesional & Akuntabel.
                            </p>
                        </motion.div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-50/50 backdrop-blur-sm text-red-600 text-xs font-semibold px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2"
                                >
                                    <ShieldCheck className="w-4 h-4" /> {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-5">
                            <div className="group">
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider ml-1">NOSIS / ID Pengguna</label>
                                <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-1">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <input
                                        id="nosis"
                                        name="nosis"
                                        type="text"
                                        value={nosis}
                                        onChange={(e) => setNosis(e.target.value)}
                                        autoComplete="off"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all duration-300 text-slate-800 text-sm font-semibold placeholder-slate-400 shadow-sm"
                                        placeholder="Masukkan ID Anda"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider ml-1">Kata Sandi</label>
                                <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-1">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="new-password"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all duration-300 text-slate-800 text-sm font-semibold placeholder-slate-400 shadow-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(37, 99, 235, 0.3)" }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed text-sm tracking-wide relative overflow-hidden group"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {loading ? 'Memproses...' : 'Masuk ke Sistem'} {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                                </span>
                                {/* Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]" />
                            </motion.button>
                        </div>
                    </form>

                    <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                        <span>© 2024 Setukpa Lemdiklat Polri</span>
                        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> Secure Panel</span>
                    </div>
                </div>

                {/* Right Side - Vibrant Illustration Container (58%) */}
                <div className="w-full md:w-[58%] relative overflow-hidden hidden md:flex items-end justify-center">

                    {/* Elegant Typography Filler for Empty Space */}
                    <div className="absolute top-[12%] w-full flex flex-col items-center z-20 select-none pointer-events-none">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="text-5xl lg:text-7xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-blue-900/10 to-transparent opacity-50"
                        >
                            KARYA
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            className="flex items-center gap-4 mt-[-10px]"
                        >
                            <div className="h-[1px] w-16 bg-blue-900/20"></div>
                            <span className="text-xl font-bold tracking-[0.5em] text-blue-900/40 uppercase">SETUKPA</span>
                            <div className="h-[1px] w-16 bg-blue-900/20"></div>
                        </motion.div>
                    </div>

                    {/* Dynamic Abstract Shapes for Color Pop */}
                    <div className="absolute inset-0 bg-blue-50/30">
                        <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full blur-[100px] opacity-20" />
                        <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-white to-transparent z-10" />
                    </div>

                    {/* Premium Wave Separator */}
                    <div className="absolute inset-y-0 left-[-1px] w-32 z-20">
                        <svg className="h-full w-full" viewBox="0 0 100 800" preserveAspectRatio="none">
                            <path d="M0,0 L0,800 C60,600 90,400 30,200 C0,100 40,50 0,0 Z" fill="rgba(255,255,255,0.8)" />
                            {/* Glass Overlay on Wave */}
                            <path d="M0,0 L0,800 C60,600 90,400 30,200 C0,100 40,50 0,0 Z" fill="url(#glass-gradient)" style={{ backdropFilter: 'blur(10px)' }} />
                            <defs>
                                <linearGradient id="glass-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    {/* The Illustration */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative z-10 w-full h-full flex items-end justify-center"
                    >
                        {/* Accent Glow Circle behind characters */}
                        <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-100/50 rounded-full blur-[60px]" />

                        <div className="relative w-[120%] h-[110%] flex items-end justify-center pb-0">
                            <img
                                src={LoginHero}
                                alt="Ilustrasi"
                                className="w-full h-full object-contain object-bottom drop-shadow-2xl"
                                style={{
                                    mixBlendMode: 'multiply', // Still key for transparency
                                    filter: 'contrast(1.05) saturate(1.1)'
                                }}
                            />
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
