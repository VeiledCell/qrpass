"use client";

import ProfileQRCode from "@/components/ProfileQRCode";

interface Props {
  uid: string;
  slug?: string;
  avatarUrl?: string;
  size?: number;
}

export default function ProfileQR({ uid, slug, avatarUrl, size = 120 }: Props) {
  // Prioritize the slug for the QR code URL, fallback to raw UID
  const identifier = slug || uid;
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${identifier}`;
  
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-[10px] font-black uppercase tracking-widest opacity-30 text-black">Scan Profile</p>
      <div className="p-3 bg-white rounded-3xl shadow-xl">
        <ProfileQRCode 
          profileUrl={publicUrl} 
          photoUrl={avatarUrl}
          size={size}
        />
      </div>
    </div>
  );
}
