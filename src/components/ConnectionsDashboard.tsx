"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { ConnectionProfile } from "@/lib/models";

interface Props { uid: string; }

export default function ConnectionsDashboard({ uid }: Props) {
  const [connections, setConnections] = useState<ConnectionProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, [uid]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users", uid, "connections"), orderBy("lastEncounterAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
        lastEncounterAt: (doc.data().lastEncounterAt as Timestamp)?.toDate() || new Date(),
      })) as ConnectionProfile[];
      setConnections(data);
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white border border-[#E1E3E5] p-8 rounded-xl shadow-sm text-black flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase">Connection Intelligence</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Master Rolodex & Reconnect Facilitator</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{connections.length} Established Nodes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Synchronizing Network Data...</div>
        ) : connections.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white border border-dashed border-gray-200 rounded-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">No Connection Profiles Formed</p>
            <p className="text-xs text-gray-400 mt-2">Link an encounter to a profile to start your network.</p>
          </div>
        ) : (
          connections.map((conn) => (
            <div key={conn.id} className="bg-white border border-[#E1E3E5] p-6 rounded-xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-[#1A1C1E]">{conn.name}</h3>
                  {conn.company && <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{conn.jobTitle} @ {conn.company}</p>}
                </div>
                
                <div className="flex flex-col gap-2">
                  {conn.email && (
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {conn.email}
                    </div>
                  )}
                  {conn.linkedIn && (
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-4 2.239-4 5v14c0 2.761 2.239 4 4 4h14c2.761 0 4-2.239 4-4v-14c0-2.761-2.239-4-4-4zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                      LinkedIn Profile
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Last Encounter</p>
                    <p className="text-[10px] font-bold text-gray-500">{conn.lastEncounterAt.toLocaleDateString()}</p>
                  </div>
                  <button className="px-4 py-2 bg-gray-50 hover:bg-[#1A1C1E] hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Reconnect</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
