"use client";

import ProfileQRCode from "@/components/ProfileQRCode";
import { BASE_URL } from "@/lib/constants";

interface Props {
  uid: string;
  slug?: string;
  avatarUrl?: string;
  size?: number;
}

export default function ProfileQR({ uid, slug, avatarUrl, size = 120 }: Props) {
  // Ensure the URL is absolute and uses the professional domain
  const identifier = slug || uid;
  const publicUrl = `${BASE_URL}/u/${identifier}`;
  
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
