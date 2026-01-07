import React from 'react';
import { motion } from 'framer-motion';

interface WelcomeBannerProps {
    userName: string;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ userName }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full rounded-2xl overflow-hidden shadow-2xl mb-8 group"
        >
            {/* Background Image Container */}
            <div className="relative h-64 md:h-80 w-full">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
                    style={{
                        backgroundImage: `url('/police_banner.png')`,
                    }}
                />

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A]/90 via-[#1E3A8A]/70 to-transparent flex items-center">
                    <div className="p-8 md:p-12 max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <span className="inline-block px-4 py-1.5 mb-4 rounded-full bg-[#D4AF37] text-[#1E3A8A] font-bold text-sm tracking-wide uppercase shadow-lg">
                                System Online • {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>

                            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                                Selamat Datang,<br />
                                <span className="text-[#D4AF37]">{userName}</span>
                            </h1>

                            <p className="text-gray-100 text-lg md:text-xl font-light leading-relaxed max-w-lg">
                                Pusat kendali ekosistem pendidikan <span className="font-bold">SETUKPA</span>.
                                Kelola data, pantau aktivitas, dan optimalkan kinerja dalam satu dashboard terintegrasi.
                            </p>

                            <div className="mt-8 flex gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                                    <img src="/logo_setukpa.png" alt="Setukpa" className="h-8 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    <div className="text-white text-xs">
                                        <div className="font-bold">SETUKPA</div>
                                        <div className="opacity-75">LEMDIKLAT POLRI</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                                    <img src="/logo_tribrata.png" alt="Tribrata" className="h-8 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    <div className="text-white text-xs">
                                        <div className="font-bold">POLRI</div>
                                        <div className="opacity-75">TRIBRATA</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default WelcomeBanner;
