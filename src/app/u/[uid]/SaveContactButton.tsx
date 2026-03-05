"use client";

import { useState } from "react";
import { UserProfile } from "@/lib/models";

interface Props {
  user: UserProfile;
  accentColor: string;
  isBold: boolean;
}

export default function SaveContactButton({ user, accentColor, isBold }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const imageUrlToBase64 = async (url: string): Promise<string | null> => {
    try {
      console.log("Attempting to fetch image for vCard:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Fetch failed");
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Essential for CORS
        const objectUrl = URL.createObjectURL(blob);
        
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataURL = canvas.toDataURL("image/jpeg", 0.7); // Slightly more compression for mobile
          URL.revokeObjectURL(objectUrl);
          resolve(dataURL.split(",")[1]);
        };
        
        img.onerror = (e) => {
          console.error("Image loading error - likely CORS:", e);
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
        
        img.src = objectUrl;
      });
    } catch (e) {
      console.error("VCard Image Fetch Error (CORS?):", e);
      return null;
    }
  };

  const downloadVCard = async () => {
    setIsGenerating(true);
    
    const nameParts = user.displayName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

    let photoBase64 = null;
    if (user.avatarUrl) {
      photoBase64 = await imageUrlToBase64(user.avatarUrl);
    }

    // VERSION 2.1 is significantly more reliable for iOS photo embedding
    const vCardLines = [
      "BEGIN:VCARD",
      "VERSION:2.1",
      `FN:${user.displayName}`,
      `N:${lastName};${firstName};;;`,
      user.jobTitle ? `TITLE:${user.jobTitle}` : "",
      user.company ? `ORG:${user.company}` : "",
      user.phone ? `TEL;CELL;VOICE:${user.phone}` : "",
      user.email ? `EMAIL;PREF;INTERNET:${user.email}` : "",
      user.bio ? `NOTE:${user.bio}` : "",
      `URL;WORK:https://qrpass-nine-zeta.vercel.app/u/${user.uid}`,
    ];

    if (photoBase64) {
      // vCard 2.1 style for Base64 photos
      vCardLines.push(`PHOTO;JPEG;ENCODING=BASE64:`);
      vCardLines.push(photoBase64);
      vCardLines.push(""); // Empty line after base64 data is required by 2.1
    }

    vCardLines.push("END:VCARD");

    const blob = new Blob([vCardLines.join("\r\n")], { type: "text/vcard;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement("a"));
    link.href = url;
    link.setAttribute("download", `${user.displayName.replace(/\s+/g, "_")}.vcf`);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    setIsGenerating(false);
  };

  return (
    <button
      onClick={downloadVCard}
      disabled={isGenerating}
      className="px-10 py-4 rounded-full font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50"
      style={{
        backgroundColor: accentColor,
        color: "#FFFFFF"
      }}
    >
      {isGenerating ? "Preparing..." : "Save to Contacts"}
    </button>
  );
}
