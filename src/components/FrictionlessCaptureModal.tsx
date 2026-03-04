"use client";

import { useState, useRef, useEffect } from "react";
import { useAmbientContext } from "@/hooks/useAmbientContext";
import { saveEncounter } from "@/lib/crm";
import { auth } from "@/lib/firebase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scannedUserId?: string;
}

const DEFAULT_CHIPS = ["Hospital", "Conference", "Coffee", "Project Sync", "Follow-up"];

export default function FrictionlessCaptureModal({ isOpen, onClose, scannedUserId }: Props) {
  const { captureContext, loading: capturingContext } = useAmbientContext();
  const [context, setContext] = useState<any>(null);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
      handleCaptureContext();
    }
  }, [isOpen]);

  const handleCaptureContext = async () => {
    const data = await captureContext();
    setContext(data);
  };

  const toggleChip = (chip: string) => {
    setSelectedChips(prev => 
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        handleTranscription(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic Error:", err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    const formData = new FormData();
    formData.append("file", blob);

    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.text) {
        setTranscription(prev => prev + (prev ? " " : "") + data.text);
      }
    } catch (err) {
      console.error("Transcription Failed:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsSaving(true);
    try {
      await saveEncounter(user.uid, {
        scannedUserId,
        location: context?.location || { lat: 0, lng: 0, city: "Unknown" },
        contextChips: selectedChips,
        transcription: transcription.trim() || undefined,
      });
      onClose();
      // Reset state
      setSelectedChips([]);
      setTranscription("");
      setContext(null);
    } catch (err) {
      alert("Failed to save encounter.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Header: Ambient Status */}
        <div className="bg-gray-50 p-8 border-b border-gray-100 flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Context Captured</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${capturingContext ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
              <p className="font-bold text-sm">
                {context?.location?.city || "Detecting Location..."}
              </p>
            </div>
            <p className="text-[10px] font-medium text-gray-400">
              {context?.timestamp ? new Date(context.timestamp).toLocaleTimeString() : "Syncing Time..."}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-black transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Quick Chips */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Quick Context</p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => toggleChip(chip)}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                    selectedChips.includes(chip) 
                    ? 'bg-black text-white shadow-lg scale-105' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Input */}
          <div className="space-y-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Voice Dictation</p>
            <div className="flex flex-col items-center gap-4">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isRecording 
                  ? 'bg-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
                  : 'bg-black shadow-xl hover:scale-105'
                }`}
              >
                {isRecording ? (
                  <div className="flex gap-1">
                    <span className="w-1 h-4 bg-white animate-bounce"></span>
                    <span className="w-1 h-6 bg-white animate-bounce delay-75"></span>
                    <span className="w-1 h-4 bg-white animate-bounce delay-150"></span>
                  </div>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 2 9 18zm0 0v-8" /></svg>
                )}
              </button>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                {isRecording ? "Listening..." : "Hold to Record Notes"}
              </p>
            </div>

            {/* Transcription Preview */}
            {(transcription || isTranscribing) && (
              <div className="mt-4 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 text-left">
                <p className="text-xs font-medium text-blue-900 leading-relaxed italic">
                  {isTranscribing ? "Processing audio..." : `"${transcription}"`}
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving || capturingContext}
            className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:bg-gray-200"
          >
            {isSaving ? "Archiving Record..." : "Confirm & Save Encounter"}
          </button>
        </div>
      </div>
    </div>
  );
}
