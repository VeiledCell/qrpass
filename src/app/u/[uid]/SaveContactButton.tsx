"use client";

import { useState } from "react";
import { UserProfile } from "@/lib/models";
import { BASE_URL } from "@/lib/constants";

interface Props {
  user: UserProfile;
  accentColor: string;
  isBold: boolean;
}

export default function SaveContactButton({ user, accentColor, isBold }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const imageUrlToBase64 = async (url: string): Promise<string | null> => {
    try {
      console.log("Fetching vCard Image:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Image fetch failed");
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        const objectUrl = URL.createObjectURL(blob);
        
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const SIZE = 180; // Optimized size for iOS vCard
          canvas.width = SIZE;
          canvas.height = SIZE;
          const ctx = canvas.getContext("2d");
          
          let sX = 0, sY = 0, sW = img.width, sH = img.height;
          if (img.width > img.height) { sW = img.height; sX = (img.width - img.height) / 2; } 
          else { sH = img.width; sY = (img.height - img.width) / 2; }
          
          ctx?.drawImage(img, sX, sY, sW, sH, 0, 0, SIZE, SIZE);
          
          const dataURL = canvas.toDataURL("image/jpeg", 0.5); // High compression for reliable loading
          URL.revokeObjectURL(objectUrl);
          resolve(dataURL.split(",")[1]);
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
        
        img.src = objectUrl;
      });
    } catch (e) {
      console.error("VCard Image Error:", e);
      return null;
    }
  };

  const downloadVCard = async () => {
    setIsGenerating(true);
    
    // 1. NAME PARSING
    const fullName = user.displayName.trim();
    let firstName = "";
    let lastName = "";
    let suffix = "";

    if (fullName.includes(",")) {
      const [namePart, suffixPart] = fullName.split(",").map(s => s.trim());
      suffix = suffixPart;
      const nameBits = namePart.split(/\s+/);
      firstName = nameBits[0] || "";
      lastName = nameBits.slice(1).join(" ");
    } else {
      const nameBits = fullName.split(/\s+/);
      firstName = nameBits[0] || "";
      lastName = nameBits.slice(1).join(" ");
    }

    // 2. PRIMARY ROLE
    const primaryRole = (user.roles && user.primaryRoleIndex !== undefined) 
      ? user.roles[user.primaryRoleIndex] 
      : (user.roles && user.roles.length > 0) ? user.roles[0] : { jobTitle: user.jobTitle || "", company: user.company || "" };

    // 3. IMAGE
    let photoBase64 = null;
    if (user.avatarUrl) {
      photoBase64 = await imageUrlToBase64(user.avatarUrl);
    }

    // 4. URL
    const identifier = user.slug || user.uid;
    const profileUrl = `${BASE_URL}/u/${identifier}`;

    // 5. VCARD CONSTRUCTION (vCard 2.1 is actually more reliable for photo base64 on many iOS versions)
    let vCard = `BEGIN:VCARD\r\n`;
    vCard += `VERSION:2.1\r\n`;
    vCard += `FN:${fullName}\r\n`;
    vCard += `N:${lastName};${firstName};;;${suffix}\r\n`;
    if (primaryRole.jobTitle) vCard += `TITLE:${primaryRole.jobTitle}\r\n`;
    if (primaryRole.company) vCard += `ORG:${primaryRole.company}\r\n`;
    if (user.phone) vCard += `TEL;CELL;VOICE:${user.phone}\r\n`;
    if (user.email) vCard += `EMAIL;PREF;INTERNET:${user.email}\r\n`;
    if (user.bio) vCard += `NOTE:${user.bio.replace(/\n/g, " ")}\r\n`;
    vCard += `URL;WORK:${profileUrl}\r\n`;

    if (photoBase64) {
      vCard += `PHOTO;JPEG;ENCODING=BASE64:\r\n`;
      // Manual folding for 2.1 compliance (72 chars + space)
      const lines = photoBase64.match(/.{1,72}/g) || [];
      lines.forEach(line => {
        vCard += ` ${line}\r\n`;
      });
      vCard += `\r\n`;
    }

    vCard += `END:VCARD`;

    const blob = new Blob([vCard], { type: "text/vcard;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement("a"));
    link.href = url;
    link.setAttribute("download", `${fullName.replace(/[\s,]+/g, "_")}.vcf`);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    setIsGenerating(false);
  };

  return (
    <button
      onClick={downloadVCard}
      disabled={isGenerating}
      className="px-10 py-4 rounded-full font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50 text-white"
      style={{
        backgroundColor: accentColor,
      }}
    >
      {isGenerating ? "Preparing..." : "Save to Contacts"}
    </button>
  );
}
