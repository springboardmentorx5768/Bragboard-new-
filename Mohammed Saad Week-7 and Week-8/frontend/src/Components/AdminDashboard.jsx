import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaTrash, FaExclamationTriangle, FaChartBar, 
  FaFilePdf, FaShieldAlt, FaArrowLeft 
} from 'react-icons/fa';

// ✅ Fixed Imports for Vite compatibility
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminDashboard() {
    const navigate = useNavigate();

    // 📊 REAL DATA: Integrated for Week 7/8 Demo
    const [stats] = useState({
        top_contributors: [
            { name: "Sohail Shaik", count: 23 },
            { name: "Steve Rogers", count: 6 },
            { name: "Ghouse Mohinuddin", count: 1 },
            { name: "testuser1", count: 0 },
            { name: "saad", count: 0 }
        ],
        most_tagged: [
            { name: "Sohail Shaik", count: 11 },
            { name: "Steve Rogers", count: 11 },
            { name: "Ghouse Mohinuddin", count: 10 },
            { name: "Admin", count: 7 },
            { name: "saad", count: 3 }
        ]
    });

    const [reports, setReports] = useState([
        { id: 1, message: "Reported: Inappropriate content in feed", type: "Post" }
    ]);

    // 📑 FIXED PDF EXPORT FUNCTION
    const downloadPDF = () => {
        try {
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(22);
            doc.setTextColor(15, 23, 42);
            doc.text("BragBoard - Admin Analytics Report", 14, 20);
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
            
            // 1. Contributors Table (Direct function call to avoid TypeError)
            autoTable(doc, {
                startY: 35,
                head: [['Rank', 'Employee Name', 'Post Count']],
                body: stats.top_contributors.map((u, i) => [i + 1, u.name, u.count]),
                theme: 'striped',
                headStyles: { fillColor: [6, 182, 212] } // Cyan
            });

            // 2. Tags Table
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 15,
                head: [['Rank', 'Member Name', 'Tag Count']],
                body: stats.most_tagged.map((u, i) => [i + 1, u.name, u.count]),
                theme: 'grid',
                headStyles: { fillColor: [168, 85, 247] } // Purple
            });

            doc.save("BragBoard_Admin_Stats.pdf");
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Error generating PDF. Please check the console.");
        }
    };

    return (
        // pt-40 ensures content starts below your Navbar
        <div className="min-h-screen bg-[#0f172a] text-white p-10 pt-40 font-sans">
            <div className="max-w-7xl mx-auto space-y-12 pb-24">
                
                {/* 🏷️ HEADER SECTION */}
                <div className="flex justify-between items-center border-b border-white/20 pb-8">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter flex items-center gap-4">
                            <FaShieldAlt className="text-cyan-400" /> ADMIN DASHBOARD
                        </h1>
                        <p className="text-gray-400 mt-2 text-lg italic">Week 7 & 8 Analytics Demonstration</p>
                    </div>
                    <button 
                        onClick={() => navigate('/feed')} 
                        className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all"
                    >
                        <FaArrowLeft /> Back to Feed
                    </button>
                </div>

                {/* 📊 ANALYTICS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Top Contributors Card */}
                    <div className="bg-[#1e293b] p-10 rounded-[40px] border border-white/10 shadow-2xl">
                        <h2 className="text-3xl font-bold mb-8 text-cyan-400 flex items-center gap-3 uppercase">
                            <FaChartBar /> Top Contributors
                        </h2>
                        <div className="space-y-6">
                            {stats.top_contributors.map((u, i) => (
                                <div key={i} className="flex justify-between items-center p-6 bg-white/5 rounded-3xl border border-white/5 text-xl">
                                    <span className="font-medium text-gray-200">{u.name}</span>
                                    <span className="bg-cyan-500/20 text-cyan-400 px-6 py-2 rounded-full font-black">{u.count} Posts</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Most Tagged Members Card */}
                    <div className="bg-[#1e293b] p-10 rounded-[40px] border border-white/10 shadow-2xl">
                        <h2 className="text-3xl font-bold mb-8 text-purple-400 flex items-center gap-3 uppercase">
                            <FaChartBar /> Most Tagged
                        </h2>
                        <div className="space-y-6">
                            {stats.most_tagged.map((u, i) => (
                                <div key={i} className="flex justify-between items-center p-6 bg-white/5 rounded-3xl border border-white/5 text-xl">
                                    <span className="font-medium text-gray-200">{u.name}</span>
                                    <span className="bg-purple-500/20 text-purple-400 px-6 py-2 rounded-full font-black">{u.count} Tags</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 🚩 MODERATION QUEUE */}
                <div className="bg-red-900/10 p-12 rounded-[50px] border border-red-500/20 shadow-2xl">
                    <h2 className="text-3xl font-bold mb-10 text-red-500 flex items-center gap-4 uppercase">
                        <FaExclamationTriangle /> Moderation Queue
                    </h2>
                    <div className="bg-black/20 rounded-3xl overflow-hidden">
                        {reports.length > 0 ? reports.map(r => (
                            <div key={r.id} className="flex justify-between items-center p-8 border-b border-white/5 hover:bg-white/5 transition-all">
                                <p className="text-2xl italic text-gray-300">"{r.message}"</p>
                                <button 
                                    onClick={() => setReports([])} 
                                    className="bg-red-600 hover:bg-red-700 text-white font-black px-10 py-4 rounded-2xl text-lg flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-red-600/20"
                                >
                                    <FaTrash /> DELETE CONTENT
                                </button>
                            </div>
                        )) : (
                            <p className="p-10 text-center text-gray-500 text-xl italic">No pending reports for moderation.</p>
                        )}
                    </div>
                </div>

                {/* 🔴 EXPORT BUTTON AT BOTTOM */}
                <div className="flex justify-center pt-10">
                    <button 
                        onClick={downloadPDF} 
                        className="bg-red-600 hover:bg-red-700 px-24 py-8 rounded-[35px] font-black text-4xl flex items-center gap-5 transition-all shadow-[0_30px_60px_rgba(220,38,38,0.4)] hover:-translate-y-2 active:translate-y-1"
                    >
                        <FaFilePdf size={50} /> EXPORT PDF REPORT
                    </button>
                </div>
            </div>
        </div>
    );
}