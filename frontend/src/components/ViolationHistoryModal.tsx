import React from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Violation {
    id: string;
    type: string;
    description?: string;
    createdAt: string;
    resolved: boolean;
}

interface ViolationHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    violations: Violation[];
    violationThreshold: number;
}

const ViolationHistoryModal: React.FC<ViolationHistoryModalProps> = ({
    isOpen,
    onClose,
    violations,
    violationThreshold
}) => {
    if (!isOpen) return null;

    // Filter only active violations for the lock count
    const activeViolations = violations.filter(v => !v.resolved);
    const violationCount = activeViolations.length;
    const isLocked = violationCount >= violationThreshold;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-red-100">
                <div className="bg-red-50 p-6 text-center border-b border-red-100">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Peringatan Pelanggaran</h3>
                    <p className="text-sm text-gray-600 mt-2">
                        Anda terdeteksi melakukan aktivitas mencurigakan.
                        <br />
                        <span className="font-semibold text-red-600">
                            Pelanggaran Aktif: {violationCount} / {violationThreshold}
                        </span>
                    </p>
                </div>

                <div className="p-4 max-h-60 overflow-y-auto bg-gray-50">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Histori Aktivitas</h4>

                    {violations.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 italic">Belum ada pelanggaran tercatat.</p>
                    ) : (
                        <div className="space-y-3">
                            {violations.map((v, idx) => {
                                const isResolved = v.resolved;
                                return (
                                    <div key={v.id} className={`p-3 rounded-lg border shadow-sm flex gap-3 ${isResolved ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-red-100'}`}>
                                        <div className="font-bold text-gray-400 text-sm">#{violations.length - idx}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div className={`text-sm font-bold ${isResolved ? 'text-gray-600 line-through' : 'text-gray-800'}`}>{v.type}</div>
                                                {isResolved && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">RESET</span>}
                                            </div>
                                            <div className="text-xs text-gray-500">{v.description || 'Tidak ada keterangan'}</div>
                                        </div>
                                        <div className="text-[10px] text-gray-400 flex items-center gap-1 self-start">
                                            <Clock size={10} />
                                            {format(new Date(v.createdAt), 'HH:mm:ss', { locale: idLocale })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-white">
                    {isLocked ? (
                        <div className="text-center">
                            <p className="text-red-600 font-bold mb-3 text-sm">Akses Editor Terkunci.</p>
                            <button
                                disabled
                                className="w-full py-2.5 bg-gray-300 text-gray-600 font-bold rounded-xl cursor-not-allowed"
                            >
                                Hubungi Pengawas
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-200"
                        >
                            Saya Mengerti
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViolationHistoryModal;
