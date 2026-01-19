import React from 'react';

export const Icons = {
  // Tote
  Tote: (props) => (
     <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 9v11a2 2 0 002 2h8a2 2 0 002-2V9M6 9h12M9 9V5a3 3 0 016 0v4" />
     </svg>
  ),
  // Pen
  Pen: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  // DrawstringBag
  DrawstringBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6l1-3h8l1 3v14a2 2 0 01-2 2H9a2 2 0 01-2-2V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 6V3m8 3V3" />
    </svg>
  ),
  // Backpack
  Backpack: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8a4 4 0 014-4h4a4 4 0 014 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V8z" />
      <rect x="8" y="14" width="8" height="6" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10a2 2 0 00-2 2v4a2 2 0 002 2" />
    </svg>
  ),
  // LaptopSleeve
  LaptopSleeve: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18" />
       <circle cx="12" cy="10" r="1.5" strokeWidth={1.5} fill="currentColor" />
    </svg>
  ),
  // TechPouch
  TechPouch: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="6" width="16" height="12" rx="2" strokeWidth={1.5} />
       <path d="M4 10h16" strokeWidth={1.5} />
       <path d="M18 10v2" strokeWidth={1.5} />
    </svg>
  ),
  // Phone
  Phone: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 18h2" />
    </svg>
  ),
  // PhoneGrip
  PhoneGrip: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="6" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
    </svg>
  ),
  // Pin
  Pin: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
    </svg>
  ),
  // EnamelPin
  EnamelPin: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l3 6 6 1-4.5 4 1.5 6-6-3.5L6 19l1.5-6-4.5-4 6-1 3-6z" />
       <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  // ChallengeCoin
  ChallengeCoin: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7l1.5 3h3l-2.5 2 1 3-3-2-3 2 1-3-2.5-2h3z" />
    </svg>
  ),
  // Keychain
  Keychain: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v4" />
      <circle cx="12" cy="3" r="1.5" strokeWidth={1.5} />
    </svg>
  ),
  // GuitarPick
  GuitarPick: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21C12 21 5 13 5 8a7 7 0 1114 0c0 5-7 13-7 13z" />
    </svg>
  ),
  // BadgeReel
  BadgeReel: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="7" r="4" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11v6" />
       <rect x="10" y="17" width="4" height="4" rx="1" strokeWidth={1.5} />
    </svg>
  ),
  // IDBadge
  IDBadge: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="7" y="5" width="10" height="14" rx="1" strokeWidth={1.5} />
       <path d="M10 5V3a1 1 0 011-1h2a1 1 0 011 1v2" strokeWidth={1.5} />
       <circle cx="12" cy="10" r="2" strokeWidth={1.5} opacity="0.3" />
       <path d="M9 15h6" strokeWidth={1.5} opacity="0.3" />
    </svg>
  ),
  // Lanyard
  Lanyard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 20v-5c0-4 2-8 4-8s4 4 4 8v5" />
       <rect x="10" y="20" width="4" height="2" strokeWidth={1.5} />
    </svg>
  ),
  // Umbrella
  Umbrella: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m0 0a2 2 0 01-2 2h0m2-18a8 8 0 00-8 8h16a8 8 0 00-8-8z" />
    </svg>
  ),
  // Lighter
  Lighter: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="7" y="9" width="10" height="13" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 9V7a2 2 0 012-2h6a2 2 0 012 2v2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 5V3" />
    </svg>
  ),
  // LipBalm
  LipBalm: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="9" y="4" width="6" height="16" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15h6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 8h6" />
    </svg>
  ),
  // Smartwatch
  Smartwatch: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="3" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 2v4M15 2v4M9 18v4M15 18v4" />
    </svg>
  ),
  // WirelessCharger
  WirelessCharger: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="7" strokeWidth={1.5} />
      <path d="M13 10V7l-4 5h3v3l4-5h-3z" fill="currentColor" />
    </svg>
  ),
  // Speaker
  Speaker: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="6" width="16" height="12" rx="2" strokeWidth={1.5} />
      <circle cx="8" cy="12" r="2" strokeWidth={1.5} />
      <circle cx="16" cy="12" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // Mouse
  Mouse: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2C8 2 5 6 5 11v5c0 4 3 7 7 7s7-3 7-7v-5c0-5-3-9-7-9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v7" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 9h14" />
    </svg>
  ),
  // EarbudsCase
  EarbudsCase: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="5" y="6" width="14" height="12" rx="4" strokeWidth={1.5} />
      <path d="M5 12h14" strokeWidth={1.5} />
      <circle cx="12" cy="15" r="0.5" fill="currentColor" />
    </svg>
  ),
  // USB
  USB: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="9" y="8" width="6" height="12" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 4h4v4h-4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 6v1" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 6v1" />
    </svg>
  ),
  // PowerBank
  PowerBank: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="4" width="12" height="16" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 17h4" />
       <circle cx="8" cy="7" r="1" fill="currentColor" />
       <circle cx="11" cy="7" r="1" fill="currentColor" />
       <circle cx="14" cy="7" r="1" fill="currentColor" />
    </svg>
  ),
  // JetTag
  JetTag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 21H8a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v14a2 2 0 01-2 2z" transform="rotate(90 12 12)" />
       <circle cx="7" cy="12" r="1.5" strokeWidth={1.5} />
    </svg>
  ),
  // Car
  Car: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l2-3h10l2 3v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8z" />
      <circle cx="7" cy="15" r="1.5" strokeWidth={1.5} />
      <circle cx="17" cy="15" r="1.5" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10h14" />
    </svg>
  ),
  // EmbroideryPatch
  EmbroideryPatch: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <circle cx="12" cy="12" r="7" strokeWidth={1.5} strokeDasharray="2 2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8l3 3-3 3-3-3 3-3z" />
    </svg>
  ),
  // StressBall
  StressBall: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-2 0-3 2-3 4s2 4 4 4" opacity="0.5"/>
    </svg>
  ),
  // StickyNotes
  StickyNotes: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="5" y="5" width="14" height="14" rx="1" strokeWidth={1.5} />
      <path d="M14 19l5-5v5h-5z" fill="currentColor" opacity="0.2" />
    </svg>
  ),
  // LunchBag
  LunchBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M5 8h14v12a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
       <path d="M5 8l2-4h10l2 4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
       <path d="M9 4v-1a1 1 0 011-1h4a1 1 0 011 1v1" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // FannyPack
  FannyPack: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M4 8h16l-2 10H6L4 8z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 8c0-2 2-4 8-4s8 2 8 4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10" y="9" width="4" height="2" strokeWidth={1.5} />
    </svg>
  ),
  // DuffleBag
  DuffleBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="6" width="16" height="12" rx="4" strokeWidth={1.5} />
       <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
       <path d="M8 6v12M16 6v12" strokeWidth={1.5} strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // AcrylicStandee
  AcrylicStandee: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v14" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 6h8l-1 11H9L8 6z" />
       <ellipse cx="12" cy="20" rx="6" ry="2" strokeWidth={1.5} />
    </svg>
  ),
  // AcrylicCharm
  AcrylicCharm: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6a4 4 0 014 4v4a4 4 0 01-4 4 4 4 0 01-4-4v-4a4 4 0 014-4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V3" />
       <circle cx="12" cy="3" r="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 8l2-2" opacity="0.3" />
    </svg>
  ),
  // AcrylicShaker
  AcrylicShaker: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4a8 8 0 100 16 8 8 0 000-16z" />
       <circle cx="10" cy="14" r="1.5" strokeWidth={1.5} />
       <circle cx="14" cy="13" r="1.5" strokeWidth={1.5} />
       <circle cx="12" cy="10" r="1.5" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v2" />
    </svg>
  ),
  // HotelKeyTag
  HotelKeyTag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4L6 14l6 6 6-6-6-10z" />
       <circle cx="12" cy="8" r="1" strokeWidth={1.5} />
    </svg>
  ),
  // AcrylicPin
  AcrylicPin: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5l2 4h4l-3 3 1 5-4-3-4 3 1-5-3-3h4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5l1.5-2" opacity="0.5" />
    </svg>
  ),
  // CakeTopper
  CakeTopper: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14v8" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10l-1 6H8L7 8z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8a4 4 0 018 0" />
    </svg>
  ),
  // AcrylicInvite
  AcrylicInvite: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="4" width="14" height="16" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 4l14 16" opacity="0.1" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 4L5 20" opacity="0.1" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8h8" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h8" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16h5" />
    </svg>
  ),
  // AcrylicOrnament
  AcrylicOrnament: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="13" r="7" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V3" />
       <circle cx="12" cy="3" r="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 11l2-2" opacity="0.3" />
    </svg>
  ),
  // AcrylicBlockPhoto
  AcrylicBlockPhoto: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="5" width="12" height="14" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 5l2 2v14l-2-2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 19l2 2h12" />
    </svg>
  ),
  // WallScroll
  WallScroll: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="4" width="16" height="16" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h18" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 20h18" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4V2" />
    </svg>
  ),
  // Shikishi
  Shikishi: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="4" width="16" height="16" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4l-3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 4l3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l-3-3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20l3-3" />
      <rect x="7" y="7" width="10" height="10" strokeWidth={1.5} opacity="0.3" />
    </svg>
  ),
  // Itabag
  Itabag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="5" y="6" width="14" height="14" rx="3" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
      <rect x="8" y="10" width="8" height="6" rx="1" strokeWidth={1.5} />
      <circle cx="12" cy="13" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  // Penlight
  Penlight: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v12" />
      <rect x="10" y="15" width="4" height="6" rx="1" strokeWidth={1.5} />
      <circle cx="12" cy="5" r="2" strokeWidth={1.5} opacity="0.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l-2 2" opacity="0.3"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5l2 2" opacity="0.3"/>
    </svg>
  ),
  // Omamori
  Omamori: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6l5-3 5 3v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6z" />
      <circle cx="12" cy="8" r="1.5" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3V1" />
    </svg>
  ),
  // Ema
  Ema: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8l8-4 8 4v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
      <circle cx="12" cy="6" r="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4V2" />
    </svg>
  ),
  // ClearFile
  ClearFile: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 4h14v16H5V4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 4l-4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 4v16" opacity="0.2" />
    </svg>
  ),
  // Happi
  Happi: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16v13H4V7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7V4h16v3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v13" opacity="0.3"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7v13" opacity="0.3"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 4v3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 4v3" />
    </svg>
  ),
  // Uchiwa
  Uchiwa: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2a8 8 0 018 8c0 3.8-2.6 7-6.2 7.8L13 22h-2l-.8-4.2C6.6 17 4 13.8 4 10a8 8 0 018-8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v16" opacity="0.3"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10h16" opacity="0.3"/>
    </svg>
  ),
  // Tankobon
  Tankobon: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 4h11a1 1 0 011 1v14a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 4v16" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8h4" opacity="0.3"/>
    </svg>
  ),
  // Doujinshi
  Doujinshi: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4H6a1 1 0 00-1 1v14a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1h-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 6h14" opacity="0.3"/>
    </svg>
  ),
  // Nesoberi
  Nesoberi: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <ellipse cx="12" cy="14" rx="8" ry="5" strokeWidth={1.5} />
      <circle cx="7" cy="14" r="1.5" strokeWidth={1.5} />
      <circle cx="17" cy="14" r="1.5" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6 0" opacity="0.5"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v5" />
    </svg>
  ),
  // CosplayWig
  CosplayWig: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c-4 0-7 3-7 8v5a2 2 0 002 2h10a2 2 0 002-2v-5c0-5-3-8-7-8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v10" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 18v3M16 18v3" />
    </svg>
  ),
  // RubberStrap
  RubberStrap: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v-2" />
      <circle cx="12" cy="3" r="1" strokeWidth={1.5} />
      <rect x="8" y="6" width="8" height="12" rx="2" strokeWidth={1.5} />
      <circle cx="12" cy="10" r="1" opacity="0.3" strokeWidth={1.5}/>
    </svg>
  ),
  // ArtBook
  ArtBook: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="3" width="16" height="18" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 3v18" />
      <circle cx="10" cy="10" r="2" strokeWidth={1.5} opacity="0.5" />
    </svg>
  ),
  // BluRayBox
  BluRayBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h12l4 4v10H8l-4-4V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10h12" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 6v4" />
    </svg>
  ),
  // MochiPlush
  MochiPlush: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <ellipse cx="12" cy="13" rx="7" ry="6" strokeWidth={1.5} />
      <circle cx="9" cy="12" r="0.5" fill="currentColor" />
      <circle cx="15" cy="12" r="0.5" fill="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 13h2" />
    </svg>
  ),
  // TicketHolder
  TicketHolder: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4h10v16H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 4l-4 6" opacity="0.3" />
      <circle cx="12" cy="4" r="1.5" strokeWidth={1.5} fill="white" />
    </svg>
  ),
  // CafeCoaster
  CafeCoaster: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="6" strokeWidth={1.5} strokeDasharray="1 2" opacity="0.5" />
    </svg>
  ),
  // Shitajiki
  Shitajiki: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="5" y="4" width="14" height="16" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 4l14 16" opacity="0.1"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 4L5 20" opacity="0.1"/>
    </svg>
  ),
  // Sensu
  Sensu: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 14c0-5.5 4.5-10 10-10s10 4.5 10 10" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 20v-6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 20l-4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 20l4-4" />
    </svg>
  ),
  // Kinchaku
  Kinchaku: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 9l2-3h6l2 3v10a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9l2-3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9l-2-3" />
      <circle cx="12" cy="14" r="1.5" strokeWidth={1.5} opacity="0.3"/>
    </svg>
  ),
  // LightNovel
  LightNovel: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="6" y="4" width="12" height="16" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 4v16" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 15h12" strokeDasharray="1 1" opacity="0.5"/>
    </svg>
  ),
  // PlushMascot
  PlushMascot: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="11" r="5" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V3" />
      <circle cx="12" cy="3" r="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 16l-2 3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 16l2 3" />
    </svg>
  ),
  // Cheki
  Cheki: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="6" y="4" width="12" height="16" rx="1" strokeWidth={1.5} />
      <rect x="8" y="6" width="8" height="10" strokeWidth={1.5} />
    </svg>
  ),
  // Rosette
  Rosette: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="10" r="5" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15l-3 6 3-2 3 2-3-6" />
      <circle cx="12" cy="10" r="2" strokeWidth={1.5} opacity="0.3" />
    </svg>
  ),
  // AcrylicClock
  AcrylicClock: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12V8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12l3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l2-2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20l-2-2" />
    </svg>
  ),
  // AcrylicDiorama
  AcrylicDiorama: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="6" width="16" height="12" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10h4M14 10h4M8 14h8" opacity="0.3"/>
      <ellipse cx="12" cy="20" rx="8" ry="2" strokeWidth={1.5} />
      <path d="M7 10v4M17 10v4" strokeWidth={1.5} opacity="0.5"/>
    </svg>
  ),
  // BoosterBox
  BoosterBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M4 8l8-4 8 4-8 4-8-4z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 8v8l8 4 8-4V8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 4v8" strokeWidth={1.5} opacity="0.3" />
      <path d="M8 2h8" strokeWidth={1.5} opacity="0.5"/>
    </svg>
  ),
  // Noren
  Noren: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h18" />
      <rect x="4" y="3" width="16" height="16" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v16" />
    </svg>
  ),
  // CharacterHanger
  CharacterHanger: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2c0 2 2 3 2 3M12 5a4 4 0 014 4v1a1 1 0 01-1 1H9a1 1 0 01-1-1V9a4 4 0 014-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 14c0 0 2-2 7-2s7 2 7 2v2H5v-2z" />
    </svg>
  ),
  // WaferCard
  WaferCard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="4" width="10" height="14" rx="1" strokeWidth={1.5} />
      <rect x="16" y="8" width="4" height="6" rx="1" strokeWidth={1.5} opacity="0.5"/>
      <path d="M4 6h10M4 10h10" strokeWidth={1.5} opacity="0.3"/>
    </svg>
  ),
  // BlindBox
  BlindBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="5" y="4" width="14" height="16" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10c0-1 1-2 2-2s2 1 2 2-1 2-2 2v2M12 16h.01" />
    </svg>
  ),
  // AcrylicFrame
  AcrylicFrame: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="1" strokeWidth={1.5} />
      <circle cx="6" cy="6" r="0.5" fill="currentColor" />
      <circle cx="18" cy="6" r="0.5" fill="currentColor" />
      <circle cx="6" cy="18" r="0.5" fill="currentColor" />
      <circle cx="18" cy="18" r="0.5" fill="currentColor" />
      <rect x="7" y="7" width="10" height="10" strokeWidth={1} opacity="0.2" />
    </svg>
  ),
  // ClearPoster
  ClearPoster: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="3" width="16" height="18" rx="0.5" strokeWidth={1.5} />
      <path d="M4 3l16 18" strokeWidth={1} opacity="0.1" />
      <path d="M20 3L4 18" strokeWidth={1} opacity="0.1" />
    </svg>
  ),
  // StandeeBase
  StandeeBase: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <ellipse cx="12" cy="16" rx="9" ry="4" strokeWidth={1.5} />
      <rect x="10" y="14" width="4" height="1" strokeWidth={1.5} opacity="0.5" />
    </svg>
  ),
  // AnimationCel
  AnimationCel: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="3" width="16" height="18" rx="1" strokeWidth={1.5} />
       <path d="M4 8h16" strokeWidth={1} opacity="0.2"/>
       <path d="M12 3l4 4" strokeWidth={1} opacity="0.4"/>
       <path d="M4 3l16 18" strokeWidth={0.5} opacity="0.1"/>
    </svg>
  ),
  // GengaSketch
  GengaSketch: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="5" width="16" height="14" rx="0" strokeWidth={1.5} />
       <circle cx="7" cy="7" r="1" fill="currentColor" />
       <circle cx="12" cy="7" r="1" fill="currentColor" />
       <circle cx="17" cy="7" r="1" fill="currentColor" />
       <path d="M6 10h12M6 13h10" strokeWidth={1} opacity="0.3" />
    </svg>
  ),
  // MovieFlyer
  MovieFlyer: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="4" width="14" height="16" strokeWidth={1.5} />
       <path d="M5 14h14" strokeWidth={1.5} />
       <path d="M5 10h14" strokeWidth={1} opacity="0.4"/>
    </svg>
  ),
  // HoloBadge
  HoloBadge: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <path d="M8 8l2 2M14 14l2 2M8 16l2-2M14 10l2-2" strokeWidth={1} opacity="0.5"/>
       <circle cx="12" cy="12" r="3" strokeWidth={1.5} strokeDasharray="1 1"/>
    </svg>
  ),
  // SecretRare
  SecretRare: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="4" width="14" height="16" rx="1" strokeWidth={1.5} />
       <rect x="7" y="6" width="10" height="8" strokeWidth={1} opacity="0.5"/>
       <path d="M5 4l14 16" strokeWidth={0.5} opacity="0.2"/>
       <path d="M19 4L5 20" strokeWidth={0.5} opacity="0.2"/>
    </svg>
  ),
  // ArtFolio
  ArtFolio: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M12 4H5v16h7m0-16h7v16h-7m0-16v16" strokeWidth={1.5} />
       <rect x="14" y="6" width="4" height="6" strokeWidth={1} opacity="0.5"/>
    </svg>
  ),
  // Add missing MemorialTicket icon,
  // MemorialTicket
  MemorialTicket: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12a2 2 0 012-2V7a2 2 0 012-2h10a2 2 0 012 2v3a2 2 0 012 2 2 2 0 01-2 2v3a2 2 0 01-2 2H7a2 2 0 01-2-2v-3a2 2 0 01-2-2z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v14" strokeDasharray="3 3" />
    </svg>
  ),
  // Add missing MicrofiberTowel icon,
  // MicrofiberTowel
  MicrofiberTowel: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="4" width="12" height="16" rx="1" strokeWidth={1.5} />
       <path d="M6 8h12M6 12h12M6 16h12" strokeWidth={1.5} strokeDasharray="1 1" opacity="0.5"/>
    </svg>
  ),
  // Add missing WashiTapeTower icon,
  // WashiTapeTower
  WashiTapeTower: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="12" cy="6" rx="5" ry="2" strokeWidth={1.5} />
       <ellipse cx="12" cy="10" rx="5" ry="2" strokeWidth={1.5} />
       <ellipse cx="12" cy="14" rx="5" ry="2" strokeWidth={1.5} />
       <ellipse cx="12" cy="18" rx="5" ry="2" strokeWidth={1.5} />
       <path d="M7 6v12M17 6v12" strokeWidth={1.5} />
    </svg>
  ),
  // Add missing GachaCapsule icon,
  // GachaCapsule
  GachaCapsule: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h18" />
       <circle cx="12" cy="12" r="3" strokeWidth={1.5} opacity="0.5"/>
    </svg>
  ),
  // Add missing Pegboard icon,
  // Pegboard
  Pegboard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="1" strokeWidth={1.5} />
      <circle cx="8" cy="8" r="0.5" fill="currentColor" />
      <circle cx="12" cy="8" r="0.5" fill="currentColor" />
      <circle cx="16" cy="8" r="0.5" fill="currentColor" />
      <circle cx="8" cy="12" r="0.5" fill="currentColor" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
      <circle cx="16" cy="12" r="0.5" fill="currentColor" />
      <circle cx="8" cy="16" r="0.5" fill="currentColor" />
      <circle cx="12" cy="16" r="0.5" fill="currentColor" />
      <circle cx="16" cy="16" r="0.5" fill="currentColor" />
    </svg>
  ),
  // TShirt
  TShirt: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a2 2 0 01-2 2h-2zM17 21a4 4 0 01-4-4V5a2 2 0 002-2h4a2 2 0 012 2v12a2 2 0 01-2 2h-2z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18M9 3v4M15 3v4" /> 
       <path d="M16 2H8C6 2 5 3 5 5v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-2-1-3-3-3z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M12 2v4" strokeWidth={1.5} />
    </svg>
  ),
  // SimpleShirt
  SimpleShirt: (props) => (
     <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 2H8a2 2 0 00-2 2v16a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" /> 
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 2l-4 4v4l4-2M16 2l4 4v4l-4-2" />
     </svg>
  ),
  // VintageTee
  VintageTee: (props) => (
     <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 2H8a2 2 0 00-2 2v16a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" /> 
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 2l-4 4v4l4-2M16 2l4 4v4l-4-2" />
        <path d="M9 10h6" strokeWidth={1.5} strokeDasharray="1 1" opacity="0.5" />
        <path d="M8 15h8" strokeWidth={1.5} strokeDasharray="1 1" opacity="0.5" />
     </svg>
  ),
  // TieDyeShirt
  TieDyeShirt: (props) => (
     <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 2H8a2 2 0 00-2 2v16a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" /> 
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 2l-4 4v4l4-2M16 2l4 4v4l-4-2" />
        <circle cx="12" cy="12" r="3" strokeWidth={1.5} strokeDasharray="2 2" opacity="0.6" />
     </svg>
  ),
  // LongSleeve
  LongSleeve: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 2H8a2 2 0 00-2 2v16a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" /> 
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 2L3 10v2l5-2M16 2l5 8v2l-5-2" />
    </svg>
  ),
  // CropTop
  CropTop: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 2H8a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" /> 
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 2l-4 3v3l4-1.5M16 2l4 3v3l-4-1.5" />
    </svg>
  ),
  // Polo
  Polo: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 2H8a2 2 0 00-2 2v16a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v5" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 2l-3 3v4l3-1M16 2l3 3v4l-3-1" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 2h4" strokeOpacity="0.5" />
    </svg>
  ),
  // Hoodie
  Hoodie: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 2H8a2 2 0 00-2 2v16a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v6m-3-3h6" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14h8" />
    </svg>
  ),
  // ZipHoodie
  ZipHoodie: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 2H8a2 2 0 00-2 2v16a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v16" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14h3M13 14h3" />
    </svg>
  ),
  // Sweatshirt
  Sweatshirt: (props) => (
     <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-3-3H7L4 7v11a2 2 0 002 2h12a2 2 0 002-2V7z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4v3M16 4v3" />
     </svg>
  ),
  // VarsityJacket
  VarsityJacket: (props) => (
     <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-3-3H7L4 7v11a2 2 0 002 2h12a2 2 0 002-2V7z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4v3M16 4v3" />
        <path d="M6 10h1" strokeWidth={1.5} /> <path d="M17 10h1" strokeWidth={1.5} />
     </svg>
  ),
  // DenimJacket
  DenimJacket: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-3-3H7L4 7v11a2 2 0 002 2h12a2 2 0 002-2V7z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9h2v3H8zm6 0h2v3h-2z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14h16" opacity="0.3" />
    </svg>
  ),
  // PufferJacket
  PufferJacket: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-3-3H7L4 7v11a2 2 0 002 2h12a2 2 0 002-2V7z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10h16M4 14h16M4 18h16" opacity="0.5"/>
    </svg>
  ),
  // BabyOnePiece
  BabyOnePiece: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2C10 2 9 3 9 4v2H6a2 2 0 00-2 2v5c0 3 2 5 2 7 0 1.5 1 2 2 2h8c1 0 2-.5 2-2 0-2 2-4 2-7V8a2 2 0 00-2-2h-3V4c0-1-1-2-3-2z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 22v-3c0-1 1-2 3-2s3 1 3 2v3" />
    </svg>
  ),
  // Pants
  Pants: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 3h12l-1 10 2 9h-5l-2-6-2 6H5l2-9-1-10z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 5h12" />
    </svg>
  ),
  // Leggings
  Leggings: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 3h8l-1 8 2 10h-4l-1-7-1 7H7l2-10-1-8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5h8" />
    </svg>
  ),
  // Socks
  Socks: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3h4c1 0 2 1 2 2v8c0 2 1 3 3 3h2c1 0 2 1 2 2v2c0 1-1 2-2 2H8c-2 0-4-2-4-4V5c0-1 1-2 2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11h4" />
    </svg>
  ),
  // Apron
  Apron: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 22V10l3-5h4l3 5v12H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 5H7a2 2 0 00-2 2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5h3a2 2 0 002 2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14h4" />
    </svg>
  ),
  // Beanie
  Beanie: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10a6 6 0 0112 0v4H6v-4z" />
      <rect x="5" y="14" width="14" height="6" rx="1" strokeWidth={1.5} />
    </svg>
  ),
  // Cap
  Cap: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 14c0-4 3-8 6-8s6 4 6 8H6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 14h3c1 0 1 2 0 2h-4" />
      <circle cx="12" cy="6" r="0.5" fill="currentColor" />
    </svg>
  ),
  // TruckerHat
  TruckerHat: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 14c0-4 3-8 6-8s6 4 6 8H6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 14h3c1 0 1 2 0 2h-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10h6" strokeDasharray="1 1" opacity="0.7" />
    </svg>
  ),
  // BucketHat
  BucketHat: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 10l1-5h8l1 5H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14l3-4h10l3 4c0 2-3 2-8 2s-8 0-8-2z" />
    </svg>
  ),
  // Headband
  Headband: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="9" width="16" height="6" rx="3" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9v6" opacity="0.5" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 9v6" opacity="0.5" />
    </svg>
  ),
  // SportsJersey
  SportsJersey: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M16 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" strokeWidth={1.5} />
       <path d="M8 2L4 6v4l4-2" strokeWidth={1.5} />
       <path d="M16 2l4 4v4l-4-2" strokeWidth={1.5} />
       <path d="M12 2v6" strokeWidth={1.5} opacity="0.5" />
    </svg>
  ),
  // BasketballJersey
  BasketballJersey: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M16 2H8a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3z" strokeWidth={1.5} />
       <path d="M5 6h14" strokeWidth={1.5} />
       <path d="M12 2v4" strokeWidth={1.5} />
    </svg>
  ),
  // BathTowel
  BathTowel: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 2h12v20H6z" opacity="0.3"/>
    </svg>
  ),
  // ShowerCurtain
  ShowerCurtain: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h16" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 4v16c0 1 1 2 2 2h10c1 0 2-1 2-2V4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 4v14M15 4v14" opacity="0.3" />
      <circle cx="6" cy="3" r="1" strokeWidth={1.5} />
      <circle cx="10" cy="3" r="1" strokeWidth={1.5} />
      <circle cx="14" cy="3" r="1" strokeWidth={1.5} />
      <circle cx="18" cy="3" r="1" strokeWidth={1.5} />
    </svg>
  ),
  // BathMat
  BathMat: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="8" width="16" height="10" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h8" opacity="0.3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14h8" opacity="0.3" />
    </svg>
  ),
  // SoapDispenser
  SoapDispenser: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="7" y="10" width="10" height="11" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10V7" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7h3v2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 7h4" />
    </svg>
  ),
  // ToothbrushHolder
  ToothbrushHolder: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10V10H7v11z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10V4c0-1.5-1-2-2-2s-2 .5-2 2v6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 4h1" opacity="0.5"/>
    </svg>
  ),
  // BathBomb
  BathBomb: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4a8 8 0 0 1 0 16" opacity="0.3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7l2-2" opacity="0.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 10l2-1" opacity="0.5" />
    </svg>
  ),
  // Scale
  Scale: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="5" y="5" width="14" height="14" rx="2" strokeWidth={1.5} />
      <rect x="8" y="7" width="8" height="4" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14v3" opacity="0.3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 17h4" opacity="0.3" />
    </svg>
  ),
  // Loofah
  Loofah: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c1-1 1-3 0-4-1-1-3-1-4 0" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 11c1 1 3 1 4 0" opacity="0.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 15c1-1 3-1 4 0" opacity="0.5" />
    </svg>
  ),
  // Duvet
  Duvet: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="4" width="16" height="18" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10h16" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v12" opacity="0.3" />
    </svg>
  ),
  // Pillow
  Pillow: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="7" width="18" height="10" rx="3" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7v10" opacity="0.3" />
    </svg>
  ),
  // EyeMask
  EyeMask: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12c0 2 2 4 5 4s4-1 4-2c0 1 1 2 4 2s5-2 5-4c0-2-3-4-6-4h-6c-3 0-6 2-6 4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 11l2-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M22 11l-2-4" />
    </svg>
  ),
  // Diffuser
  Diffuser: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="7" y="12" width="10" height="9" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12V3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 12l-2-7" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 12l2-7" />
    </svg>
  ),
  // AlarmClock
  AlarmClock: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="7" width="16" height="10" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 21l-2-2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 21l2-2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6" strokeDasharray="1 2"/>
    </svg>
  ),
  // Slippers
  Slippers: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10c0-4 2-6 5-6s4 3 4 7-3 7-7 7h-2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 18h2c4 0 7-3 7-7 0-4-2-6-5-6S2 8 2 12s3 7 7 7" transform="scale(-1 1) translate(-22 0)" />
    </svg>
  ),
  // Hamper
  Hamper: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7l1 14h10l1-14H6z" />
      <ellipse cx="12" cy="7" rx="6" ry="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6" opacity="0.3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 16h6" opacity="0.3" />
    </svg>
  ),
  // BedRunner
  BedRunner: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="6" width="16" height="12" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14h16" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10h16" opacity="0.3" />
    </svg>
  ),
  // Lollipop
  Lollipop: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="8" r="5" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 13v8" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8l3-3M9 11l3-3" opacity="0.5" />
    </svg>
  ),
  // MacaronBox
  MacaronBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="8" width="18" height="8" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8v8" opacity="0.3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8v8" opacity="0.3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h18" opacity="0.3" />
    </svg>
  ),
  // DonutBox
  DonutBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16l-2 10H6L4 8z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8l8-4 8 4" />
       <circle cx="12" cy="13" r="3" strokeWidth={1.5} />
    </svg>
  ),
  // HotSauce
  HotSauce: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v5" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 11l-1 9h8l-1-9-3-4-3 4z" />
       <rect x="10" y="2" width="4" height="2" strokeWidth={1.5} />
    </svg>
  ),
  // Popcorn
  Popcorn: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10l2 11h8l2-11H6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10c0-2 1.5-3 3-3s3 1 3 3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10c0-2 1.5-3 3-3s3 1 3 3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 10c0-2-1.5-3-3-3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 21l-1-11" opacity="0.3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 21l1-11" opacity="0.3" />
    </svg>
  ),
  // BubbleTea
  BubbleTea: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8l1.5 13h7l1.5-13H7z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8c0-2 2.5-3 5-3s5 1 5 3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5V2" />
       <circle cx="10" cy="18" r="1" fill="currentColor" />
       <circle cx="14" cy="18" r="1" fill="currentColor" />
       <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  ),
  // TeaBox
  TeaBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="6" width="12" height="12" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10h12" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 6l-2-2h-4l-2 2" />
    </svg>
  ),
  // GummyBear
  GummyBear: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7a3 3 0 016 0v2h-6V7z" />
       <rect x="7" y="9" width="10" height="10" rx="2" strokeWidth={1.5} />
       <circle cx="10" cy="13" r="1" fill="currentColor"/>
       <circle cx="14" cy="13" r="1" fill="currentColor"/>
    </svg>
  ),
  // MasonJar
  MasonJar: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6h10v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6z" />
       <rect x="6" y="3" width="12" height="3" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 9h10" opacity="0.3"/>
    </svg>
  ),
  // SoupCan
  SoupCan: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7v12a2 2 0 002 2h8a2 2 0 002-2V7" />
       <ellipse cx="12" cy="7" rx="6" ry="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12h12" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 16h12" opacity="0.3"/>
    </svg>
  ),
  // SardineTin
  SardineTin: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="8" width="18" height="8" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 10a2 2 0 100-4 2 2 0 000 4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 10l-8 0" />
    </svg>
  ),
  // FrozenMeal
  FrozenMeal: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="6" width="16" height="12" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6" />
    </svg>
  ),
  // MilkCarton
  MilkCarton: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 9l1 13h10l1-13H6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 9L9 3h6l3 6" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v6" />
    </svg>
  ),
  // TwoLiter
  TwoLiter: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8c0 2 1 3 1 6v6a2 2 0 002 2h2a2 2 0 002-2v-6c0-3 1-4 1-6 0-3-2-5-5-5s-5 2-5 5z" />
       <rect x="9" y="1" width="6" height="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h8" opacity="0.3"/>
    </svg>
  ),
  // EnergyDrink
  EnergyDrink: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 6v14a1 1 0 001 1h6a1 1 0 001-1V6" />
       <ellipse cx="12" cy="6" rx="4" ry="1.5" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 2h4v2h-4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12l2-3 1 3" opacity="0.5"/>
    </svg>
  ),
  // OliveOil
  OliveOil: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="7" y="8" width="10" height="14" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 8V4h4v4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14h6" opacity="0.3"/>
    </svg>
  ),
  // Granola
  Granola: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="8" width="16" height="8" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12h2M20 12h2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8l2 8" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 8l2 8" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 8l2 8" opacity="0.3"/>
    </svg>
  ),
  // CrackerBox
  CrackerBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="4" width="14" height="16" rx="1" strokeWidth={1.5} />
       <circle cx="12" cy="12" r="4" strokeWidth={1.5} opacity="0.3"/>
    </svg>
  ),
  // CakeBox
  CakeBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12v-3" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10l3 2 3-2" opacity="0.3"/>
    </svg>
  ),
  // Cupcake
  Cupcake: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2 6H5l2-6" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4a3 3 0 00-3 3 3 3 0 00-3 3v2h12v-2a3 3 0 00-3-3 3 3 0 00-3-3z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v6M12 14v6M16 14v6" opacity="0.3"/>
    </svg>
  ),
  // BreadBag
  BreadBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7v12a2 2 0 002 2h8a2 2 0 002-2V7" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7c0-2 1.5-4 4-4h4c2.5 0 4 2 4 4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 11h12" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 15h12" opacity="0.3"/>
    </svg>
  ),
  // ChefHat
  ChefHat: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 16v4h12v-4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 16c-2 0-3-2-3-4 0-4 3-8 9-8s9 4 9 8c0 2-1 4-3 4" />
    </svg>
  ),
  // OvenMitt
  OvenMitt: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4v16h8c2.21 0 4-1.79 4-4V7a3 3 0 00-3-3H8z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12H5a1 1 0 00-1 1v2a3 3 0 003 3h1" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16" opacity="0.3"/>
    </svg>
  ),
  // CuttingBoard
  CuttingBoard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="4" width="14" height="16" rx="2" strokeWidth={1.5} />
       <circle cx="12" cy="7" r="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 16h14" opacity="0.3"/>
    </svg>
  ),
  // SpiceJar
  SpiceJar: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8h8v12H8z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14h8" opacity="0.3"/>
    </svg>
  ),
  // HoneyJar
  HoneyJar: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8l5-2 5 2v8l-5 2-5-2V8z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 8V6h6v2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v2" />
    </svg>
  ),
  // Plate
  Plate: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <circle cx="12" cy="12" r="5" strokeWidth={1.5} opacity="0.3"/>
    </svg>
  ),
  // Napkin
  Napkin: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5h14v14H5z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 5L5 19" />
    </svg>
  ),
  // TeaTin
  TeaTin: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="7" width="12" height="13" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7L8 3h8l2 4" />
       <circle cx="12" cy="14" r="3" strokeWidth={1.5} opacity="0.3"/>
    </svg>
  ),
  // FryingPan
  FryingPan: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="10" cy="10" r="6" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13l6 6" />
    </svg>
  ),
  // CookingPot
  CookingPot: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8l2-3h12l2 3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 10h2M20 10h2" />
    </svg>
  ),
  // RollingPin
  RollingPin: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="8" width="12" height="8" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12h4M18 12h4" />
    </svg>
  ),
  // Knife
  Knife: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 4l-9 2-7 8 2 2 8-7 6-5z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14l2 2" opacity="0.3"/>
    </svg>
  ),
  // Bowl
  Bowl: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10c0 5 3 9 8 9s8-4 8-9" />
       <ellipse cx="12" cy="10" rx="8" ry="3" strokeWidth={1.5} />
    </svg>
  ),
  // Platter
  Platter: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="12" cy="12" rx="10" ry="5" strokeWidth={1.5} />
       <ellipse cx="12" cy="12" rx="7" ry="3" strokeWidth={1.5} opacity="0.3"/>
    </svg>
  ),
  // WineGlass
  WineGlass: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5a4 4 0 018 0c0 4-2 6-4 6s-4-2-4-6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11v8" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 19h8" />
    </svg>
  ),
  // TableTent
  TableTent: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4L4 20h16L12 4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16" opacity="0.3"/>
    </svg>
  ),
  // NoodleBox
  NoodleBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10l2 12h8l2-12H6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10L4 4h16l-2 6" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v6" opacity="0.3"/>
    </svg>
  ),
  // SushiTray
  SushiTray: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="10" width="18" height="6" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10l3-4h12l3 4" opacity="0.5"/>
    </svg>
  ),
  // PieBox
  PieBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="6" width="18" height="12" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h18" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6" />
    </svg>
  ),
  // TeaBag
  TeaBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h12v12l-6 3-6-3V6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V2" />
       <rect x="10" y="2" width="4" height="2" strokeWidth={1.5} />
    </svg>
  ),
  // PizzaBoxOpen
  PizzaBoxOpen: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16v8H4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12l2-8h12l2 8" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v8" opacity="0.3"/>
    </svg>
  ),
  // SandwichWrap
  SandwichWrap: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth={1.5} transform="rotate(-10 12 12)" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v20" opacity="0.3" transform="rotate(-10 12 12)" />
    </svg>
  ),
  // JuicePouch
  JuicePouch: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 5l1 15h10l1-15H6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l3-3" />
       <circle cx="12" cy="14" r="3" strokeWidth={1.5} opacity="0.3"/>
    </svg>
  ),
  // YogurtCup
  YogurtCup: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7l2 12h8l2-12H6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7l-1-2h14l-1 2" />
    </svg>
  ),
  // EggCarton
  EggCarton: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12h20v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12c0-3 2-6 5-6s5 3 5 6" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12c0-3 2-6 5-6s5 3 5 6" />
    </svg>
  ),
  // FlourBag
  FlourBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h12v14H6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10h12" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6l-1-2h14l-1 2" />
    </svg>
  ),
  // Sachet
  Sachet: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="4" width="12" height="16" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 7H6" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 17H6" />
    </svg>
  ),
  // EspressoCup
  EspressoCup: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 9h11v5a3 3 0 01-3 3H8a3 3 0 01-3-3V9z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 10h2a2 2 0 012 2v1a2 2 0 01-2 2h-2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 18h14" />
    </svg>
  ),
  // BeerGlass
  BeerGlass: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6l2 15h6l2-15H7z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6c0-2 2-3 5-3s5 1 5 3" />
    </svg>
  ),
  // ShotGlass
  ShotGlass: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6l2 14h8l2-14H6z" />
       <ellipse cx="12" cy="6" rx="6" ry="2" strokeWidth={1.5} />
    </svg>
  ),
  // TableRunner
  TableRunner: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="2" width="16" height="20" rx="0" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 18h16" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v20" opacity="0.3"/>
    </svg>
  ),
  // ButcherPaper
  ButcherPaper: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 4l4 4-12 12-4-4 12-12z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 4c-2 2-2 5 0 7" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 6l2 2" />
    </svg>
  ),
  // Mug
  Mug: (props) => (
     <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 5h10v11a3 3 0 01-3 3H9a3 3 0 01-3-3V5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2" />
     </svg>
  ),
  // Tumbler
  Tumbler: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 5l2 16h8l2-16H6z" />
      <ellipse cx="12" cy="5" rx="6" ry="1.5" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v-3" />
    </svg>
  ),
  // WaterBottle
  WaterBottle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="9" y="2" width="6" height="3" strokeWidth={1.5} rx="1" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6h10v15a2 2 0 01-2 2H9a2 2 0 01-2-2V6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12h10" opacity="0.5"/>
    </svg>
  ),
  // Coaster
  Coaster: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" opacity="0.5" />
    </svg>
  ),
  // GlassCup
  GlassCup: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 5v14a2 2 0 002 2h6a2 2 0 002-2V5" />
      <ellipse cx="12" cy="5" rx="5" ry="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12H8" opacity="0.5"/>
    </svg>
  ),
  // Mousepad
  Mousepad: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
  ),
  // DeskMat
  DeskMat: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={1.5} />
      <rect x="4" y="8" width="8" height="8" rx="1" strokeWidth={1.5} opacity="0.3" />
      <rect x="14" y="9" width="6" height="6" rx="1" strokeWidth={1.5} opacity="0.3" />
    </svg>
  ),
  // Playmat
  Playmat: (props) => (
     <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth={1.5} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 5v14M17 5v14" />
     </svg>
  ),
  // Blanket
  Blanket: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  // Candle
  Candle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11v8a2 2 0 002 2h6a2 2 0 002-2v-8m-10 0V9a2 2 0 012-2h6a2 2 0 012 2v2m-10 0h10" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5V3m0 0a2 2 0 01-2-2m2 2a2 2 0 002-2" />
    </svg>
  ),
  // BodyPillow
  BodyPillow: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="7" y="2" width="10" height="20" rx="4" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  ),
  // Cutout
  Cutout: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4a4 4 0 100 8 4 4 0 000-8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12v9" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 21h8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 16l-2 5M15 16l2 5" />
    </svg>
  ),
  // Koozie
  Koozie: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6h10v14a2 2 0 01-2 2H9a2 2 0 01-2-2V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6a2 2 0 012-2h6a2 2 0 012 2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4V2" />
    </svg>
  ),
  // CampMug
  CampMug: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M5 8h11v9a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" strokeWidth={1.5} />
       <path d="M16 10h2a2 2 0 012 2v2a2 2 0 01-2 2h-2" strokeWidth={1.5} />
       <path d="M5 8h11" strokeWidth={3} strokeOpacity="0.1" />
    </svg>
  ),
  // AcrylicBlock
  AcrylicBlock: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M6 4h12v16H6z" strokeWidth={1.5} />
       <path d="M18 4l2 2v16l-2-2" strokeWidth={1.5} />
       <path d="M6 20l2 2h12" strokeWidth={1.5} />
    </svg>
  ),
  // YogaMat
  YogaMat: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="6" cy="12" rx="3" ry="6" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h12" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18h12" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 6c1.657 0 3 2.686 3 6s-1.343 6-3 6" />
    </svg>
  ),
  // Necklace
  Necklace: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2m0 16a2 2 0 100-4 2 2 0 000 4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7z" />
    </svg>
  ),
  // Ring
  Ring: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="14" r="5" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9l-2-3h4l-2 3z" />
    </svg>
  ),
  // Earrings
  Earrings: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="8" cy="16" r="2" strokeWidth={1.5} />
      <circle cx="16" cy="16" r="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 6v8m8-6v8" />
      <circle cx="8" cy="5" r="1" fill="currentColor" />
      <circle cx="16" cy="5" r="1" fill="currentColor" />
    </svg>
  ),
  // Bracelet
  Bracelet: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <ellipse cx="12" cy="12" rx="7" ry="4" strokeWidth={1.5} transform="rotate(-15 12 12)" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8l1 1" />
    </svg>
  ),
  // Watch
  Watch: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="6" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V2m0 20v-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12l2-2" />
    </svg>
  ),
  // JewelryBox
  JewelryBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
      <rect x="10" y="10" width="4" height="4" strokeWidth={1.5} />
    </svg>
  ),
  // Cufflinks
  Cufflinks: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="7" cy="12" r="3" strokeWidth={1.5} />
      <circle cx="17" cy="12" r="3" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 12h4" />
    </svg>
  ),
  // PearlNecklace
  PearlNecklace: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7z" strokeDasharray="1 3" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" />
    </svg>
  ),
  // DogTag
  DogTag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v4" />
       <rect x="9" y="7" width="6" height="10" rx="3" strokeWidth={1.5} />
    </svg>
  ),
  // Bangle
  Bangle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="7" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="6" strokeWidth={1.5} opacity="0.5" />
    </svg>
  ),
  // Brooch
  Brooch: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9V5m0 14v-4m3-3h4m-14 0h4m2-5l2 2m-2 6l2-2m-2-6l-2 2m2 6l-2-2" />
    </svg>
  ),
  // JewelryPouch
  JewelryPouch: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h8l2 13H6L8 7z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7c0-2 1.5-3 3-3s3 1 3 3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 10h10" />
    </svg>
  ),
  // DiamondRing
  DiamondRing: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="15" r="5" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10l-2-2 2-3 2 3-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5l-1 1m2-1l1 1" />
    </svg>
  ),
  // Album
  Album: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="3" width="18" height="18" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v18" />
       <circle cx="13" cy="12" r="5" strokeWidth={1.5} opacity="0.6"/>
       <circle cx="13" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  // Vinyl
  Vinyl: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="2" y="2" width="18" height="18" strokeWidth={1.5} />
       <circle cx="11" cy="11" r="7" strokeWidth={1.5} />
       <circle cx="11" cy="11" r="2" fill="currentColor" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 20l-3-3" opacity="0.5"/>
    </svg>
  ),
  // VinylLabel
  VinylLabel: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="10" strokeWidth={1.5} opacity="0.2" />
       <circle cx="12" cy="12" r="5" strokeWidth={1.5} />
       <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  // VHS
  VHS: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="5" width="18" height="14" rx="1" strokeWidth={1.5} />
      <circle cx="8" cy="12" r="3" strokeWidth={1.5} opacity="0.5" />
      <circle cx="16" cy="12" r="3" strokeWidth={1.5} opacity="0.5" />
      <path d="M3 15h18" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
    </svg>
  ),
  // Cassette
  Cassette: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M4 6h16v10l-2 2H6l-2-2V6z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="11" r="1.5" strokeWidth={1.5} />
      <circle cx="16" cy="11" r="1.5" strokeWidth={1.5} />
      <rect x="9" y="15" width="6" height="2" strokeWidth={1.5} />
    </svg>
  ),
  // CDCase
  CDCase: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="4" width="16" height="16" rx="1" strokeWidth={1.5} />
       <circle cx="12" cy="12" r="3" strokeWidth={1.5} opacity="0.3" />
       <path d="M4 6h1" strokeWidth={1.5} />
    </svg>
  ),
  // Digipak
  Digipak: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="2" y="5" width="20" height="14" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 5v14" />
       <circle cx="16" cy="12" r="3" strokeWidth={1.5} opacity="0.3" />
    </svg>
  ),
  // SprayPaint
  SprayPaint: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="7" y="8" width="10" height="14" rx="1" strokeWidth={1.5} />
      <path d="M7 8l5-4 5 4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="11" y="2" width="2" height="2" strokeWidth={1.5} />
    </svg>
  ),
  // PaintTube
  PaintTube: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M9 19h6l-1-12H10L9 19z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 22h10" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10" y="3" width="4" height="4" rx="1" strokeWidth={1.5} />
    </svg>
  ),
  // Sketchbook
  Sketchbook: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="1" strokeWidth={1.5} />
      <path d="M12 4v16" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 4v2m0 2v2m0 2v2m0 2v2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  ),
  // Watercolor
  Watercolor: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="6" width="16" height="12" rx="2" strokeWidth={1.5} />
       <circle cx="8" cy="12" r="2" strokeWidth={1.5} opacity="0.5" />
       <circle cx="16" cy="12" r="2" strokeWidth={1.5} opacity="0.5" />
       <path d="M12 6v12" strokeWidth={1.5} />
    </svg>
  ),
  // Clapperboard
  Clapperboard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10h16v10H4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10l2-6 16 4-2 2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 4l-1 6" />
    </svg>
  ),
  // MicFlag
  MicFlag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="6" width="12" height="10" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v6" />
       <circle cx="12" cy="3" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // PillBottle
  PillBottle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6h10v14a2 2 0 01-2 2H9a2 2 0 01-2-2V6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 4h14v2H5z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 2h6v2H9z" />
    </svg>
  ),
  // MedicalMask
  MedicalMask: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="6" width="16" height="12" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 10h2M20 10h2M2 14h2M20 14h2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10c2 1 2 3 0 4M20 10c-2 1-2 3 0 4" opacity="0.3"/>
    </svg>
  ),
  // Scrubs
  Scrubs: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3l-2 3v14a1 1 0 001 1h8a1 1 0 001-1V6l-2-3H9z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v6" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9l3 3 3-3" />
    </svg>
  ),
  // FirstAidKit
  FirstAidKit: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="6" width="18" height="14" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 2h6" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6M9 13h6" />
    </svg>
  ),
  // OintmentTube
  OintmentTube: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 20H8l-1-12h10l-1 12z" />
       <rect x="7" y="21" width="10" height="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10" />
       <rect x="9" y="4" width="6" height="4" rx="1" strokeWidth={1.5} />
    </svg>
  ),
  // SyringeBox
  SyringeBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14l-1 12H6L5 8z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v5" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5h6" />
    </svg>
  ),
  // IVBag
  IVBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6h10v10c0 3-2 5-5 5s-5-2-5-5V6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 2h4v4h-4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v4" opacity="0.5"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 12h4" opacity="0.5"/>
    </svg>
  ),
  // Vial
  Vial: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8v12a1 1 0 001 1h6a1 1 0 001-1V8" />
       <rect x="7" y="4" width="10" height="4" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h8" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h8" opacity="0.3"/>
    </svg>
  ),
  // BlisterPack
  BlisterPack: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="2" width="12" height="20" rx="2" strokeWidth={1.5} />
       <path d="M12 4a1 1 0 100 2 1 1 0 000-2z" strokeWidth={1.5} />
       <rect x="8" y="10" width="8" height="10" rx="1" strokeWidth={1.5} />
    </svg>
  ),
  // MedicalDropper
  MedicalDropper: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v5" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 8h6l1 12H8L9 8z" />
       <rect x="10" y="3" width="4" height="3" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 13v4" opacity="0.5" />
    </svg>
  ),
  // NasalSpray
  NasalSpray: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h8v12H8z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10V6c0-2 4-2 4 0v4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 13h12" />
    </svg>
  ),
  // TestKit
  TestKit: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="8" width="14" height="8" rx="1" strokeWidth={1.5} />
       <circle cx="9" cy="12" r="1.5" strokeWidth={1.5} />
       <rect x="13" y="11" width="4" height="2" strokeWidth={1.5} />
    </svg>
  ),
  // PharmacyBag
  PharmacyBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 6h14l-1 16H6L5 6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10h14" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" opacity="0.5" />
    </svg>
  ),
  // Wristband
  Wristband: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="12" cy="12" rx="8" ry="5" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v2" />
       <rect x="10" y="10" width="4" height="4" rx="0.5" strokeWidth={1.5} />
    </svg>
  ),
  // PillOrganizer
  PillOrganizer: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="2" y="8" width="20" height="8" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8v8M10 8v8M14 8v8M18 8v8" />
    </svg>
  ),
  // DentalFloss
  DentalFloss: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8h12v10a2 2 0 01-2 2H8a2 2 0 01-2-2V8z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8c0-3 3-4 6-4s6 1 6 4" />
    </svg>
  ),
  // MaskItem
  MaskItem: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="6" width="16" height="12" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 9c0 0 2 0 2 3s-2 3-2 3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M22 9c0 0-2 0-2 3s2 3 2 3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10h12" opacity="0.3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 14h12" opacity="0.3" />
    </svg>
  ),
  // PrescriptionPad
  PrescriptionPad: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="4" width="12" height="16" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8h12" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6" opacity="0.3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15h6" opacity="0.3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 18h1" opacity="0.3" />
    </svg>
  ),
  // MedicalFolder
  MedicalFolder: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19V6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12v4M10 14h4" />
    </svg>
  ),
  // BiohazardBag
  BiohazardBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h12l1 14H5L6 6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v3m6-3v3" />
       <circle cx="12" cy="13" r="3" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v3" />
    </svg>
  ),
  // LabCoat
  LabCoat: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 4h12v16H6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8l6 3 6-3" />
    </svg>
  ),
  // HospitalID
  HospitalID: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="4" width="14" height="10" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v2" />
       <circle cx="9" cy="9" r="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 8h3M13 10h3" opacity="0.5" />
    </svg>
  ),
  // BloodBag
  BloodBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6c0-2 2-3 5-3s5 1 5 3v10c0 3-2 5-5 5s-5-2-5-5V6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 10h10" opacity="0.3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v5M10 21h4" />
    </svg>
  ),
  // ThermometerBox
  ThermometerBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="9" width="16" height="6" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12h12" opacity="0.3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 9v6" />
    </svg>
  ),
  // GloveBox
  GloveBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth={1.5} />
       <ellipse cx="12" cy="12" rx="6" ry="3" strokeWidth={1.5} />
    </svg>
  ),
  // FaceShield
  FaceShield: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8c0-2 2-3 8-3s8 1 8 3" />
    </svg>
  ),
  // Stethoscope
  Stethoscope: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3v6a5 5 0 0010 0V3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v11" />
       <circle cx="12" cy="19" r="2" strokeWidth={1.5} />
       <circle cx="7" cy="3" r="1" strokeWidth={1.5} />
       <circle cx="17" cy="3" r="1" strokeWidth={1.5} />
    </svg>
  ),
  // Inhaler
  Inhaler: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 5v10a4 4 0 004 4h4" />
       <rect x="5" y="2" width="6" height="3" rx="1" strokeWidth={1.5} />
       <rect x="14" y="14" width="6" height="6" rx="1" strokeWidth={1.5} />
    </svg>
  ),
  // BPMonitor
  BPMonitor: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="8" width="14" height="12" rx="2" strokeWidth={1.5} />
       <rect x="8" y="11" width="8" height="5" strokeWidth={1.5} opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8V4m0 0H8m4 0h4" />
    </svg>
  ),
  // PulseOximeter
  PulseOximeter: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="8" width="14" height="10" rx="3" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 14h14" opacity="0.5"/>
       <path strokeLinecap="round" strokeLinejoin="round" d="M10 11h4" strokeWidth={2}/>
    </svg>
  ),
  // GlucoseMeter
  GlucoseMeter: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="7" y="5" width="10" height="16" rx="2" strokeWidth={1.5} />
       <rect x="9" y="8" width="6" height="5" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v3" />
    </svg>
  ),
  // SyringeItem
  SyringeItem: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="8" y="7" width="8" height="12" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7V3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 3h4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19v3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 13h4" opacity="0.3"/>
    </svg>
  ),
  // BandageRoll
  BandageRoll: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="6" cy="12" rx="3" ry="6" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h12" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18h12" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 6c1.657 0 3 2.686 3 6s-1.343 6-3 6" />
    </svg>
  ),
  // MedicineCup
  MedicineCup: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6l2 12h8l2-12H6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 10h10" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14h8" opacity="0.3"/>
    </svg>
  ),
  // ContactLensCase
  ContactLensCase: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="7" cy="12" r="4" strokeWidth={1.5} />
       <circle cx="17" cy="12" r="4" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 12h2" />
    </svg>
  ),
  // HotWaterBottle
  HotWaterBottle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="7" width="12" height="14" rx="4" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 7V4h4v3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 11l6 6" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11l-6 6" opacity="0.3"/>
    </svg>
  ),
  // IcePack
  IcePack: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="6" width="14" height="12" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 6v12" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 6v12" opacity="0.3"/>
    </svg>
  ),
  // N95Mask
  N95Mask: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10c0 5 4 10 8 10s8-5 8-10-3-6-8-6-8 1-8 6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 10h2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 10h2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v6" opacity="0.3"/>
    </svg>
  ),
  // ProteinTub
  ProteinTub: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M7 6h10v14a2 2 0 01-2 2H9a2 2 0 01-2-2V6z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 4h12v2H6z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8h12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
    </svg>
  ),
  // FlowWrap
  FlowWrap: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="8" width="16" height="8" rx="1" strokeWidth={1.5} />
       <path d="M2 12h2M20 12h2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M6 8l2-2M18 8l-2-2M6 16l2 2M18 16l-2 2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  ),
  // DetergentBottle
  DetergentBottle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M6 10v10a2 2 0 002 2h8a2 2 0 002-2V10l-2-3H8l-2 3z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M14 7V4h-4v3" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M14 10h3v4h-3" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // TubeBox
  TubeBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M4 8h16l-2 8H6L4 8z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M4 8l8-4 8 4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // SpoutPouch
  SpoutPouch: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M12 2v3" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 6h10l1 14H6L7 6z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10" y="2" width="4" height="2" strokeWidth={1.5} />
    </svg>
  ),
  // PaperTube
  PaperTube: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <ellipse cx="12" cy="5" rx="5" ry="2" strokeWidth={1.5} />
      <path d="M7 5v14c0 1.1 2.24 2 5 2s5-.9 5-2V5" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10c0 1.1 2.24 2 5 2s5-.9 5-2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  ),
  // MailerBox
  MailerBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M4 8l8-4 8 4-8 4-8-4z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 8v8l8 4 8-4V8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12v8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // BurgerBox
  BurgerBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M4 9h16l-2 10H6L4 9z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9l8-5 8 5" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // SoapBox
  SoapBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="8" width="16" height="8" rx="1" strokeWidth={1.5} />
      <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // CerealBox
  CerealBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 12h4" opacity="0.5" />
    </svg>
  ),
  // SodaCan
  SodaCan: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6v12a2 1 0 002 1h6a2 1 0 002-1V6" />
      <ellipse cx="12" cy="6" rx="5" ry="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v13" opacity="0.3" />
    </svg>
  ),
  // IceCream
  IceCream: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6l1 14h8l1-14H7z" />
      <ellipse cx="12" cy="6" rx="5" ry="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v-2" />
    </svg>
  ),
  // CreamJar
  CreamJar: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10h12v7a2 2 0 01-2 2H8a2 2 0 01-2-2v-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10a2 2 0 012-2h8a2 2 0 012 2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14v2" opacity="0.3" />
    </svg>
  ),
  // PumpBottle
  PumpBottle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10v10a2 2 0 002 2h4a2 2 0 002-2V10" />
      <rect x="7" y="7" width="10" height="3" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7V4h3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 4h1" />
    </svg>
  ),
  // SprayBottle
  SprayBottle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l2 10h6l2-10" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12V9" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9l-3 1" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6h2v3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 6h4" />
    </svg>
  ),
  // Candy
  Candy: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="6" width="16" height="12" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16" opacity="0.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 6v12" opacity="0.5" />
    </svg>
  ),
  // Juice
  Juice: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8l1-4h10l1 4v12a1 1 0 01-1 1H7a1 1 0 01-1-1V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 4v-2h-3" />
    </svg>
  ),
  // CoffeePaperCup
  CoffeePaperCup: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7l2 14h8l2-14" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 7h14" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3h10l-1 4H8L7 3z" />
    </svg>
  ),
  // ShopBag
  ShopBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  // ShipBox
  ShipBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11l-8-4" opacity="0.5" />
    </svg>
  ),
  // VitaminBottle
  VitaminBottle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8v11a2 2 0 002 2h4a2 2 0 002-2V8" />
      <rect x="7" y="3" width="10" height="4" rx="1" strokeWidth={1.5} />
    </svg>
  ),
  // Dropper
  Dropper: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 11v9a2 2 0 002 2h2a2 2 0 002-2v-9" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 11h6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 3h4" />
    </svg>
  ),
  // ChipsBag
  ChipsBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5l2 14h10l2-14" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5c0-1.5 3.5-2 7-2s7 0.5 7 2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19c0 1.5 3.5 2 7 2s7-0.5 7-2" />
    </svg>
  ),
  // CoffeeBag
  CoffeeBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="6" y="5" width="12" height="16" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 9h12" />
      <circle cx="12" cy="7" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  // WineBottle
  WineBottle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10v10a2 2 0 002 2h2a2 2 0 002-2V10l-2-7h-2l-2 7z" />
      <rect x="10" y="3" width="4" height="2" strokeWidth={1.5} />
      <rect x="9.5" y="13" width="5" height="4" strokeWidth={1.5} />
    </svg>
  ),
  // LiquorBottle
  LiquorBottle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="7" y="9" width="10" height="12" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9V4h4v5" />
       <rect x="9" y="2" width="6" height="2" strokeWidth={1.5} />
    </svg>
  ),
  // Beer
  Beer: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 8V2h4v6l2 4v10H8V12l2-4z" />
    </svg>
  ),
  // Tin
  Tin: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8m18 0c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2m18 0c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2" />
    </svg>
  ),
  // Pizza
  Pizza: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16v12H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12" />
    </svg>
  ),
  // CosmeticTube
  CosmeticTube: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 18h10l-2-12H9L7 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 21h12" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 18v3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 18v3" />
    </svg>
  ),
  // Box
  Box: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  // TakeoutBox
  TakeoutBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8l2 12h10l2-12" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8l7-5 7 5" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v5" opacity="0.5" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14" opacity="0.5" />
    </svg>
  ),
  // PetBed
  PetBed: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="8" width="18" height="10" rx="4" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12h10" opacity="0.3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12c0-3 2-6 9-6s9 3 9 6" />
    </svg>
  ),
  // PetBowl
  PetBowl: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14l2 6h12l2-6H4z" />
      <ellipse cx="12" cy="14" rx="10" ry="4" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-2" opacity="0.3"/>
    </svg>
  ),
  // Collar
  Collar: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <ellipse cx="12" cy="12" rx="9" ry="6" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v2" />
      <circle cx="12" cy="21" r="1" fill="currentColor" />
      <rect x="10" y="5" width="4" height="2" strokeWidth={1.5} fill="currentColor" />
    </svg>
  ),
  // Leash
  Leash: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5h3a2 2 0 012 2v1" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 8c0 4 2 6 6 6s4 3 4 7" />
      <circle cx="20" cy="21" r="1" fill="currentColor" />
    </svg>
  ),
  // PetToy
  PetToy: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 9l12 6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7a2 2 0 100 4 2 2 0 000-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13a2 2 0 100 4 2 2 0 000-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 15l12-6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 13a2 2 0 100 4 2 2 0 000-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  ),
  // CatScratcher
  CatScratcher: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="8" y="2" width="8" height="20" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 22h16" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 6h8" opacity="0.3"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h8" opacity="0.3"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14h8" opacity="0.3"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 18h8" opacity="0.3"/>
    </svg>
  ),
  // Bandana
  Bandana: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16l-8 14L4 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6c0-2 3-3 8-3s8 1 8 3" />
    </svg>
  ),
  // PetTag
  PetTag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10a3 3 0 013 3v2a3 3 0 01-3 3H7a3 3 0 01-3-3v-2a3 3 0 013-3z" />
      <circle cx="12" cy="5" r="1.5" strokeWidth={1.5} />
      <circle cx="5" cy="11" r="2" strokeWidth={1.5} />
      <circle cx="19" cy="11" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // PetCarrier
  PetCarrier: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V10z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10V6a4 4 0 018 0v4" />
      <circle cx="12" cy="15" r="2" strokeWidth={1.5} opacity="0.5"/>
    </svg>
  ),
  // DogHoodie
  DogHoodie: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8l-2 4v6h14v-6l-2-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2a4 4 0 00-4 4v2h8V6a4 4 0 00-4-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6" opacity="0.3"/>
    </svg>
  ),
  // TreatJar
  TreatJar: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 10h10v10a2 2 0 01-2 2H9a2 2 0 01-2-2V10z" />
      <rect x="6" y="6" width="12" height="4" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v2" />
      <circle cx="12" cy="15" r="2" strokeWidth={1.5} opacity="0.5"/>
    </svg>
  ),
  // WasteBag
  WasteBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="7" y="6" width="10" height="14" rx="5" strokeWidth={1.5} />
      <circle cx="12" cy="13" r="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V3" />
      <circle cx="12" cy="3" r="1" strokeWidth={1.5} />
    </svg>
  ),
  // FeedingMat
  FeedingMat: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth={1.5} />
      <circle cx="9" cy="12" r="2" strokeWidth={1.5} opacity="0.3" strokeDasharray="1 1"/>
      <circle cx="15" cy="12" r="2" strokeWidth={1.5} opacity="0.3" strokeDasharray="1 1"/>
    </svg>
  ),
  // CatHouse
  CatHouse: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10l8-6 8 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2V10z" />
      <circle cx="12" cy="15" r="3" strokeWidth={1.5} />
    </svg>
  ),
  // DogRaincoat
  DogRaincoat: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16l-1 12H5L4 8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8V6a4 4 0 018 0v2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v12" opacity="0.3"/>
    </svg>
  ),
  // FishTank
  FishTank: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18" opacity="0.3"/>
      <circle cx="8" cy="13" r="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 13l2-1" opacity="0.5"/>
    </svg>
  ),
  // Print
  Print: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  // Card
  Card: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="5" y="4" width="14" height="16" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9h6M9 13h6M9 17h4" />
    </svg>
  ),
  // Newspaper
  Newspaper: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9" />
    </svg>
  ),
  // Menu
  Menu: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="5" y="3" width="14" height="18" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 11h6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15h3" />
    </svg>
  ),
  // Book
  Book: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  // Magazine
  Magazine: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  // Brochure
  Brochure: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 21V3l6 3v18l-6-3zm0 0L3 18V6l6 3" />
    </svg>
  ),
  // BizCard
  BizCard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="6" width="16" height="10" rx="1" strokeWidth={1.5} fill="white"/>
      <rect x="6" y="8" width="16" height="10" rx="1" strokeWidth={1.5} />
    </svg>
  ),
  // HangTag
  HangTag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 7h4l3 5-7 9-7-9 3-5h4z" />
       <circle cx="12" cy="11" r="1.5" strokeWidth={1.5} />
    </svg>
  ),
  // DoorHanger
  DoorHanger: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="7" y="3" width="10" height="18" rx="2" strokeWidth={1.5} />
       <circle cx="12" cy="7" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // EventTicket
  EventTicket: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12a2 2 0 012-2V7a2 2 0 012-2h10a2 2 0 012 2v3a2 2 0 012 2 2 2 0 01-2 2v3a2 2 0 01-2 2H7a2 2 0 01-2-2v-3a2 2 0 01-2-2z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v14" strokeDasharray="3 3" />
    </svg>
  ),
  // WallCalendar
  WallCalendar: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10h16" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 2v4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 2v4" />
    </svg>
  ),
  // Notebook
  Notebook: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  // GreetingCard
  GreetingCard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 4h-9.5A2.5 2.5 0 007 6.5V19a1 1 0 001 1h11a1 1 0 001-1V5a1 1 0 00-1-1z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 6.5l-3 2v10l4-2" />
    </svg>
  ),
  // Sticker
  Sticker: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5h-6a4 4 0 00-4 4v6a4 4 0 004 4h6a4 4 0 004-4v-6a4 4 0 00-4-4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 5l-5 5" />
    </svg>
  ),
  // Flag
  Flag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 21V3" />
    </svg>
  ),
  // Banner
  Banner: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="6" width="20" height="10" rx="1" strokeWidth={1.5} />
      <circle cx="3.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="20.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="3.5" cy="14.5" r="0.5" fill="currentColor" />
      <circle cx="20.5" cy="14.5" r="0.5" fill="currentColor" />
    </svg>
  ),
  // Poster
  Poster: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="5" y="3" width="14" height="18" rx="0" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2M15 3v2" />
    </svg>
  ),
  // Canvas
  Canvas: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="4" width="16" height="16" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 4v16M4 20h16" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 4v16" opacity="0.5"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16" opacity="0.5"/>
    </svg>
  ),
  // Bookmark
  Bookmark: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 2h10v20l-5-4-5 4V2z" />
    </svg>
  ),
  // PresentationFolder
  PresentationFolder: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="4" width="16" height="16" rx="1" strokeWidth={1.5} />
       <path d="M12 4v16" strokeWidth={1.5} opacity="0.3" />
       <path d="M4 14l6 6" strokeWidth={1.5} />
    </svg>
  ),
  // DeskCalendar
  DeskCalendar: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M5 21h14l-2-14H7L5 21z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
       <path d="M8 5V3m8 2V3" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
       <path d="M7 10h10" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
    </svg>
  ),
  // Billboard
  Billboard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="2" y="4" width="20" height="10" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v6M16 14v6" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 18h16" opacity="0.3" />
    </svg>
  ),
  // AFrame
  AFrame: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3L5 21h14L12 3z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.5 12h7" />
       <rect x="8" y="7" width="8" height="10" strokeWidth={1.5} opacity="0.5" />
    </svg>
  ),
  // BusStop
  BusStop: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h16v2H4z" />
       <rect x="13" y="6" width="7" height="12" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6v12" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 21h16" />
    </svg>
  ),
  // NeonSign
  NeonSign: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14" strokeDasharray="1 2"/>
       <rect x="3" y="8" width="18" height="8" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8V6" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 6h8" />
    </svg>
  ),
  // RollUpBanner
  RollUpBanner: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="3" width="12" height="16" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 19h16v2H4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19v-4" opacity="0.3"/>
    </svg>
  ),
  // YardSign
  YardSign: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="5" width="16" height="10" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15v6M15 15v6" />
    </svg>
  ),
  // Mascot
  Mascot: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8H6v6c0 3 2 5 6 5s6-2 6-5V8h-2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19l-2 3M15 19l2 3" />
    </svg>
  ),
  // Standee
  Standee: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4a4 4 0 100 8 4 4 0 000-8z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h8v9H8z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 21h14" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 14l2 7" opacity="0.5"/>
    </svg>
  ),
  // BladeSign
  BladeSign: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 6h4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6v8" />
       <circle cx="11" cy="10" r="5" strokeWidth={1.5} />
    </svg>
  ),
  // WindowDecal
  WindowDecal: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="4" width="16" height="16" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16" opacity="0.3"/>
       <rect x="8" y="8" width="8" height="8" rx="1" strokeWidth={1.5} fill="currentColor" fillOpacity="0.1" />
    </svg>
  ),
  // RealEstatePost
  RealEstatePost: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 21V4h8" />
       <rect x="10" y="5" width="8" height="6" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v-1" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 5v-1" />
    </svg>
  ),
  // Tent
  Tent: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3l9 6H3l9-6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 9v12" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 9v12" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 9h16v3H4z" />
    </svg>
  ),
  // TableCover
  TableCover: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8h18l-2 13H5L3 8z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l2-3h14l2 3" />
    </svg>
  ),
  // FloorDecal
  FloorDecal: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="12" cy="14" rx="8" ry="4" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v8" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14h16" opacity="0.3"/>
    </svg>
  ),
  // DigitalKiosk
  DigitalKiosk: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="7" y="3" width="10" height="18" rx="2" strokeWidth={1.5} />
       <rect x="9" y="5" width="6" height="10" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16h10" />
    </svg>
  ),
  // MenuBoard
  MenuBoard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="5" width="18" height="6" strokeWidth={1.5} />
       <rect x="3" y="13" width="18" height="6" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 2v3M19 2v3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 11v2M19 11v2" />
    </svg>
  ),
  // FenceBanner
  FenceBanner: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4l16 16M20 4L4 20" opacity="0.2"/>
       <rect x="2" y="7" width="20" height="10" strokeWidth={1.5} fill="white" fillOpacity="0.8"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10M20 7v10" />
       <circle cx="3" cy="8" r="0.5" fill="currentColor"/>
       <circle cx="21" cy="8" r="0.5" fill="currentColor"/>
       <circle cx="3" cy="16" r="0.5" fill="currentColor"/>
       <circle cx="21" cy="16" r="0.5" fill="currentColor"/>
    </svg>
  ),
  // ShelfWobbler
  ShelfWobbler: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 6h20" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 10h20" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6v3" />
       <circle cx="6" cy="14" r="3" strokeWidth={1.5} />
    </svg>
  ),
  // CarMagnet
  CarMagnet: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h18l-2-6H5L3 12z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12v6a2 2 0 002 2h14a2 2 0 002-2v-6" />
       <rect x="8" y="13" width="8" height="4" rx="0.5" strokeWidth={1.5} />
       <circle cx="6" cy="20" r="2" strokeWidth={1.5} />
       <circle cx="18" cy="20" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // MonumentSign
  MonumentSign: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="2" y="8" width="20" height="10" strokeWidth={1.5} />
       <rect x="4" y="18" width="16" height="3" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8V6" />
    </svg>
  ),
  // TableStand
  TableStand: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 4L8 20" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 20h8" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4h8" strokeDasharray="2 2" opacity="0.5"/>
       <rect x="9" y="6" width="6" height="10" transform="rotate(-15 12 11)" strokeWidth={1.5} />
    </svg>
  ),
  // FeatherFlag
  FeatherFlag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 21V3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 4c6 0 10 2 10 9s-4 7-10 7" />
    </svg>
  ),
  // Backdrop
  Backdrop: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="2" y="5" width="20" height="14" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19v3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 19v3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 19h16" opacity="0.3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 5v14" opacity="0.1" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v14" opacity="0.1" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 5v14" opacity="0.1" />
    </svg>
  ),
  // Podium
  Podium: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8h12l-1 12H7L6 8z" />
       <ellipse cx="12" cy="8" rx="6" ry="2" strokeWidth={1.5} />
    </svg>
  ),
  // Chalkboard
  Chalkboard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="4" width="14" height="16" rx="1" strokeWidth={1.5} />
       <rect x="7" y="6" width="10" height="12" fill="currentColor" opacity="0.2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21v-1" />
    </svg>
  ),
  // Lightbox
  Lightbox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="3" width="16" height="18" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 21v2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 21v2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-16 10" opacity="0.1"/>
    </svg>
  ),
  // Marquee
  Marquee: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 6l2-4h16l2 4v4H2V6z" />
       <rect x="4" y="10" width="16" height="8" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10v8M10 10v8M14 10v8M18 10v8" opacity="0.3"/>
    </svg>
  ),
  // DoorPlate
  DoorPlate: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="2" width="18" height="20" rx="1" strokeWidth={1.5} opacity="0.3" />
       <rect x="5" y="6" width="14" height="6" rx="1" strokeWidth={1.5} />
       <circle cx="18" cy="12" r="1" fill="currentColor" opacity="0.3"/>
    </svg>
  ),
  // Wayfinding
  Wayfinding: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21V3" />
       <rect x="4" y="5" width="8" height="4" rx="1" strokeWidth={1.5} />
       <rect x="12" y="11" width="8" height="4" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7h4M14 13h4" opacity="0.5"/>
    </svg>
  ),
  // SoccerBall
  SoccerBall: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <path d="M12 12l3-2 3 2-3 5-3-5 3-2z" strokeWidth={1.5} fill="currentColor" opacity="0.1" />
       <path d="M12 7v5l-4 2m8-2l-4 2m0 0v5m-5-2l5 2 5-2" strokeWidth={1.5} />
    </svg>
  ),
  // Basketball
  Basketball: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <path d="M12 3v18M3 12h18" strokeWidth={1.5} opacity="0.5"/>
       <path d="M12 3c4 0 8 4 8 9s-4 9-8 9M12 3c-4 0-8 4-8 9s4 9 8 9" strokeWidth={1.5} />
    </svg>
  ),
  // Football
  Football: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M12 2C6 2 2 6 2 12s4 10 10 10 10-4 10-10S18 2 12 2z" strokeWidth={1.5} transform="rotate(-45 12 12) scale(1 0.6)" />
       <path d="M12 2v20" strokeWidth={1.5} transform="rotate(-45 12 12)" />
       <path d="M9 10h6M9 14h6" strokeWidth={1.5} transform="rotate(-45 12 12)" />
    </svg>
  ),
  // Baseball
  Baseball: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <path d="M6 5c2 2 2 12 0 14" strokeWidth={1.5} strokeDasharray="1 2"/>
       <path d="M18 5c-2 2-2 12 0 14" strokeWidth={1.5} strokeDasharray="1 2"/>
    </svg>
  ),
  // TennisBall
  TennisBall: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <path d="M6 5a9 9 0 0 1 12 14" strokeWidth={1.5} />
       <path d="M18 5a9 9 0 0 0-12 14" strokeWidth={1.5} />
    </svg>
  ),
  // HockeyPuck
  HockeyPuck: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="12" cy="8" rx="9" ry="3" strokeWidth={1.5} />
       <path d="M3 8v8c0 1.657 4.03 3 9 3s9-1.343 9-3V8" strokeWidth={1.5} />
    </svg>
  ),
  // GolfBall
  GolfBall: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.3" />
       <circle cx="9" cy="9" r="1" fill="currentColor" opacity="0.3" />
       <circle cx="15" cy="9" r="1" fill="currentColor" opacity="0.3" />
       <circle cx="9" cy="15" r="1" fill="currentColor" opacity="0.3" />
       <circle cx="15" cy="15" r="1" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  // BoxingGlove
  BoxingGlove: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M6 4h8a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H8a2 2 0 0 1-2-2V6a2 2 0 0 1 0-2z" strokeWidth={1.5} />
       <path d="M6 12h8" strokeWidth={1.5} />
       <path d="M14 8h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" strokeWidth={1.5} />
    </svg>
  ),
  // BaseballBat
  BaseballBat: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M4 20l4-4 12-12a2 2 0 0 0-2.8-2.8L5.2 13.2 4 20z" strokeWidth={1.5} />
       <path d="M7 17l-3 3" strokeWidth={1.5} />
    </svg>
  ),
  // YogaBlock
  YogaBlock: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M4 8l8-4 8 4v10l-8 4-8-4V8z" strokeWidth={1.5} />
       <path d="M4 8l8 4 8-4" strokeWidth={1.5} />
       <path d="M12 12v10" strokeWidth={1.5} />
    </svg>
  ),
  // SportsTowel
  SportsTowel: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="4" width="12" height="16" rx="1" strokeWidth={1.5} />
       <path d="M6 8h12M6 12h12M6 16h12" strokeWidth={1.5} strokeDasharray="1 1" opacity="0.5"/>
    </svg>
  ),
  // ShakerBottle
  ShakerBottle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M7 8h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8z" strokeWidth={1.5} />
       <path d="M6 5h12v3H6z" strokeWidth={1.5} />
       <path d="M10 5V2h4v3" strokeWidth={1.5} />
       <circle cx="12" cy="14" r="2" strokeWidth={1.5} opacity="0.3" strokeDasharray="1 1"/>
    </svg>
  ),
  // Volleyball
  Volleyball: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <path d="M12 3c0 6-4 10-9 12" strokeWidth={1.5} />
       <path d="M12 3c0 6 4 10 9 12" strokeWidth={1.5} />
       <path d="M3 15c6 0 10 4 12 9" strokeWidth={1.5} />
    </svg>
  ),
  // RugbyBall
  RugbyBall: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="12" cy="12" rx="10" ry="6" strokeWidth={1.5} />
       <path d="M4 12h16" strokeWidth={1.5} opacity="0.3"/>
       <path d="M12 6v12" strokeWidth={1.5} opacity="0.3"/>
    </svg>
  ),
  // Surfboard
  Surfboard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="12" cy="12" rx="4" ry="10" strokeWidth={1.5} />
       <path d="M12 2v20" strokeWidth={1.5} />
    </svg>
  ),
  // Snowboard
  Snowboard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="8" y="2" width="8" height="20" rx="3" strokeWidth={1.5} />
       <rect x="10" y="6" width="4" height="2" strokeWidth={1.5} />
       <rect x="10" y="16" width="4" height="2" strokeWidth={1.5} />
    </svg>
  ),
  // PingPongPaddle
  PingPongPaddle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="9" r="6" strokeWidth={1.5} />
       <path d="M12 15v6" strokeWidth={1.5} strokeLinecap="round" />
       <rect x="11" y="15" width="2" height="6" strokeWidth={1.5} />
    </svg>
  ),
  // PickleballPaddle
  PickleballPaddle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="7" y="3" width="10" height="12" rx="2" strokeWidth={1.5} />
       <path d="M12 15v6" strokeWidth={1.5} strokeLinecap="round" />
       <rect x="11" y="15" width="2" height="6" strokeWidth={1.5} />
    </svg>
  ),
  // BowlingPin
  BowlingPin: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M12 2a3 3 0 0 1 3 3c0 2-1 4-1 6 0 2 2 3 2 6a4 4 0 0 1-8 0c0-3 2-4 2-6 0-2-1-4-1-6a3 3 0 0 1 3-3z" strokeWidth={1.5} />
       <path d="M9 7h6" strokeWidth={1.5} opacity="0.3" />
    </svg>
  ),
  // Dumbbell
  Dumbbell: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M6 6h12v12H6z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.0"/>
       <rect x="4" y="8" width="4" height="8" rx="1" strokeWidth={1.5} />
       <rect x="16" y="8" width="4" height="8" rx="1" strokeWidth={1.5} />
       <path d="M8 12h8" strokeWidth={1.5} />
    </svg>
  ),
  // Kettlebell
  Kettlebell: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="14" r="7" strokeWidth={1.5} />
       <path d="M8 7h8v3" strokeWidth={1.5} strokeLinecap="round" />
       <path d="M8 10V7" strokeWidth={1.5} />
       <path d="M16 10V7" strokeWidth={1.5} />
    </svg>
  ),
  // Helmet
  Helmet: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M4 12a8 8 0 0 1 16 0v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2z" strokeWidth={1.5} />
       <path d="M12 4v4" strokeWidth={1.5} />
       <path d="M8 6l2 2" strokeWidth={1.5} />
       <path d="M16 6l-2 2" strokeWidth={1.5} />
    </svg>
  ),
  // CricketBat
  CricketBat: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M12 2l-2 6v14h4V8l-2-6z" strokeWidth={1.5} />
       <path d="M11 8h2" strokeWidth={1.5} />
    </svg>
  ),
  // PunchingBag
  PunchingBag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M8 2l4 4 4-4" strokeWidth={1.5} />
       <rect x="8" y="6" width="8" height="16" rx="2" strokeWidth={1.5} />
       <path d="M8 10h8M8 18h8" strokeWidth={1.5} opacity="0.3" />
    </svg>
  ),
  // YogaBall
  YogaBall: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <path d="M7 9a6 6 0 0 1 10 0" strokeWidth={1.5} opacity="0.5" />
    </svg>
  ),
  // Trophy
  Trophy: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M8 21h8M12 17v4M6 4h12l-1 9a5 5 0 0 1-10 0L6 4z" strokeWidth={1.5} />
       <path d="M6 7H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2M18 7h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" strokeWidth={1.5} />
    </svg>
  ),
  // Medal
  Medal: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="15" r="5" strokeWidth={1.5} />
       <path d="M12 2l-3 8M12 2l3 8" strokeWidth={1.5} />
       <path d="M7 4h10" strokeWidth={1.5} />
    </svg>
  ),
  // SnowGoggles
  SnowGoggles: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="8" width="16" height="8" rx="4" strokeWidth={1.5} />
       <path d="M4 12h16" strokeWidth={1.5} opacity="0.3" />
       <path d="M20 10h3M4 10H1" strokeWidth={1.5} />
    </svg>
  ),
  // DieCutSticker
  DieCutSticker: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5l1.5 4.5h4.5l-3.5 3 1.5 4.5-4-3-4 3 1.5-4.5-3.5-3h4.5z" opacity="0.3" />
    </svg>
  ),
  // StickerSheet
  StickerSheet: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="4" width="14" height="16" rx="1" strokeWidth={1.5} />
       <circle cx="9" cy="8" r="1.5" strokeWidth={1.5} />
       <circle cx="15" cy="8" r="1.5" strokeWidth={1.5} />
       <rect x="8" y="12" width="8" height="4" rx="1" strokeWidth={1.5} />
    </svg>
  ),
  // StickerRoll
  StickerRoll: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="8" cy="12" rx="4" ry="8" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4h8" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 20h8" />
       <ellipse cx="16" cy="12" rx="4" ry="8" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8v8" opacity="0.3"/>
    </svg>
  ),
  // HoloSticker
  HoloSticker: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4l2 8 6 2-6 2-2 8-2-8-6-2 6-2z" opacity="0.5"/>
    </svg>
  ),
  // BumperSticker
  BumperSticker: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="2" y="8" width="20" height="8" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14" opacity="0.3"/>
    </svg>
  ),
  // SlapTag
  SlapTag: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="6" width="16" height="12" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10h16" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14h4" />
    </svg>
  ),
  // StickerPile
  StickerPile: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="4" width="10" height="10" rx="1" strokeWidth={1.5} transform="rotate(-10 9 9)" />
       <rect x="10" y="8" width="10" height="10" rx="1" strokeWidth={1.5} transform="rotate(15 15 13)" fill="white"/>
       <rect x="10" y="8" width="10" height="10" rx="1" strokeWidth={1.5} transform="rotate(15 15 13)" />
    </svg>
  ),
  // LaptopSkin
  LaptopSkin: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="5" width="18" height="12" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 19h20" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
  ),
  // ClearSticker
  ClearSticker: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="5" width="14" height="14" rx="2" strokeWidth={1.5} strokeDasharray="3 3"/>
       <circle cx="12" cy="12" r="4" strokeWidth={1.5} />
    </svg>
  ),
  // TransferDecal
  TransferDecal: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" opacity="0.3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7l-2 4h4l-2 4" />
       <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={1.5} strokeDasharray="2 2" />
    </svg>
  ),
  // EpoxySticker
  EpoxySticker: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4a8 8 0 0 0 0 16" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8a3 3 0 0 0-3-3" />
    </svg>
  ),
  // NameBadge
  NameBadge: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14h.01" />
    </svg>
  ),
  // KraftSticker
  KraftSticker: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" opacity="0.2" strokeDasharray="1 1"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l2 2 4-4 2 2" opacity="0.5"/>
    </svg>
  ),
  // GoldFoil
  GoldFoil: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  // GlitterSticker
  GlitterSticker: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v.01M6 12v.01M18 12v.01M9 9v.01M15 9v.01M9 15v.01M15 15v.01" opacity="0.5" />
    </svg>
  ),
  // WashiTape
  WashiTape: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="12" cy="12" rx="4" ry="4" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c4 0 8 1 8 4s-4 4-8 4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12v2c0 3-4 4-8 4s-8-1-8-4v-2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12c0-3 4-4 8-4" />
    </svg>
  ),
  // Smartphone
  Smartphone: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01" />
    </svg>
  ),
  // Tablet
  Tablet: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01" />
    </svg>
  ),
  // Laptop
  Laptop: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="4" width="18" height="12" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 20h20" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 17l20 0" />
    </svg>
  ),
  // GamingLaptop
  GamingLaptop: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="5" width="18" height="11" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 19h20l-2-3H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l1 1h2l1-1" />
    </svg>
  ),
  // Monitor
  Monitor: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="3" width="20" height="14" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 17v4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 21h8" />
    </svg>
  ),
  // Headphones
  Headphones: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14v4a2 2 0 002 2h2a2 2 0 002-2v-4a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 14v4a2 2 0 002 2h2a2 2 0 002-2v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14V9a8 8 0 1116 0v5" />
    </svg>
  ),
  // VRHeadset
  VRHeadset: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="8" width="16" height="8" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12h2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12h2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8V4m0 0l-3 2m3-2l3 2" />
    </svg>
  ),
  // Drone
  Drone: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8a3 3 0 100 6 3 3 0 000-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v4m0 6v6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6l6 4m4 4l6 4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 6l-6 4m-4 4l-6 4" />
      <circle cx="4" cy="6" r="1.5" strokeWidth={1.5} />
      <circle cx="20" cy="6" r="1.5" strokeWidth={1.5} />
      <circle cx="4" cy="18" r="1.5" strokeWidth={1.5} />
      <circle cx="20" cy="18" r="1.5" strokeWidth={1.5} />
    </svg>
  ),
  // Camera
  Camera: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  // Console
  Console: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="6" y="2" width="12" height="20" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h12" />
    </svg>
  ),
  // RetroConsole
  RetroConsole: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="8" width="20" height="8" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 12h2" />
      <rect x="12" y="10" width="4" height="4" strokeWidth={1.5} />
    </svg>
  ),
  // GamingPC
  GamingPC: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="6" y="2" width="12" height="20" rx="1" strokeWidth={1.5} />
      <rect x="9" y="5" width="6" height="10" strokeWidth={1.5} />
      <circle cx="12" cy="18" r="1" strokeWidth={1.5} />
    </svg>
  ),
  // RetroHandheld
  RetroHandheld: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth={1.5} />
      <rect x="9" y="4" width="6" height="6" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14h2M10 13v2" />
      <circle cx="14" cy="14" r="0.5" fill="currentColor" />
      <circle cx="15" cy="13" r="0.5" fill="currentColor" />
    </svg>
  ),
  // ClamshellHandheld
  ClamshellHandheld: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="5" y="4" width="14" height="12" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 16l14 0" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 16l2 4h10l2-4" />
    </svg>
  ),
  // ModernHandheld
  ModernHandheld: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={1.5} />
      <rect x="6" y="7" width="12" height="10" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12h.01" />
    </svg>
  ),
  // ArcadeCabinet
  ArcadeCabinet: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 21V9l2-5h8l2 5v12H6z" />
      <rect x="8" y="7" width="8" height="6" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 15h12l-2 6H8l-2-6z" />
    </svg>
  ),
  // Controller
  Controller: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l-1 2h2l-1-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12a1 1 0 100-2 1 1 0 000 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 14c0-2 1.5-3 3-3 .5 0 2 1 4 2 2 1 3-1 3-1s1 2 3 1c2-1 3.5-2 4-2 1.5 0 3 1 3 3s-1 4-3 4c-2 0-3-1-3-1l-2 3h-2l-2-3s-1 1-3 1c-2 0-3-2-3-4z" />
    </svg>
  ),
  // Keyboard
  Keyboard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10h2M10 10h2M14 10h2M18 10h0M6 14h2M10 14h8" />
    </svg>
  ),
  // SmartSpeaker
  SmartSpeaker: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="6" y="4" width="12" height="16" rx="4" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12h12" opacity="0.3"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 16h12" opacity="0.3"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8h12" opacity="0.3"/>
    </svg>
  ),
  // Router
  Router: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v7" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12l4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12l-4 4" />
      <rect x="4" y="15" width="16" height="4" rx="1" strokeWidth={1.5} />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  ),
  // SSD
  SSD: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="6" y="4" width="12" height="16" rx="2" strokeWidth={1.5} />
      <rect x="10" y="20" width="4" height="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8h12" />
    </svg>
  ),
  // GPU
  GPU: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="6" width="20" height="10" rx="1" strokeWidth={1.5} />
      <circle cx="7" cy="11" r="3" strokeWidth={1.5} />
      <circle cx="17" cy="11" r="3" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 16h20" opacity="0.3" />
    </svg>
  ),
  // Joystick
  Joystick: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 13V5" />
      <circle cx="12" cy="5" r="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15h14l-2 6H7l-2-6z" />
      <circle cx="8" cy="18" r="1" fill="currentColor" opacity="0.5"/>
      <circle cx="16" cy="18" r="1" fill="currentColor" opacity="0.5"/>
    </svg>
  ),
  // StreamDeck
  StreamDeck: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16l2-10h14l2 10H3z" />
      <rect x="6" y="9" width="3" height="3" rx="0.5" strokeWidth={1.5} />
      <rect x="10.5" y="9" width="3" height="3" rx="0.5" strokeWidth={1.5} />
      <rect x="15" y="9" width="3" height="3" rx="0.5" strokeWidth={1.5} />
    </svg>
  ),
  // CRT
  CRT: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="4" width="18" height="14" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7h12v8H6z" opacity="0.3"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 18h2v2h-2z" />
    </svg>
  ),
  // Microphone
  Microphone: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="9" y="2" width="6" height="12" rx="3" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14v4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 21h8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10v1a7 7 0 0014 0v-1" />
    </svg>
  ),
  // RacingWheel
  RacingWheel: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12V4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12l-6 4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12l6 4" />
      <rect x="10" y="10" width="4" height="4" rx="1" strokeWidth={1.5} fill="currentColor" />
    </svg>
  ),
  // GamingChair
  GamingChair: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3h10v12a2 2 0 01-2 2H9a2 2 0 01-2-2V3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 17v4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 21h8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10h2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 10h2" />
    </svg>
  ),
  // Hammer
  Hammer: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.5 4h-5L7 7H4v2h3l.5 3 2.5 8h4l2.5-8 .5-3h3V7h-3l-2.5-3z" /> 
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12v8" />
    </svg>
  ),
  // Drill
  Drill: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5h10v6H9l-4 8H3l2-8V5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5h4l2 3-2 3h-4V5z" />
      <circle cx="12" cy="8" r="1" strokeWidth={1.5} />
    </svg>
  ),
  // Wrench
  Wrench: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 10.5L3 18l3 3 7.5-7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 9.5c.8-2.3.3-4.5-1.5-6.3-1.8-1.8-4-2.3-6.3-1.5L14 4l-2 2 2 2 2-2 2.3 2.3z" />
    </svg>
  ),
  // TapeMeasure
  TapeMeasure: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="4" y="6" width="14" height="14" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 10h4" />
      <circle cx="11" cy="13" r="3" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 6V4" />
    </svg>
  ),
  // PaintBucket
  PaintBucket: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14l-1 12H6L5 8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8c0-2 3-3 7-3s7 1 7 3" />
    </svg>
  ),
  // PaintBrush
  PaintBrush: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="8" y="12" width="8" height="10" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12V6c0-2 2-4 4-4s4 2 4 4v6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16h8" opacity="0.3"/>
    </svg>
  ),
  // HardHat
  HardHat: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 14c0-5 4-9 9-9s9 4 9 9h-18z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5V3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 14h20" />
    </svg>
  ),
  // ToolBox
  ToolBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="8" width="18" height="12" rx="1" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8V5a1 1 0 011-1h6a1 1 0 011 1v3" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 12h4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 11h18" />
    </svg>
  ),
  // Saw
  Saw: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 18L2 12l16-8h4v6l-14 8h-4z" />
      <circle cx="18" cy="8" r="1" strokeWidth={1.5} />
    </svg>
  ),
  // Flashlight
  Flashlight: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L5 14h6v7l8-11h-6z" fill="currentColor" fillOpacity="0.1"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h12l2 12H4L6 6z" transform="rotate(90 12 12)" />
      <rect x="16" y="8" width="4" height="8" rx="1" strokeWidth={1.5} transform="rotate(90 12 12)" />
    </svg>
  ),
  // Screwdriver
  Screwdriver: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 20l-2 2-2-2 4-14h-4" transform="rotate(-45 12 12)" />
      <rect x="10" y="14" width="4" height="8" rx="1" strokeWidth={1.5} transform="rotate(-45 12 12)" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l0 10" transform="rotate(-45 12 12)"/>
    </svg>
  ),
  // Pliers
  Pliers: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c2-4 6-6 6-6M12 8c-2-4-6-6-6-6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8l4 14-3 1-1-6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8l-4 14 3 1 1-6" />
    </svg>
  ),
  // UtilityKnife
  UtilityKnife: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="6" y="10" width="16" height="6" rx="1" strokeWidth={1.5} transform="rotate(-15 14 13)" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 15l4-1" transform="rotate(-15 4 14.5)" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10l-4 4" transform="rotate(-15 4 12)" />
    </svg>
  ),
  // Level
  Level: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="2" y="8" width="20" height="8" rx="1" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8v8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 8v8" />
    </svg>
  ),
  // TrafficCone
  TrafficCone: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3L5 20h14L12 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14h6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 9h3" />
    </svg>
  ),
  // JerryCan
  JerryCan: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="5" y="6" width="14" height="16" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 6V4a2 2 0 00-2-2h-2a2 2 0 00-2 2v2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12l3-6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10h14" opacity="0.3"/>
    </svg>
  ),
  // WorkGloves
  WorkGloves: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20V9a2 2 0 012-2h1a2 2 0 012 2v1" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9a2 2 0 012-2h1a2 2 0 012 2v7" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 12a2 2 0 012-2h1a2 2 0 012 2v8a2 2 0 01-2 2H7" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14l3 3" />
    </svg>
  ),
  // Padlock
  Padlock: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="6" y="10" width="12" height="12" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10V6a4 4 0 018 0v4" />
      <circle cx="12" cy="16" r="1.5" strokeWidth={1.5} />
    </svg>
  ),
  // CircularSaw
  CircularSaw: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12l4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12H6" />
      <rect x="4" y="18" width="16" height="4" rx="1" strokeWidth={1.5} />
    </svg>
  ),
  // SafetyVest
  SafetyVest: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16M5 4l2 16h10l2-16H5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 14h14" opacity="0.5"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 10l5 4 5-4" />
    </svg>
  ),
  // BoosterPack
  BoosterPack: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="4" width="12" height="16" rx="1" strokeWidth={1.5} />
       <path d="M6 6h12M6 18h12" strokeWidth={1.5} strokeDasharray="1 2"/>
       <path d="M6 8l12 8" strokeWidth={1.5} opacity="0.3"/>
    </svg>
  ),
  // FigureBox
  FigureBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M4 8h16l-2 10H6L4 8z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M4 8l8-5 8 5" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <rect x="8" y="10" width="8" height="6" rx="1" strokeWidth={1.5} />
    </svg>
  ),
  // Skateboard
  Skateboard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="8" y="3" width="8" height="18" rx="4" strokeWidth={1.5} />
       <path d="M12 3v18" strokeWidth={1.5} opacity="0.2"/>
       <circle cx="10" cy="6" r="1" fill="currentColor"/>
       <circle cx="14" cy="6" r="1" fill="currentColor"/>
       <circle cx="10" cy="18" r="1" fill="currentColor"/>
       <circle cx="14" cy="18" r="1" fill="currentColor"/>
    </svg>
  ),
  // TeddyBear
  TeddyBear: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="9" r="4" strokeWidth={1.5} />
       <path d="M12 13c-2 0-3 2-3 5s2 4 4 4 4-1 4-4-1-5-3-5z" strokeWidth={1.5} />
       <circle cx="7" cy="7" r="1.5" strokeWidth={1.5} />
       <circle cx="17" cy="7" r="1.5" strokeWidth={1.5} />
       <path d="M9 15l-2 2M15 15l2 2" strokeWidth={1.5} strokeLinecap="round"/>
    </svg>
  ),
  // RubberDuck
  RubberDuck: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M7 14c0 3 3 5 6 5s6-2 6-5-3-4-5-4h-1c-1-3-4-4-6-2s-2 4 0 6z" strokeWidth={1.5} />
       <circle cx="10" cy="10" r="0.5" fill="currentColor" />
       <path d="M6 11l-2 1" strokeWidth={1.5} strokeLinecap="round"/>
    </svg>
  ),
  // Dice
  Dice: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M12 3l8 4.5v9l-8 4.5-8-4.5v-9L12 3z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M12 3v18" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
       <path d="M12 12l8-4.5M12 12l-8-4.5M12 12l8 4.5M12 12l-8 4.5" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
    </svg>
  ),
  // FlyingDisc
  FlyingDisc: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="12" cy="12" rx="9" ry="4" strokeWidth={1.5} />
       <ellipse cx="12" cy="12" rx="6" ry="2" strokeWidth={1.5} opacity="0.5" />
    </svg>
  ),
  // Minifigure
  Minifigure: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M9 22V11H7V8h2V5h6v3h2v3h-2v11H9z" strokeWidth={1.5} />
       <rect x="10" y="2" width="4" height="3" strokeWidth={1.5} />
    </svg>
  ),
  // BeachBall
  BeachBall: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <path d="M12 3v18" strokeWidth={1.5} opacity="0.5"/>
       <path d="M3 12h18" strokeWidth={1.5} opacity="0.5"/>
       <path d="M5.5 5.5l13 13" strokeWidth={1.5} opacity="0.5"/>
       <path d="M18.5 5.5l-13 13" strokeWidth={1.5} opacity="0.5"/>
    </svg>
  ),
  // YoYo
  YoYo: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
       <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
       <path d="M12 4v-2" strokeWidth={1.5} />
    </svg>
  ),
  // BoardGame
  BoardGame: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="4" width="16" height="12" rx="1" strokeWidth={1.5} />
       <path d="M4 16l16 4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M20 4v16" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // GameCartridge
  GameCartridge: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M4 6h16v14H4V6z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M4 10h16" strokeWidth={1.5} opacity="0.3"/>
       <path d="M8 14h8v4H8v-4z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // GameCase
  GameCase: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="3" width="12" height="18" rx="1" strokeWidth={1.5} />
       <path d="M6 7h12" strokeWidth={1.5} opacity="0.3"/>
    </svg>
  ),
  // PuzzleBox
  PuzzleBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="5" width="14" height="10" rx="1" strokeWidth={1.5} />
       <path d="M5 15l14 4" strokeWidth={1.5}/>
       <path d="M19 5v14" strokeWidth={1.5}/>
       <path d="M9 5v10m6-10v10" strokeWidth={1.5} strokeDasharray="2 2" opacity="0.5"/>
    </svg>
  ),
  // AnimeFigure
  AnimeFigure: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4a2 2 0 100 4 2 2 0 000-4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v7" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10l3-1 3 1" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 15l2 4 2-4" />
       <ellipse cx="12" cy="20" rx="6" ry="2" strokeWidth={1.5} />
    </svg>
  ),
  // Plush
  Plush: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4a3 3 0 00-3 3v1a1 1 0 01-1 1H7a3 3 0 00-3 3v4a3 3 0 003 3h10a3 3 0 003-3v-4a3 3 0 00-3-3h-1a1 1 0 01-1-1V7a3 3 0 00-3-3z" />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
      <circle cx="14" cy="10" r="1" fill="currentColor" />
    </svg>
  ),
  // CapsuleToy
  CapsuleToy: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h18" />
       <circle cx="12" cy="12" r="3" strokeWidth={1.5} opacity="0.5"/>
    </svg>
  ),
  // Bobblehead
  Bobblehead: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="7" r="4" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13l-1 4 2 5h4l2-5-1-4" />
       <rect x="8" y="21" width="8" height="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11v2" />
    </svg>
  ),
  // CardSleeve
  CardSleeve: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="4" width="12" height="16" rx="1" strokeWidth={1.5} />
       <path d="M6 4h12" strokeWidth={3} strokeOpacity="0.1" />
    </svg>
  ),
  // PuzzleCube
  PuzzleCube: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M12 3l7 4v10l-7 4-7-4V7z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M12 3v18M12 12l7-4M12 12l-7-4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M5 9l14 0" strokeWidth={1.5} strokeDasharray="1 1" opacity="0.5"/> 
    </svg>
  ),
  // Lunchbox
  Lunchbox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="7" width="16" height="12" rx="2" strokeWidth={1.5} />
       <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" strokeWidth={1.5} />
       <path d="M12 13h.01" strokeWidth={3} strokeLinecap="round"/>
    </svg>
  ),
  // DoughTub
  DoughTub: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M6 8l1 12h10l1-12H6z" strokeWidth={1.5} />
       <ellipse cx="12" cy="8" rx="6" ry="2" strokeWidth={1.5} />
       <path d="M12 8v-2" strokeWidth={1.5} />
    </svg>
  ),
  // Balloon
  Balloon: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M12 3c-4 0-7 4-7 9 0 4 3 7 7 7s7-3 7-7c0-5-3-9-7-9z" strokeWidth={1.5} />
       <path d="M12 19v3" strokeWidth={1.5} />
       <path d="M9 7c1-2 4-2 5 0" strokeWidth={1.5} opacity="0.3"/>
    </svg>
  ),
  // Kite
  Kite: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M12 2l7 8-7 12-7-12 7-8z" strokeWidth={1.5} />
       <path d="M12 2v20M5 10h14" strokeWidth={1.5} opacity="0.5"/>
       <path d="M12 22s2 2 2 4" strokeWidth={1.5} />
    </svg>
  ),
  // ArcadeStick
  ArcadeStick: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="10" width="18" height="10" rx="2" strokeWidth={1.5} />
       <circle cx="7" cy="15" r="3" strokeWidth={1.5} opacity="0.3" />
       <path d="M7 15V6" strokeWidth={1.5} />
       <circle cx="7" cy="5" r="1.5" fill="currentColor" />
       <circle cx="15" cy="13" r="1" fill="currentColor" />
       <circle cx="18" cy="13" r="1" fill="currentColor" />
       <circle cx="15" cy="16" r="1" fill="currentColor" />
       <circle cx="18" cy="16" r="1" fill="currentColor" />
    </svg>
  ),
  // ToyBlock
  ToyBlock: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="5" width="14" height="14" rx="1" strokeWidth={1.5} />
       <rect x="8" y="8" width="8" height="8" strokeWidth={1.5} />
    </svg>
  ),
  // Paddleball
  Paddleball: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="9" r="6" strokeWidth={1.5} />
       <path d="M12 15v6" strokeWidth={1.5} strokeLinecap="round" />
       <circle cx="12" cy="9" r="1" fill="currentColor" />
    </svg>
  ),
  // WaterBlaster
  WaterBlaster: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M3 10h10l2-3h4v6h-4v4h-3v-4H6l-3 4z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
       <rect x="8" y="5" width="4" height="3" rx="1" strokeWidth={1.5} />
    </svg>
  ),
  // SpinningTop
  SpinningTop: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M12 2l7 7-7 13-7-13 7-7z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M12 2v4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M5 9h14" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
    </svg>
  ),
  // SlimeJar
  SlimeJar: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M7 8h10v12a2 2 0 01-2 2H9a2 2 0 01-2-2V8z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M6 5h12v3H6z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M8 8c0 2 2 3 4 3s4-1 4 3" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </svg>
  ),
  // FidgetSpinner
  FidgetSpinner: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
       <circle cx="12" cy="5" r="2" strokeWidth={1.5} />
       <circle cx="6" cy="16" r="2" strokeWidth={1.5} />
       <circle cx="18" cy="16" r="2" strokeWidth={1.5} />
       <path d="M12 9v-2M9 13.5l-2 1M15 13.5l2 1" strokeWidth={1.5} opacity="0.3"/>
    </svg>
  ),
  // DollBox
  DollBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="2" width="12" height="20" rx="1" strokeWidth={1.5} />
       <path d="M8 4h8v16H8z" strokeWidth={1.5} opacity="0.5"/>
       <path d="M6 18h12" strokeWidth={1.5} opacity="0.3"/>
    </svg>
  ),
  // Binder
  Binder: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="5" y="3" width="14" height="18" rx="1" strokeWidth={1.5} />
       <path d="M8 3v18" strokeWidth={1.5} />
       <circle cx="6.5" cy="6" r="0.5" fill="currentColor" />
       <circle cx="6.5" cy="12" r="0.5" fill="currentColor" />
       <circle cx="6.5" cy="18" r="0.5" fill="currentColor" />
    </svg>
  ),
  // RCController
  RCController: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path d="M4 12h16v8H4z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M6 12V8l2-4M18 12V8l-2-4" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
       <circle cx="8" cy="16" r="2" strokeWidth={1.5} />
       <circle cx="16" cy="16" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // ChessBoard
  ChessBoard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="3" width="18" height="18" strokeWidth={1.5} />
       <path d="M9 3v18M15 3v18M3 9h18M3 15h18" strokeWidth={1.5} opacity="0.5"/>
    </svg>
  ),
  // DominoBox
  DominoBox: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="4" y="8" width="16" height="8" rx="1" strokeWidth={1.5} />
       <rect x="8" y="10" width="2" height="4" rx="0.5" strokeWidth={1.5} fill="currentColor" opacity="0.3"/>
       <rect x="11" y="10" width="2" height="4" rx="0.5" strokeWidth={1.5} fill="currentColor" opacity="0.3"/>
       <rect x="14" y="10" width="2" height="4" rx="0.5" strokeWidth={1.5} fill="currentColor" opacity="0.3"/>
    </svg>
  ),
  // MagicBall
  MagicBall: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <path d="M12 7l3 5h-6z" strokeWidth={1.5} fill="currentColor" opacity="0.3"/>
    </svg>
  ),
  // DartBoard
  DartBoard: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
       <circle cx="12" cy="12" r="6" strokeWidth={1.5} opacity="0.3"/>
       <circle cx="12" cy="12" r="3" strokeWidth={1.5} opacity="0.5"/>
       <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  // Sedan
  Sedan: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14l-2.5-5h-9L5 12z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z" />
       <circle cx="7" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="17" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // Van
  Van: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="7" width="18" height="10" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7v10" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7l6 3" />
       <circle cx="7" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="17" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // Pickup
  Pickup: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h5l2-4h5l1 4h2v5H4v-5z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12h-6v-4" />
       <circle cx="7" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="17" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // BoxTruck
  BoxTruck: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="5" width="12" height="12" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9h4l2 3v5h-6V9z" />
       <circle cx="7" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="18" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // Bus
  Bus: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="6" width="18" height="11" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 11h18" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 17v2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 17v2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6v5" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6v5" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 6v5" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 6v5" />
    </svg>
  ),
  // SportsCar
  SportsCar: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13l2-4h14l2 4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 13h20v4a1 1 0 01-1 1H3a1 1 0 01-1-1v-4z" />
       <circle cx="6" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="18" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // Motorcycle
  Motorcycle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="5" cy="16" r="3" strokeWidth={1.5} />
       <circle cx="19" cy="16" r="3" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 16l4-7h5l3 4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9l-2 3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 13h5" />
    </svg>
  ),
  // Bicycle
  Bicycle: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="5" cy="16" r="3" strokeWidth={1.5} />
       <circle cx="19" cy="16" r="3" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 16l4-8h5l-2 8" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16h7" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8l-2-2" />
    </svg>
  ),
  // Plane
  Plane: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8z" />
    </svg>
  ),
  // FoodTruck
  FoodTruck: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="2" y="5" width="14" height="12" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 9h4l2 3v5h-6V9z" />
       <rect x="4" y="8" width="10" height="5" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 13l10 2" opacity="0.3"/>
       <circle cx="6" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="19" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // Trailer
  Trailer: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="2" y="6" width="16" height="11" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 14h4" />
       <circle cx="8" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="12" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // Boat
  Boat: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 14l3 6h14l3-6H2z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14V4l5 10" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4L7 14" />
    </svg>
  ),
  // Scooter
  Scooter: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="17" cy="19" r="2" strokeWidth={1.5} />
       <circle cx="7" cy="19" r="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 19H7V5h6" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5h4" />
    </svg>
  ),
  // RV
  RV: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="2" y="6" width="20" height="11" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 6V4h-6" />
       <circle cx="6" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="18" cy="17" r="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 9h4" opacity="0.3"/>
    </svg>
  ),
  // Subway
  Subway: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 18l2 4M19 18l-2 4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 14h18" opacity="0.3"/>
       <rect x="6" y="8" width="4" height="4" strokeWidth={1.5} />
       <rect x="14" y="8" width="4" height="4" strokeWidth={1.5} />
    </svg>
  ),
  // Helicopter
  Helicopter: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="12" cy="12" rx="7" ry="5" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7V4M4 4h16" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 12h3M5 15l-2 2h8" />
    </svg>
  ),
  // GolfCart
  GolfCart: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16h12l-1-7H5z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 9V4h10v5" />
       <circle cx="6" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="15" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // RaceCar
  RaceCar: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 14h20l-2-4H4z" />
       <circle cx="6" cy="15" r="2" strokeWidth={1.5} />
       <circle cx="18" cy="15" r="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 10l2-3H6" />
    </svg>
  ),
  // Taxi
  Taxi: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14l-2.5-5h-9L5 12z" />
       <rect x="10" y="5" width="4" height="2" strokeWidth={1.5} fill="currentColor" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z" />
       <circle cx="7" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="17" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // Tractor
  Tractor: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="16" cy="15" r="4" strokeWidth={1.5} />
       <circle cx="6" cy="17" r="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 17h6v-6H8l-3 4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11h6V8h-2V5" />
    </svg>
  ),
  // Forklift
  Forklift: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 18h10V8H8l-2 4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 8v10M17 18V6M17 14h4" />
       <circle cx="7" cy="18" r="2" strokeWidth={1.5} />
       <circle cx="12" cy="18" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // JetSki
  JetSki: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l3-3h6l4 3H4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 13l2-4h3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 18h18" opacity="0.3"/>
    </svg>
  ),
  // Ambulance
  Ambulance: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="3" y="6" width="18" height="11" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 11h18" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v4m-2-2h4" />
       <circle cx="7" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="17" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // PoliceCar
  PoliceCar: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14l-2.5-5h-9L5 12z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z" />
       <rect x="10" y="5" width="4" height="1" strokeWidth={1.5} fill="currentColor" />
       <circle cx="7" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="17" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // FireTruck
  FireTruck: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="2" y="8" width="16" height="9" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 11h4v6h-4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8l10-4" />
       <circle cx="6" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="14" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // SchoolBus
  SchoolBus: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="2" y="6" width="20" height="11" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12h20" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M22 14v3" />
       <circle cx="6" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="18" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // SemiTruck
  SemiTruck: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="14" y="8" width="8" height="9" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 6h12v11H2z" />
       <circle cx="5" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="9" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="18" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // Tanker
  Tanker: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="16" y="10" width="6" height="7" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 8h12v9H2z" rx="3" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h2" />
       <circle cx="6" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="10" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="19" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // DumpTruck
  DumpTruck: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 10h6v7h-6z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 6l12 3v5H2z" />
       <circle cx="19" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="6" cy="17" r="2" strokeWidth={1.5} />
       <circle cx="10" cy="17" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // Train
  Train: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <rect x="6" y="4" width="12" height="16" rx="2" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 16h12" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-2 2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 20l2 2" />
       <circle cx="12" cy="12" r="2" strokeWidth={1.5} />
    </svg>
  ),
  // Yacht
  Yacht: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 14l4 5h12l4-5H2z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 14V8l12 6" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 8V5h4v3" />
    </svg>
  ),
  // HotAirBalloon
  HotAirBalloon: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2C7.58 2 4 5.58 4 10c0 4.42 4 8 8 10s8-3.58 8-8c0-4.42-3.58-8-8-8z" />
       <rect x="10" y="20" width="4" height="3" rx="1" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v18" opacity="0.3"/>
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 10h16" opacity="0.3"/>
    </svg>
  ),
  // Blimp
  Blimp: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <ellipse cx="12" cy="10" rx="10" ry="6" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h8" opacity="0.3"/>
       <rect x="10" y="16" width="4" height="2" strokeWidth={1.5} />
    </svg>
  ),
  // Snowmobile
  Snowmobile: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14l3-2h5l4 2h4" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 18h8" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h8l2-2" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 8l-2 4" />
    </svg>
  ),
  // ATV
  ATV: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <circle cx="6" cy="16" r="3" strokeWidth={1.5} />
       <circle cx="18" cy="16" r="3" strokeWidth={1.5} />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 16l4-6h4l4 6" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10V7h4" />
    </svg>
  ),
  // TukTuk
  TukTuk: (props) => (
    <svg className={props.className || "ms-icon-md"} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 10h-6l-2 4v4h10v-4z" />
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10L10 4h6" />
       <circle cx="18" cy="18" r="2" strokeWidth={1.5} />
       <circle cx="6" cy="18" r="2" strokeWidth={1.5} />
    </svg>
  ),
};
