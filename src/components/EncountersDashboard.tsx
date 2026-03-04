"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { Encounter } from "@/lib/models";
import FrictionlessCaptureModal from "./FrictionlessCaptureModal";

interface Props {
  uid: string;
}

export default function EncountersDashboard({ uid }: Props) {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEncounters();
  }, [uid]);

  const fetchEncounters = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users", uid, "encounters"),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: (doc.data().timestamp as Timestamp).toDate()
      })) as Encounter[];
      setEncounters(data);
    } catch (error) {
      console.error("Error fetching encounters:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* CRM Actions */}
      <div className="flex justify-between items-center bg-white border border-[#E1E3E5] p-8 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1A1C1E]">RELATIONSHIP MANAGER</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Archived Encounters & Session Notes</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
        >
          + Log New Encounter
        </button>
      </div>

      {/* Encounters List */}
      <div className="bg-white border border-[#E1E3E5] rounded-xl overflow-hidden shadow-sm">
        <div className="bg-[#F1F3F5] px-8 py-4 border-b border-[#E1E3E5]">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Recent Activity Logs</h2>
        </div>
        
        {loading ? (
          <div className="p-20 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Retrieving Records...</div>
        ) : encounters.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">No Encounters Logged</p>
            <button onClick={() => setIsModalOpen(true)} className="text-xs font-bold text-blue-600 underline">Start your first log</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {encounters.map((encounter) => (
              <div key={encounter.id} className="p-8 hover:bg-gray-50 transition-colors group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                      {encounter.timestamp.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    <h3 className="text-lg font-bold text-[#1A1C1E]">{encounter.location.city}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {encounter.contextChips.map(chip => (
                      <span key={chip} className="px-3 py-1 bg-gray-100 text-[9px] font-black uppercase tracking-tighter text-gray-500 rounded-md">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
                {encounter.transcription && (
                  <div className="p-4 bg-[#F8F9FA] rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-gray-600 italic leading-relaxed">"{encounter.transcription}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <FrictionlessCaptureModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchEncounters();
        }} 
      />
    </div>
  );
}
