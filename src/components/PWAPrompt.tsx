"use client";

import { useEffect, useState } from "react";

export default function PWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect if device is iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Detect if app is already running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if (isIOS && !isStandalone) {
      setShowPrompt(true);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-6 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <div className="bg-white border border-gray-100 shadow-2xl rounded-3xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="text-white font-black text-xl">qr</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-black leading-tight">Install qrPass on your iPhone</p>
          <p className="text-[10px] text-gray-400 font-medium mt-1">
            Tap the <span className="inline-block mx-1"><svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></span> "Share" icon then <span className="font-bold text-black">"Add to Home Screen"</span>.
          </p>
        </div>
        <button 
          onClick={() => setShowPrompt(false)}
          className="text-gray-300 hover:text-black p-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
