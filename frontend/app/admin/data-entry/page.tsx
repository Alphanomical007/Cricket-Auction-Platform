"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

function parseCSVLine(line: string) {
  // Simple tab or comma separation parser
  let cols: string[] = [];
  if (line.includes("\t")) {
    cols = line.split("\t");
  } else {
    cols = line.split(",");
  }
  return cols.map((c) => c.trim().replace(/^"|"$/g, ""));
}

export default function DataEntryPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [singleForm, setSingleForm] = useState({
    name: "", email: "", phone: "", batting: "5", bowling: "5", fielding: "5"
  });
  const [bulkCsv, setBulkCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err", text: string } | null>(null);

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        users: [{
          name: singleForm.name,
          email: singleForm.email,
          phone: singleForm.phone || null,
          batting_rating: parseFloat(singleForm.batting),
          bowling_rating: parseFloat(singleForm.bowling),
          fielding_rating: parseFloat(singleForm.fielding),
        }]
      };
      const { data } = await api.post("/admin/users/bulk", payload);
      if (data.created > 0) flash("ok", `User created successfully!`);
      else flash("err", "User email already exists!");
      
      setSingleForm({ name: "", email: "", phone: "", batting: "5", bowling: "5", fielding: "5" });
    } catch (err: any) {
      flash("err", err.response?.data?.detail || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkCsv.trim()) return;
    setLoading(true);
    try {
      const lines = bulkCsv.split("\n").filter(l => l.trim().length > 0);
      const users = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cols = parseCSVLine(line);
        // Header skip logic: if first line contains "email" ignore it
        if (i === 0 && cols.join("").toLowerCase().includes("email")) continue;

        if (cols.length >= 2) {
          const email = cols[1];
          if (!email || !email.includes("@")) continue; // basic validation
          
          users.push({
            name: cols[0] || "Unknown",
            email: email.toLowerCase(),
            phone: cols[2] || null,
            batting_rating: parseFloat(cols[3]) || 5.0,
            bowling_rating: parseFloat(cols[4]) || 5.0,
            fielding_rating: parseFloat(cols[5]) || 5.0,
            profile_photo: cols[6] || null,
          });
        }
      }

      if (users.length === 0) {
        flash("err", "Could not parse valid users. Make sure column 2 is an email.");
        setLoading(false);
        return;
      }

      const { data } = await api.post("/admin/users/bulk", { users });
      flash("ok", `Successfully imported ${data.created} new users. (Skipped ${data.skipped} duplicates)`);
      setBulkCsv("");
    } catch (err: any) {
      flash("err", err.response?.data?.detail || "Failed to bulk import users.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-950">
      <div className="max-w-4xl mx-auto animate-slide-up">
        <div className="flex items-center justify-between mb-8 animate-fade-in-down" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-gray-500 hover:text-white text-sm transition-colors duration-300">
              ← Dashboard
            </a>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">Data Entry / Import</h1>
          </div>
        </div>

        {msg && (
          <div className={`rounded-lg p-4 mb-6 text-sm flex items-center gap-2 animate-fade-in ${msg.type === "ok" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
            {msg.type === "ok" ? "✅" : "⚠️"} {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-6 border-b border-gray-800 pb-2 relative">
          <button
            className={`px-4 py-2 font-medium text-sm transition-all duration-300 relative ${tab === "single" ? "text-amber-400 scale-105" : "text-gray-400 hover:text-gray-200"}`}
            onClick={() => setTab("single")}
          >
            Create Player / User
            <span className={`absolute bottom-[-10px] left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300 ${tab === "single" ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`} />
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm transition-all duration-300 relative ${tab === "bulk" ? "text-amber-400 scale-105" : "text-gray-400 hover:text-gray-200"}`}
            onClick={() => setTab("bulk")}
          >
            Bulk Spreadsheet Import
            <span className={`absolute bottom-[-10px] left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300 ${tab === "bulk" ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`} />
          </button>
        </div>

        <div className="relative overflow-hidden rounded-xl">
        {/* Single Entry Tab */}
        {tab === "single" && (
          <div className="card border-t border-amber-500/20 animate-fade-in hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-shadow duration-500">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><span>👤</span> Create Single Profile</h2>
            <p className="text-sm text-gray-500 mb-6">Create a user manually so you can add them to an event right away.</p>
            
            <form onSubmit={handleSingleSubmit} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="group">
                  <label htmlFor="name" className="label group-focus-within:text-amber-400 transition-colors">Full Name *</label>
                  <input
                    id="name"
                    type="text" className="input focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all duration-300" placeholder="Rahul Dravid" required
                    value={singleForm.name} onChange={e => setSingleForm({...singleForm, name: e.target.value})}
                  />
                </div>
                <div className="group">
                  <label htmlFor="email" className="label group-focus-within:text-amber-400 transition-colors">Email Address *</label>
                  <input
                    id="email"
                    type="email" className="input focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all duration-300" placeholder="rahul@example.com" required
                    value={singleForm.email} onChange={e => setSingleForm({...singleForm, email: e.target.value})}
                  />
                </div>
                <div className="sm:col-span-2 group">
                  <label htmlFor="phone" className="label group-focus-within:text-amber-400 transition-colors">Phone (Optional)</label>
                  <input
                    id="phone"
                    type="text" className="input focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all duration-300" placeholder="+91 9876543210"
                    value={singleForm.phone} onChange={e => setSingleForm({...singleForm, phone: e.target.value})}
                  />
                </div>
                <div className="group hover:bg-white/5 p-3 -m-3 rounded-lg transition-colors duration-300">
                  <label htmlFor="batting" className="label group-focus-within:text-amber-400 transition-colors">🏏 Batting (1-10)</label>
                  <input
                    id="batting"
                    type="number" step="0.1" min="1" max="10" className="input focus:border-amber-500/50 transition-all duration-300" required
                    value={singleForm.batting} onChange={e => setSingleForm({...singleForm, batting: e.target.value})}
                  />
                </div>
                <div className="group hover:bg-white/5 p-3 -m-3 rounded-lg transition-colors duration-300">
                  <label htmlFor="bowling" className="label group-focus-within:text-amber-400 transition-colors">🥎 Bowling (1-10)</label>
                  <input
                    id="bowling"
                    type="number" step="0.1" min="1" max="10" className="input focus:border-amber-500/50 transition-all duration-300" required
                    value={singleForm.bowling} onChange={e => setSingleForm({...singleForm, bowling: e.target.value})}
                  />
                </div>
                <div className="group hover:bg-white/5 p-3 -m-3 rounded-lg transition-colors duration-300">
                  <label htmlFor="fielding" className="label group-focus-within:text-amber-400 transition-colors">🏃 Fielding (1-10)</label>
                  <input
                    id="fielding"
                    type="number" step="0.1" min="1" max="10" className="input focus:border-amber-500/50 transition-all duration-300" required
                    value={singleForm.fielding} onChange={e => setSingleForm({...singleForm, fielding: e.target.value})}
                  />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={loading} className="btn-primary px-8 hover:scale-105 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95">
                  {loading ? <span className="animate-pulse">Creating...</span> : "Create User"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Upload Tab */}
        {tab === "bulk" && (
          <div className="card space-y-4 border-t border-blue-500/20 animate-fade-in hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-shadow duration-500">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><span>📋</span> Bulk Player CSV Import</h2>
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm p-4 rounded-xl shadow-inner">
              <p className="font-semibold mb-1 flex items-center gap-2"><span className="animate-bounce">💡</span> Expected Format (Comma or Tab separated):</p>
              <code className="block mt-2 bg-black/30 p-2 rounded text-blue-200 border border-blue-500/10">Name | Email | Phone | Batting (1-10) | Bowling (1-10) | Fielding (1-10) | Profile Photo URL</code>
              <p className="mt-3 text-xs opacity-80">Note: You can copy and paste directly from Microsoft Excel or Google Sheets here.</p>
            </div>
            
            <div className="group">
              <label htmlFor="bulkCsv" className="label leading-relaxed group-focus-within:text-blue-400 transition-colors">Paste CSV Data here</label>
              <textarea
                id="bulkCsv"
                className="input font-mono text-sm leading-relaxed focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-300 bg-gray-950/50"
                rows={12}
                placeholder={"Example:\nVirat Kohli, virat@bcci.in, 9876543210, 9.5, 4.0, 8.5\nMS Dhoni, dhoni@bcci.in, 9999999999, 9.8, 2.0, 9.0"}
                value={bulkCsv}
                onChange={e => setBulkCsv(e.target.value)}
              />
            </div>
            <div className="pt-4 flex items-center justify-between">
              <button 
                type="button" 
                onClick={handleBulkSubmit}
                disabled={loading || !bulkCsv.trim()} 
                className="w-full sm:w-auto px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2.5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {loading ? <span className="animate-pulse flex items-center gap-2">⚙️ Processing...</span> : "🚀 Import Users"}
              </button>
              <p className="text-xs text-gray-500 ml-4 italic">
                Users will get a default password <code className="bg-gray-800 px-1 rounded">password123</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
