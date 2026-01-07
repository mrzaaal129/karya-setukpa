import React from 'react';
import { useUser } from '../contexts/UserContext';

const WelcomeBanner: React.FC = () => {
    const { currentUser } = useUser();

    return (
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-2xl overflow-hidden min-h-[320px] flex items-center group">
            {/* Background Effects for Depth */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] mix-blend-overlay"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-[100px] mix-blend-overlay"></div>

                {/* Subtle Pattern */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                </svg>
            </div>

            {/* Content Container */}
            <div className="relative px-12 py-10 w-full flex items-center justify-between z-20">
                {/* Text Background Protection Gradient */}
                <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-blue-900/40 via-blue-800/20 to-transparent z-0 pointer-events-none"></div>

                {/* Left Side - Text Content */}
                <div className="max-w-2xl relative z-10">
                    {/* Status Badge */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-wider backdrop-blur-md shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            SYSTEM ONLINE
                        </div>
                        <div className="h-px w-8 bg-white/30"></div>
                        <div className="text-white/90 text-xs font-medium uppercase tracking-widest drop-shadow-sm">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>

                    {/* Greeting */}
                    <div className="mb-6">
                        <h1 className="text-5xl font-extrabold text-white tracking-tight leading-[1.1] drop-shadow-lg">
                            Selamat Datang, <br />
                            <span className="text-blue-100">
                                {currentUser?.name || 'Super Admin'}
                            </span>
                        </h1>
                    </div>

                    {/* Description */}
                    <p className="text-lg text-white leading-relaxed max-w-lg mb-8 font-normal border-l-4 border-blue-300 pl-4 drop-shadow-md bg-blue-900/10 py-2 rounded-r-lg backdrop-blur-[2px]">
                        Pusat kendali ekosistem pendidikan <strong>SETUKPA</strong>. Kelola data, pantau aktivitas, dan optimalkan kinerja dalam satu dashboard terintegrasi.
                    </p>

                    {/* Logos Section */}
                    <div className="flex items-center gap-6">
                        {/* Logo Setukpa */}
                        <div className="flex items-center gap-3 bg-black/20 hover:bg-black/30 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md transition-all duration-300 group/logo shadow-lg">
                            <img
                                src="/logo_setukpa.png"
                                alt="Logo SETUKPA"
                                className="h-12 w-12 object-contain drop-shadow-md group-hover/logo:scale-110 transition-transform"
                            />
                            <div>
                                <p className="text-white font-bold text-sm leading-none mb-1 drop-shadow-sm">SETUKPA</p>
                                <p className="text-blue-100 text-[10px] uppercase tracking-wider leading-none">Lemdiklat Polri</p>
                            </div>
                        </div>

                        {/* Logo Tribrata */}
                        <div className="flex items-center gap-3 bg-black/20 hover:bg-black/30 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md transition-all duration-300 group/logo shadow-lg">
                            <img
                                src="/logo_tribrata.png"
                                alt="Logo Tribrata"
                                className="h-12 w-12 object-contain drop-shadow-md group-hover/logo:scale-110 transition-transform"
                            />
                            <div>
                                <p className="text-white font-bold text-sm leading-none mb-1 drop-shadow-sm">POLRI</p>
                                <p className="text-blue-100 text-[10px] uppercase tracking-wider leading-none">Tribrata</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Illustration with Seamless Blending */}
                <div className="hidden lg:block absolute right-[-5%] top-[-10%] bottom-[-10%] w-[60%] pointer-events-none z-0">
                    {/* The Image */}
                    <img
                        src="/police_banner.png"
                        alt="Polisi Terpelajar"
                        className="h-full w-full object-cover object-center transform scale-110"
                        style={{
                            maskImage: 'radial-gradient(circle at 70% 50%, black 40%, transparent 95%)',
                            WebkitMaskImage: 'radial-gradient(circle at 70% 50%, black 40%, transparent 95%)'
                        }}
                    />

                    {/* Color Overlay for Tone Matching */}
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-blue-600/10 to-blue-600/60 mix-blend-overlay" style={{
                        maskImage: 'linear-gradient(to right, black 0%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to right, black 0%, transparent 100%)'
                    }}></div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeBanner;
