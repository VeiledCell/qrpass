import { ConnectionProfile, Encounter } from "./models";

export type CalendarType = 'google' | 'outlook' | 'apple';

export function generateCalendarLink(type: CalendarType, profile: ConnectionProfile, encounter?: Encounter) {
  const title = encodeURIComponent(`Follow up with ${profile.name}`);
  const location = encodeURIComponent(encounter?.location?.city || "");
  const notes = encodeURIComponent(
    `Contact: ${profile.email || "No email"}

Notes from interaction: ${encounter?.transcription || profile.notes || ""}

Sent via qrPass`
  );
  
  // Default to tomorrow at 9 AM if no encounter date
  const startDate = encounter?.loopClosureDate 
    ? new Date(encounter.loopClosureDate) 
    : new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  startDate.setHours(9, 0, 0, 0);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min duration

  const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

  switch (type) {
    case 'google':
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${notes}&location=${location}&dates=${formatDate(startDate)}/${formatDate(endDate)}`;
    
    case 'outlook':
      return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${notes}&location=${location}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}`;
    
    case 'apple':
      // Apple prefers .ics files, but we can use a generic web-link approach for some clients or generate an ICS blob
      return null; 
  }
}

export function generateICSBlob(profile: ConnectionProfile, encounter?: Encounter) {
  const title = `Follow up with ${profile.name}`;
  const notes = `Contact: ${profile.email || "No email"}

Notes: ${encounter?.transcription || profile.notes || ""}`;
  
  const startDate = encounter?.loopClosureDate 
    ? new Date(encounter.loopClosureDate) 
    : new Date(Date.now() + 24 * 60 * 60 * 1000);
  startDate.setHours(9, 0, 0, 0);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${notes}`,
    `LOCATION:${encounter?.location?.city || ""}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  return new Blob([icsLines.join("
")], { type: "text/calendar;charset=utf-8" });
}
