import React from "react";

// ─── AUTHENTIC BRAND SVG ICONS FOR UI PREVIEWS ──────────────────────────────
export const BrandIcons = {
  ql: (
    <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-[#ff6600] to-[#ff3300] flex items-center justify-center text-white font-black text-xs shadow-md">
      LS
    </div>
  ),
  facebook: (
    <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  instagram: (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <defs>
        <radialGradient id="ig-ui-grad" cx="20%" cy="100%" r="150%">
          <stop offset="0%" stopColor="#ffd600" />
          <stop offset="25%" stopColor="#ff7a00" />
          <stop offset="50%" stopColor="#ff0069" />
          <stop offset="75%" stopColor="#d300c5" />
          <stop offset="100%" stopColor="#7638fa" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig-ui-grad)" />
      <path
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
        fill="#ffffff"
      />
    </svg>
  ),
  twitter: (
    <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  whatsapp: (
    <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.225-.652.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.085-.175-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.151-.175.201-.301.301-.501.101-.2.05-.376-.025-.527-.075-.15-.677-1.633-.928-2.235-.244-.587-.492-.507-.677-.517-.175-.009-.376-.01-.577-.01-.2 0-.527.075-.802.376s-1.054 1.03-1.054 2.511c0 1.48 1.079 2.91 1.229 3.11.15.2 2.124 3.243 5.147 4.549.719.31 1.28.496 1.718.635.722.23 1.379.197 1.898.12.578-.087 1.78-.728 2.031-1.431.251-.703.251-1.305.176-1.431-.076-.126-.276-.201-.577-.351zm-5.467 7.618c-2.02 0-4-.543-5.733-1.572l-.411-.244-4.261 1.117 1.137-4.153-.267-.425c-1.13-1.8-1.727-3.896-1.727-6.043 0-6.25 5.086-11.336 11.337-11.336 3.029 0 5.877 1.18 8.019 3.323 2.143 2.143 3.323 4.991 3.323 8.02 0 6.251-5.086 11.338-11.337 11.338z" />
    </svg>
  ),
  tiktok: (
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.064-.093a2.895 2.895 0 0 1 2.37-4.547c.307 0 .604.05.882.143V9.37a6.34 6.34 0 0 0-.882-.062 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.718a8.214 8.214 0 0 0 4.77 1.522V6.795a4.78 4.78 0 0 1-1.001-.109z" />
    </svg>
  ),
  youtube: (
    <svg className="w-5 h-5 text-[#FF0000]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  linkedin: (
    <svg className="w-5 h-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.79v-7.6H6.46M7.86 6.3a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
    </svg>
  ),
  spotify: (
    <svg className="w-5 h-5 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 17.3c-.2.4-.7.5-1.1.3-3-1.8-6.8-2.2-11.3-1.2-.5.1-.9-.2-1-.7-.1-.5.2-.9.7-1 4.9-1.1 9.1-.6 12.4 1.4.4.3.5.8.3 1.2zm1.5-3.3c-.3.4-.9.6-1.3.3-3.4-2.1-8.7-2.7-12.7-1.5-.5.1-1-.2-1.2-.7-.1-.5.2-1 .7-1.2 4.7-1.4 10.5-.8 14.3 1.6.4.3.5.9.2 1.5zm.1-3.4c-4.1-2.4-10.9-2.7-14.8-1.5-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.6-1.4 12.1-1.1 16.8 1.7.5.3.7 1.1.4 1.6-.3.6-1.1.8-1.7.5z" />
    </svg>
  ),
  telegram: (
    <svg className="w-5 h-5 text-[#24A1DE]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.939z" />
    </svg>
  ),
  discord: (
    <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  ),
  snapchat: (
    <svg className="w-5 h-5 text-[#FFFC00]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.206.5c-4.455 0-7.393 3.195-7.393 6.945 0 1.488.58 2.871 1.042 3.632.147.241.188.423.077.625-.13.235-.494.618-1.227.915-.55.223-.92.428-1.107.614-.242.242-.258.54-.055.856.402.628 1.498 1.012 3.26 1.144.17.013.29.135.25.293-.16.634-.45 1.547-1.92 2.012-.41.13-.58.38-.49.7.13.46.73.68 1.77.68.85 0 1.63-.12 2.37-.36.21-.07.36.03.44.22.37.91 1.41 1.52 3.01 1.52 1.59 0 2.62-.61 3-1.52.08-.19.23-.29.44-.22.74.24 1.52.36 2.37.36 1.04 0 1.64-.22 1.77-.68.09-.32-.08-.57-.49-.7-1.47-.465-1.76-1.378-1.92-2.012-.04-.158.08-.28.25-.293 1.762-.132 2.858-.516 3.26-1.144.203-.316.187-.614-.055-.856-.187-.186-.557-.391-1.107-.614-.733-.297-1.097-.68-1.227-.915-.111-.202-.07-.384.077-.625.462-.761 1.042-2.144 1.042-3.632C19.599 3.695 16.661.5 12.206.5z" />
    </svg>
  ),
  github: (
    <svg className="w-5 h-5 text-neutral-200" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  ),
  apple: (
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.3c.63-.78 1.06-1.87.94-2.96-.91.04-2.02.61-2.67 1.39-.56.67-.99 1.77-.86 2.83 1.01.08 2.05-.51 2.59-1.26z" />
    </svg>
  ),
  paypal: (
    <svg className="w-5 h-5 text-[#0079C1]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.45A.802.802 0 0 1 5.736 1.8h6.417c2.138 0 3.733.483 4.743 1.436.96.906 1.378 2.238 1.243 3.96-.285 3.64-2.576 5.643-6.079 5.643H9.282a.802.802 0 0 0-.792.677l-.986 6.242a.641.641 0 0 1-.428.579zm11.517-13.71c-.085-.275-.195-.536-.33-.781-.925-1.688-2.868-2.336-5.783-2.336H8.258a.802.802 0 0 0-.792.677L5.59 17.502a.641.641 0 0 0 .633.74h3.693l.732-4.636a.802.802 0 0 1 .792-.677h2.181c2.946 0 5.253-1.196 5.92-4.524.28-1.397.16-2.58-.948-3.418z" />
    </svg>
  ),
  google: (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.35 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        fill="#EA4335"
      />
    </svg>
  ),
  stripe: (
    <div className="w-6 h-6 rounded-[6px] bg-[#635BFF] flex items-center justify-center text-white font-black text-sm italic shadow-xs">
      S
    </div>
  ),
  shopify: (
    <svg className="w-5 h-5 text-[#95BF47]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.78 6.06a.82.82 0 0 0-.74-.16l-2.01.56c-.14-.42-.34-.88-.62-1.32-.98-1.58-2.45-2.42-4.15-2.42-.09 0-.18 0-.27.01-1.33.1-2.61.94-3.59 2.38-.69 1.01-1.16 2.25-1.38 3.51l-2.73.76a.82.82 0 0 0-.58.74c-.03.53-1.63 13.32-1.63 13.32a.5.5 0 0 0 .17.46.5.5 0 0 0 .46.19h16.16a.5.5 0 0 0 .46-.19.5.5 0 0 0 .17-.46L20.5 6.89a.82.82 0 0 0-.72-.83zm-7.67-1.55c1.17 0 2.19.67 2.87 1.83.48.8.73 1.76.81 2.77l-6.33 1.76c.32-2.09 1.35-4.22 2.65-6.36zm-1.5 6.8l3.63-1 2.16 11.46H7.83l2.78-10.46z" />
    </svg>
  ),
  amazon: (
    <div className="w-6 h-6 rounded-[6px] bg-[#232F3E] flex flex-col items-center justify-center text-[#FF9900] font-bold text-[10px] leading-tight shadow-xs">
      <span className="text-white text-[11px] -mb-1 font-serif">a</span>
      <span>⌣</span>
    </div>
  ),
  visa: (
    <div className="w-7 h-5 rounded-[4px] bg-[#1A1F71] text-white flex items-center justify-center font-black text-[9px] tracking-wider shadow-xs border border-[#F7B600]/30">
      VISA
    </div>
  ),
  mastercard: (
    <div className="flex items-center -space-x-1.5 justify-center">
      <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
      <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B]/90" />
    </div>
  ),
  twitch: (
    <svg className="w-5 h-5 text-[#9146FF]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.15 0L.54 4.12v16.48h5.37V24l3.76-3.4h4.3l7.52-7.52V0H2.15zm17.2 11.82l-3.76 3.76H11.3l-3.23 3.23v-3.23H4.84V2.15h14.51v9.67zM14.51 5.37h-2.15v5.38h2.15V5.37zm-5.37 0H6.99v5.38h2.15V5.37z" />
    </svg>
  ),
  reddit: (
    <svg className="w-5 h-5 text-[#FF4500]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.56 12 8 12.56 8 13.25c0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm5.5 0c-.69 0-1.25.56-1.25 1.25 0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm-5.46 3.69c-.1.1-.1.28 0 .38.79.79 2.05 1.03 2.71 1.03.66 0 1.92-.24 2.71-1.03.1-.1.1-.28 0-.38-.1-.1-.28-.1-.38 0-.68.68-1.78.89-2.33.89-.55 0-1.65-.21-2.33-.89a.27.27 0 0 0-.38 0z" />
    </svg>
  ),
  threads: (
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.186 24h-.007C5.463 23.975.006 18.506 0 11.783 0 5.087 5.488-.354 12.213-.354c6.643 0 11.787 5.228 11.787 11.961 0 1.15-.157 2.302-.468 3.424a1.218 1.218 0 0 1-1.173.892 1.217 1.217 0 0 1-1.196-1.233c.272-.98.41-1.99.41-3.003 0-5.385-4.062-9.525-9.36-9.525-5.397 0-9.777 4.391-9.777 9.789 0 5.422 4.356 9.814 9.757 9.839 2.744.012 5.343-1.097 7.14-3.045a1.218 1.218 0 0 1 1.776 1.666C18.669 22.84 15.513 24 12.186 24zm2.84-14.88c-.37-.217-.82-.338-1.32-.338-1.896 0-3.328 1.488-3.328 3.456 0 1.942 1.406 3.456 3.328 3.456.974 0 1.792-.44 2.292-1.232v.944c0 1.728-1.077 2.736-2.71 2.736-1.033 0-1.815-.466-2.146-1.272a1.22 1.22 0 0 1 .632-1.593 1.216 1.216 0 0 1 1.594.632c.074.18.29.397.66.397.712 0 1.23-.497 1.23-1.498v-4.526a1.217 1.217 0 0 1 1.217-1.217 1.217 1.217 0 0 1 1.217 1.217v.754c.642.714 1.56 1.135 2.58 1.135 2.14 0 3.73-1.688 3.73-3.978 0-2.316-1.616-4.07-3.95-4.07-2.02 0-3.6 1.282-4.02 3.003-.09.37-.18.74-.23 1.12zm-1.81 4.542c-.792 0-1.353-.61-1.353-1.464 0-.853.56-1.464 1.353-1.464.792 0 1.353.61 1.353 1.464 0 .854-.56 1.464-1.353 1.464z" />
    </svg>
  ),
  slack: (
    <div className="grid grid-cols-2 gap-0.5 w-5 h-5 items-center justify-center p-0.5">
      <div className="w-2 h-2 rounded-xs bg-[#36C5F0]" />
      <div className="w-2 h-2 rounded-xs bg-[#ECB22E]" />
      <div className="w-2 h-2 rounded-xs bg-[#2EB67D]" />
      <div className="w-2 h-2 rounded-xs bg-[#E01E5A]" />
    </div>
  ),
  notion: (
    <div className="w-6 h-6 rounded-[6px] bg-white text-black flex items-center justify-center font-black text-xs font-serif shadow-xs">
      N
    </div>
  ),
  airbnb: (
    <svg className="w-5 h-5 text-[#FF5A5F]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C7.58 0 4 3.58 4 8c0 4.2 4.48 9.39 7.42 12.39.32.33.84.33 1.16 0C15.52 17.39 20 12.2 20 8c0-4.42-3.58-8-8-8zm0 11.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 4.5 12 4.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
    </svg>
  ),
  uber: (
    <div className="w-6 h-6 rounded-[6px] bg-black text-white flex items-center justify-center font-bold text-[9px] shadow-xs border border-white/20">
      Uber
    </div>
  ),
  nextjs: (
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.82 17.585L10.75 8.167v-.002h-.833v7.668H8.5V6.167h1.417l7.583 10.083c-.55.45-1.11.89-1.68 1.335zM14.5 6.167h1.417v5.5H14.5v-5.5z" />
    </svg>
  ),
  react: (
    <div className="w-6 h-6 rounded-[6px] bg-[#20232A] flex items-center justify-center">
      <svg className="w-5 h-5 text-[#61DAFB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(0 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      </svg>
    </div>
  ),
  vue: (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M2 3h4l6 10.5L18 3h4L12 21 2 3z" fill="#42B883" />
      <path d="M6.5 3h3.5l2 3.5 2-3.5h3.5L12 12.5 6.5 3z" fill="#35495E" />
    </svg>
  ),
  angular: (
    <svg className="w-5 h-5 text-[#DD0031]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5L2.5 5.8l1.4 12.3L12 22.5l8.1-4.4 1.4-12.3L12 2.5zm0 3.3l4.3 9.6h-1.8l-.9-2.2H10.4l-.9 2.2H7.7L12 5.8zm1.1 5.8L12 8.9l-1.1 2.7h2.2z" />
    </svg>
  ),
  svelte: (
    <svg className="w-5 h-5 text-[#FF3E00]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.6 8.3c-.6-1.5-1.7-2.6-3.2-3.3-1.6-.7-3.4-.8-5.3-.2l-4.1 1.4c-1.3.4-2.4 1.2-3.1 2.2-.7 1-.9 2.2-.7 3.3.2 1.3 1 2.4 2.1 3.2l.9.6-1.6 1.1c-1.4 1-2.3 2.5-2.5 4.2-.2 1.7.4 3.4 1.6 4.6 1.4 1.4 3.4 2.1 5.4 1.9 1.8-.2 3.5-1.1 4.7-2.5l4-4.8c1.1-1.3 1.6-2.9 1.5-4.5-.1-1.6-.9-3.1-2.2-4.1l-1.5-1.1 3-2zm-3.8 6.4l-4 4.8c-.8.9-1.9 1.5-3.1 1.6-1.3.1-2.6-.4-3.5-1.3-.8-.8-1.2-1.9-1.1-3 .1-1.1.7-2.1 1.6-2.7l3.6-2.5 3.3 2.2c1.4 1 2.4 1.1 3.2.9zm-4.3-5.8l-3.3-2.2c-.8-.5-1.3-1.2-1.4-2-.1-.7.1-1.4.5-2 .5-.7 1.2-1.2 2.1-1.5l4.1-1.4c1.2-.4 2.4-.3 3.4.1.9.4 1.7 1.2 2.1 2.1.4.9.4 2 0 3l-3.6 2.5-3.9-1.6z" />
    </svg>
  ),
  tanstack: (
    <div className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-[#FF4154] to-[#FF8D3B] flex items-center justify-center text-white font-black text-[9px] shadow-xs">
      TS
    </div>
  ),
  prisma: (
    <div className="w-6 h-6 rounded-[6px] bg-[#0C344B] flex items-center justify-center text-[#2DD4BF]">
      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.75 3.5L3.75 18.25a1.5 1.5 0 0 0 1.3 2.25h13.9a1.5 1.5 0 0 0 1.3-2.25L13.75 3.5z" />
      </svg>
    </div>
  ),
  mongodb: (
    <div className="w-6 h-6 rounded-[6px] bg-[#001E2B] flex items-center justify-center">
      <svg className="w-4 h-4 text-[#00ED64]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1.5c-4.5 7.5-3.8 12.2 0 21 3.8-8.8 4.5-13.5 0-21zm-.5 19.8c-2.8-5.8-3.2-9.8 0-16.5v16.5zm1 0V4.8c3.2 6.7 2.8 10.7 0 16.5z" />
      </svg>
    </div>
  ),
  postgres: (
    <div className="w-6 h-6 rounded-[6px] bg-[#336791] flex items-center justify-center text-white font-black text-[9px]">
      PG
    </div>
  ),
  supabase: (
    <div className="w-6 h-6 rounded-[6px] bg-[#1C1C1C] flex items-center justify-center">
      <svg className="w-4 h-4 text-[#3ECF8E]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.2 1.5L3 13.8a.6.6 0 0 0 .5.9h7.3L9.5 22.5l11.5-12.3a.6.6 0 0 0-.5-.9H12.8l1.6-7.8a.6.6 0 0 0-1.2 0z" />
      </svg>
    </div>
  ),
  tailwind: (
    <div className="w-6 h-6 rounded-[6px] bg-[#0F172A] flex items-center justify-center">
      <svg className="w-4.5 h-4.5 text-[#38BDF8]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.335 6.182 14.974 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C7.666 17.818 9.027 19.2 12.001 19.2c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.335 13.382 8.974 12 6.001 12z" />
      </svg>
    </div>
  ),
  nodejs: (
    <div className="w-6 h-6 rounded-[6px] bg-[#222222] flex items-center justify-center">
      <svg className="w-4 h-4 text-[#5FA04E]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.5L3 7.7v10.4l9 5.2 9-5.2V7.7L12 2.5zm5.5 13.8c-.8.8-2 1.2-3.5 1.2h-2.5v-7h2.5c1.5 0 2.7.4 3.5 1.2.8.8 1.2 1.9 1.2 3.3s-.4 2.5-1.2 3.3z" />
      </svg>
    </div>
  ),
  typescript: (
    <div className="w-6 h-6 rounded-[6px] bg-[#3178C6] flex items-center justify-center text-white font-bold text-[10px] shadow-xs">
      TS
    </div>
  ),
  python: (
    <div className="w-6 h-6 rounded-[6px] bg-[#1E293B] flex items-center justify-center">
      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
        <path d="M11.9 1.5c-3.1 0-2.9 1.3-2.9 1.3l.01 1.4h2.9v.4H6.2s-1.8.2-1.8 2.6 1.6 2.6 1.6 2.6h1v-1.2c0-1.4 1.2-1.4 1.2-1.4h3.1c1.2 0 1.2-.9 1.2-.9v-3.4c0-1.4-1.2-1.4-1.2-1.4zm-1.6 1c.3 0 .6.2.6.5s-.3.6-.6.6-.6-.3-.6-.6.3-.5.6-.5z" fill="#3776AB" />
        <path d="M12.1 22.5c3.1 0 2.9-1.3 2.9-1.3l-.01-1.4h-2.9v-.4h5.7s1.8-.2 1.8-2.6-1.6-2.6-1.6-2.6h-1v1.2c0 1.4-1.2 1.4-1.2 1.4H12.7c-1.2 0-1.2.9-1.2.9v3.4c0 1.4 1.2 1.4 1.2 1.4zm1.6-1c-.3 0-.6-.2-.6-.5s.3-.6.6-.6.6.3.6.6-.3.5-.6.5z" fill="#FFD438" />
      </svg>
    </div>
  ),
  docker: (
    <div className="w-6 h-6 rounded-[6px] bg-[#2496ED] flex items-center justify-center">
      <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.9 12.5h-1.6v-1.6h1.6v1.6zm-2.1 0h-1.6v-1.6h1.6v1.6zm-2.1 0H8.1v-1.6h1.6v1.6zm4.2-2.1h-1.6V8.8h1.6v1.6zm-2.1 0h-1.6V8.8h1.6v1.6zm-2.1 0H8.1V8.8h1.6v1.6zm6.3 2.1h-1.6v-1.6h1.6v1.6zm-2.1-4.2h-1.6V6.7h1.6v1.6zm7.8 4.2c-.3-.2-1.3-.3-2.1.3-.2-.8-.7-1.5-1.5-1.9l-.6-.3-.4.5c-.3.4-.6 1.1-.4 1.9-1.2.1-2.3.5-3.3 1.2H2.5c-.4 1.2.1 3.2 1.8 4.8 2.2 2 5.5 2.2 8.5 2.1 3.9-.2 7.1-2.5 8.2-5.4.7-.2 1.8-.7 2.1-1.6l-.1-.4-.6-.2z" />
      </svg>
    </div>
  ),
  cloudflare: (
    <div className="w-6 h-6 rounded-[6px] bg-white flex items-center justify-center shadow-xs">
      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
        <path d="M18.4 11.2c-.4-2.5-2.5-4.4-5.1-4.4-1.8 0-3.3.9-4.2 2.3-.3-.1-.7-.1-1-.1-2.1 0-3.8 1.6-4.1 3.6-1.7.5-2.9 2-2.9 3.8 0 2.2 1.8 4 4 4h13.1c2.1 0 3.8-1.7 3.8-3.8 0-2.1-1.6-3.8-3.6-4.4z" fill="#F38020" />
      </svg>
    </div>
  ),
  vercel: (
    <div className="w-6 h-6 rounded-[6px] bg-black flex items-center justify-center">
      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L22 20H2L12 2z" />
      </svg>
    </div>
  ),
  openai: (
    <div className="w-6 h-6 rounded-[6px] bg-[#10A37F] flex items-center justify-center">
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.28 9.82a6 6 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a6 6 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 6 6 0 0 0 .52 4.91 6.05 6.05 0 0 0 6.52 2.9A6 6 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.2 6 6 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.08zM13.26 22.4a4.47 4.47 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.8.8 0 0 0 .4-.7v-6.74l2.02 1.17v5.67a4.5 4.5 0 0 1-4.46 4.48zm-8.8-3.8a4.46 4.46 0 0 1-.54-3.02l.14.08 4.78 2.76a.8.8 0 0 0 .8 0l5.84-3.37v2.33l-4.9 2.84a4.5 4.5 0 0 1-6.12-1.62zM3.4 8.7a4.47 4.47 0 0 1 2.34-1.97v5.7l-2.02 1.16V8.7zm14.1 3.73l-5.84 3.37-5.84-3.37 5.84-3.37 5.84 3.37zm1.1-1.92l-4.78-2.76a.8.8 0 0 0-.8 0L7.18 11.1V8.77l4.9-2.83a4.5 4.5 0 0 1 6.12 1.62 4.45 4.45 0 0 1 .54 3.02l-.2-.07zm2.4 4.8a4.47 4.47 0 0 1-2.34 1.96v-5.7l2.02-1.16v4.9z" />
      </svg>
    </div>
  ),
  anthropic: (
    <div className="w-6 h-6 rounded-[6px] bg-[#D97757] flex items-center justify-center text-white font-serif font-black text-xs">
      A
    </div>
  ),
  gemini: (
    <div className="w-6 h-6 rounded-[6px] bg-[#1A1B2F] flex items-center justify-center">
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="gem-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4E80EE" />
            <stop offset="50%" stopColor="#9B72CF" />
            <stop offset="100%" stopColor="#E879F9" />
          </linearGradient>
        </defs>
        <path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z" fill="url(#gem-grad)" />
      </svg>
    </div>
  ),
  midjourney: (
    <div className="w-6 h-6 rounded-[6px] bg-black flex items-center justify-center">
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.5L20.5 15H13L12 2.5zm-1 3.5L4.5 15h6.5V6zM3.5 17l2.5 3.5h12l2.5-3.5H3.5z" />
      </svg>
    </div>
  ),
  huggingface: (
    <div className="w-6 h-6 rounded-[6px] bg-[#FFD21E] flex items-center justify-center text-xs">
      🤗
    </div>
  ),
  mistral: (
    <div className="w-6 h-6 rounded-[6px] bg-black flex flex-col items-center justify-center gap-0.5 p-1">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 bg-[#FF5200] rounded-2xs" />
        <div className="w-1.5 h-1.5 bg-[#FF5200] rounded-2xs" />
      </div>
      <div className="w-3.5 h-1 bg-[#FFA800] rounded-2xs" />
      <div className="w-4 h-1 bg-[#FFD400] rounded-2xs" />
    </div>
  ),
  deepseek: (
    <div className="w-6 h-6 rounded-[6px] bg-[#0066FF] flex items-center justify-center">
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.5 7.5C18 5 15.5 3.5 12 3.5c-4.5 0-8 3.5-8.5 7.5-.3 2.5.5 5 2.5 6.5l-2 3c3.5-1 6-2 8-3.5 3.5.5 7-1.5 8.5-4.5 1-2 .5-4.5-1-5zm-9 4c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
      </svg>
    </div>
  ),
  crypto_btc: (
    <div className="w-6 h-6 rounded-full bg-[#F7931A] text-white flex items-center justify-center font-bold text-xs">
      ₿
    </div>
  ),
  cart: (
    <svg className="w-5 h-5 text-[#ff6600]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  ),
  wifi_icon: (
    <svg className="w-5 h-5 text-[#0284c7]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4zm0 6c2.76 0 5.26 1.12 7.07 2.93L12 20.01l-7.07-7.08A9.94 9.94 0 0 1 12 10z" />
    </svg>
  ),
  shield_icon: (
    <svg className="w-5 h-5 text-[#10b981]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
    </svg>
  ),
  star_icon: (
    <svg className="w-5 h-5 text-[#f59e0b]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  ),

  // ─── SPORTS & ATHLETICS BRANDS ───────────────────────────────────────────
  nike: (
    <div className="w-6 h-6 rounded-[6px] bg-black flex items-center justify-center">
      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.71 5.48c-.41-.2-.91-.1-1.22.25L7.33 19.34c-1.62 1.48-3.9 1.34-5.11.41-.77-.59-1.12-1.46-.99-2.38.25-1.55 1.76-3.23 4.02-4.38l.65-.32c-.39-.19-.78-.4-1.15-.65-2.61-1.04-4.22-2.73-3.83-4.74.45-2.29 3.05-3.77 6.4-3.77 3.09 0 6.37 1.25 9.38 3.14l4.58-1.84c.3-.12.65-.05.89.17.24.23.31.59.18.9l-.63 1.39z" />
      </svg>
    </div>
  ),
  adidas: (
    <div className="w-6 h-6 rounded-[6px] bg-black flex items-center justify-center">
      <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.95 18.96L16.2 7.27c-.24-.42-.77-.56-1.19-.32-.42.24-.56.77-.32 1.19l6.75 11.69c.24.42.77.56 1.19.32.42-.24.56-.77.32-1.19zM15.45 18.96L10.2 9.87c-.24-.42-.77-.56-1.19-.32-.42.24-.56.77-.32 1.19l5.25 9.09c.24.42.77.56 1.19.32.42-.24.56-.77.32-1.19zM7.95 18.96L4.2 12.47c-.24-.42-.77-.56-1.19-.32-.42.24-.56.77-.32 1.19l3.75 6.49c.24.42.77.56 1.19.32.42-.24.56-.77.32-1.19z" />
      </svg>
    </div>
  ),
  puma: (
    <div className="w-6 h-6 rounded-[6px] bg-[#18181b] flex items-center justify-center">
      <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.5 6.5c-.8.8-1.9 1.2-3 1.1-.6 1.4-1.7 2.5-3.1 3.1.2.9.1 1.9-.3 2.8l3.4 3.5c.4.4.4 1 0 1.4-.4.4-1 .4-1.4 0l-3.2-3.3c-1.3.6-2.8.7-4.2.2l-2.2 2.2c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4l2-2c-.9-1.6-.9-3.5 0-5.1.8-1.5 2.3-2.6 4-2.9 1.1-.2 2.2.1 3.1.8.8-.5 1.8-.7 2.8-.4.5-.7 1.3-1.2 2.2-1.3 1.1-.1 2.2.4 2.8 1.3.2.3.1.8-.2 1-.3.2-.8.1-1-.2-.4-.6-1.1-.9-1.8-.8-.6.1-1.1.4-1.4.9-.1.3-.4.5-.7.5z" />
      </svg>
    </div>
  ),
  jordan: (
    <div className="w-6 h-6 rounded-[6px] bg-[#E11D48] flex items-center justify-center text-white">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-1.5 4.5l-3 4-4.5-1.5 1 2 3.5 1 2 4.5-1.5 5 1.5 1 2-5 2-2 3.5 1.5 1-1.5-3.5-2.5-1-4.5-1.5-1.5z" />
      </svg>
    </div>
  ),
  nba: (
    <div className="w-6 h-6 rounded-[4px] bg-[#1D428A] flex items-center justify-center text-white border-l-4 border-r-4 border-l-[#C8102E] border-r-transparent font-black text-[8px]">
      NBA
    </div>
  ),
  formula1: (
    <div className="w-6 h-6 rounded-[6px] bg-[#E10600] flex items-center justify-center text-white font-black italic text-[9px] tracking-tighter">
      F1
    </div>
  ),
  football_ball: (
    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-neutral-300">
      <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 3.2l2.6 1.9-1 3.1h-3.2l-1-3.1zm-4.7 2.1l1.1 3.4-2.8 2-2.3-2.6a8 8 0 0 1 4-2.8zm9.4 0a8 8 0 0 1 4 2.8l-2.3 2.6-2.8-2zm-9.2 7.7l2.8 2.1-1.1 3.4a8 8 0 0 1-4-2.7zm9 0l2.3 2.8a8 8 0 0 1-4 2.7l-1.1-3.4zm-4.5-1.7l1.9 1.4-1.9 1.4-1.9-1.4z" />
      </svg>
    </div>
  ),
  gym_fitness: (
    <div className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 9v6h2V9H5zm12 0v6h2V9h-2zm-8 2v2h6v-2H9zM2 10v4h2v-4H2zm18 0v4h2v-4h-2z" />
      </svg>
    </div>
  ),
  tennis_ball: (
    <div className="w-6 h-6 rounded-full bg-[#CCFF00] flex items-center justify-center border border-lime-400">
      <svg className="w-4 h-4 text-emerald-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M4.5 4.5c4 4 4 11 0 15M19.5 4.5c-4 4-4 11 0 15" />
      </svg>
    </div>
  ),
  redbull: (
    <div className="w-6 h-6 rounded-[6px] bg-[#001D4A] flex items-center justify-center text-[#ED1C24] font-black text-[8px]">
      RB
    </div>
  ),

  // ─── TECH DEV, FRAMEWORKS & CLOUD ─────────────────────────────────────────
  rust: (
    <div className="w-6 h-6 rounded-[6px] bg-[#000000] flex items-center justify-center text-[#CE412B] font-black text-xs font-mono">
      🦀
    </div>
  ),
  golang: (
    <div className="w-6 h-6 rounded-[6px] bg-[#00ACD7] flex items-center justify-center text-white font-black text-[9px] italic">
      GO
    </div>
  ),
  cplusplus: (
    <div className="w-6 h-6 rounded-[6px] bg-[#00599C] flex items-center justify-center text-white font-bold text-[9px]">
      C++
    </div>
  ),
  java: (
    <div className="w-6 h-6 rounded-[6px] bg-[#5382A1] flex items-center justify-center text-[#E76F00] font-bold text-xs">
      ☕
    </div>
  ),
  git: (
    <div className="w-6 h-6 rounded-[6px] bg-[#F05032] flex items-center justify-center text-white">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.6 10.9L13.1 2.4c-.6-.6-1.5-.6-2.1 0L8.6 4.8l2.8 2.8c.6-.2 1.3-.1 1.8.4.5.5.6 1.2.4 1.8l2.7 2.7c.6-.2 1.3-.1 1.8.4.8.8.8 2 0 2.8s-2 .8-2.8 0c-.6-.6-.7-1.4-.4-2.1L12.4 10v4.7c.3.2.6.4.7.7.8.8.8 2 0 2.8s-2 .8-2.8 0c-.8-.8-.8-2 0-2.8.3-.3.6-.5 1-.6V9.8c-.4-.1-.7-.3-1-.6-.6-.6-.7-1.4-.4-2.1L7.2 4.4 2.4 9.2c-.6.6-.6 1.5 0 2.1l8.5 8.5c.6.6 1.5.6 2.1 0l8.6-8.5c.6-.5.6-1.4 0-2z" />
      </svg>
    </div>
  ),
  gitlab: (
    <div className="w-6 h-6 rounded-[6px] bg-[#FC6D26] flex items-center justify-center text-white">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.95 13.59L21.41 5.8a.96.96 0 0 0-1.82 0l-2.02 6.22H6.43L4.41 5.8a.96.96 0 0 0-1.82 0L.05 13.59a1.92 1.92 0 0 0 .7 2.15L12 23.98l11.25-8.24a1.92 1.92 0 0 0 .7-2.15z" />
      </svg>
    </div>
  ),
  kubernetes: (
    <div className="w-6 h-6 rounded-[6px] bg-[#326CE5] flex items-center justify-center text-white">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2zm0 2.3l6.5 3.8v7.6L12 19.5 5.5 15.7V8.1L12 4.3z" />
      </svg>
    </div>
  ),
  linux: (
    <div className="w-6 h-6 rounded-[6px] bg-[#FCC624] flex items-center justify-center text-black font-bold text-xs">
      🐧
    </div>
  ),
  redis: (
    <div className="w-6 h-6 rounded-[6px] bg-[#DC382D] flex items-center justify-center text-white font-black text-[8px]">
      RDS
    </div>
  ),
  graphql: (
    <div className="w-6 h-6 rounded-[6px] bg-[#E10098] flex items-center justify-center text-white">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2zm0 2.3L5.34 8.16v7.68L12 19.7l6.66-3.86V8.16L12 4.3z" />
      </svg>
    </div>
  ),
  figma: (
    <div className="w-6 h-6 rounded-[6px] bg-[#1E1E1E] flex items-center justify-center">
      <div className="grid grid-cols-2 gap-0.5">
        <div className="w-1.5 h-1.5 rounded-l-full bg-[#F24E1E]" />
        <div className="w-1.5 h-1.5 rounded-r-full bg-[#FF7262]" />
        <div className="w-1.5 h-1.5 rounded-l-full bg-[#A259FF]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#1ABCFE]" />
        <div className="w-1.5 h-1.5 rounded-l-full bg-[#0ACF83]" />
      </div>
    </div>
  ),
  linear: (
    <div className="w-6 h-6 rounded-[6px] bg-[#5E6AD2] flex items-center justify-center text-white font-black text-[9px]">
      ▲
    </div>
  ),
  aws: (
    <div className="w-6 h-6 rounded-[6px] bg-[#232F3E] flex items-center justify-center text-[#FF9900] font-bold text-[9px]">
      AWS
    </div>
  ),
  vite: (
    <div className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-[#41D1FF] to-[#BD34FE] flex items-center justify-center text-[#FFD62E] font-black text-xs">
      ⚡
    </div>
  ),
  bun: (
    <div className="w-6 h-6 rounded-[6px] bg-[#FBF0DF] flex items-center justify-center text-xs">
      🥟
    </div>
  ),

  // ─── MARKETING, ADS & GROWTH PLATFORMS ──────────────────────────────────
  hubspot: (
    <div className="w-6 h-6 rounded-[6px] bg-[#FF7A59] flex items-center justify-center text-white">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.8 7.2V4.5c.8-.4 1.3-1.2 1.3-2.1C20.1 1.1 19 0 17.6 0c-1.3 0-2.4 1.1-2.4 2.4 0 .9.5 1.7 1.3 2.1v2.7c-1.1.4-2.1 1.1-2.8 2L7.9 4.8c.1-.3.2-.6.2-.9C8.1 2.3 6.8 1 5.2 1S2.3 2.3 2.3 3.9c0 1.6 1.3 2.9 2.9 2.9.7 0 1.4-.3 1.9-.7l5.7 4.3c-.5 1-.8 2.1-.8 3.3 0 1.2.3 2.3.8 3.3l-5.7 4.3c-.5-.4-1.2-.7-1.9-.7-1.6 0-2.9 1.3-2.9 2.9 0 1.6 1.3 2.9 2.9 2.9s2.9-1.3 2.9-2.9c0-.3-.1-.6-.2-.9l5.8-4.4c.7.9 1.7 1.6 2.8 2v2.7c-.8.4-1.3 1.2-1.3 2.1 0 1.3 1.1 2.4 2.4 2.4s2.4-1.1 2.4-2.4c0-.9-.5-1.7-1.3-2.1v-2.7c1.7-.7 3-2.2 3.4-4h2.7c.4.8 1.2 1.3 2.1 1.3 1.3 0 2.4-1.1 2.4-2.4s-1.1-2.4-2.4-2.4c-.9 0-1.7.5-2.1 1.3h-2.7c-.4-1.8-1.7-3.3-3.4-4zm-1.2 9.5c-1.8 0-3.3-1.5-3.3-3.3s1.5-3.3 3.3-3.3 3.3 1.5 3.3 3.3-1.5 3.3-3.3 3.3z" />
      </svg>
    </div>
  ),
  mailchimp: (
    <div className="w-6 h-6 rounded-[6px] bg-[#FFE01B] flex items-center justify-center text-black font-black text-xs font-serif">
      🐵
    </div>
  ),
  meta_ads: (
    <div className="w-6 h-6 rounded-[6px] bg-[#0668E1] flex items-center justify-center text-white">
      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4.333c-3.14 0-5.77 1.83-7.53 4.2C2.7 10.9 1.5 13.5 1.5 16c0 3.3 2.2 5.67 5.2 5.67 2.3 0 4.1-1.3 5.3-3.3 1.2 2 3 3.3 5.3 3.3 3 0 5.2-2.37 5.2-5.67 0-2.5-1.2-5.1-2.97-7.47-1.76-2.37-4.39-4.2-7.53-4.2zm0 3.3c2.4 0 4.4 1.4 5.8 3.3 1.4 1.9 2.2 4 2.2 5.07 0 1.8-1.1 3-2.7 3-1.8 0-3.2-1.2-4.3-3.5-.4-.8-.7-1.7-1-2.6-.3.9-.6 1.8-1 2.6-1.1 2.3-2.5 3.5-4.3 3.5-1.6 0-2.7-1.2-2.7-3 0-1.07.8-3.17 2.2-5.07 1.4-1.9 3.4-3.3 5.8-3.3z" />
      </svg>
    </div>
  ),
  google_ads: (
    <div className="w-6 h-6 rounded-[6px] bg-[#3C4043] flex items-center justify-center">
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path d="M3.5 18.5l7-12c.6-1 1.9-1.3 2.9-.7l2.5 1.5c1 .6 1.3 1.9.7 2.9l-7 12c-.6 1-1.9 1.3-2.9.7l-2.5-1.5c-1-.6-1.3-1.9-.7-2.9z" fill="#F4B400" />
        <path d="M19.5 18.5l-7-12c-.6-1-1.9-1.3-2.9-.7L7.1 7.3c-1 .6-1.3 1.9-.7 2.9l7 12c.6 1 1.9 1.3 2.9.7l2.5-1.5c1-.6 1.3-1.9.7-2.9z" fill="#4285F4" />
        <circle cx="5" cy="18.5" r="2.5" fill="#34A853" />
      </svg>
    </div>
  ),
  salesforce: (
    <div className="w-6 h-6 rounded-[6px] bg-[#00A1E0] flex items-center justify-center text-white">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.4 9.1c-.4-2.5-2.5-4.4-5.1-4.4-1.8 0-3.3.9-4.2 2.3-.3-.1-.7-.1-1-.1-2.1 0-3.8 1.6-4.1 3.6-1.7.5-2.9 2-2.9 3.8 0 2.2 1.8 4 4 4h13.1c2.1 0 3.8-1.7 3.8-3.8 0-2.1-1.6-3.8-3.6-4.4z" />
      </svg>
    </div>
  ),
  semrush: (
    <div className="w-6 h-6 rounded-[6px] bg-[#FF642D] flex items-center justify-center text-white font-black text-[9px]">
      SEM
    </div>
  ),
  ahrefs: (
    <div className="w-6 h-6 rounded-[6px] bg-[#0052CC] flex items-center justify-center text-[#FF642D] font-black text-[9px]">
      AH
    </div>
  ),
  klaviyo: (
    <div className="w-6 h-6 rounded-[6px] bg-[#121212] flex items-center justify-center text-[#24B47E] font-black text-xs">
      K
    </div>
  ),
  zapier: (
    <div className="w-6 h-6 rounded-[6px] bg-[#FF4A00] flex items-center justify-center text-white font-black text-xs">
      _
    </div>
  ),
  make: (
    <div className="w-6 h-6 rounded-[6px] bg-[#635BFF] flex items-center justify-center text-white font-bold text-[9px]">
      M
    </div>
  ),
  webflow: (
    <div className="w-6 h-6 rounded-[6px] bg-[#146EF5] flex items-center justify-center text-white font-black text-xs italic">
      W
    </div>
  ),
  wordpress: (
    <div className="w-6 h-6 rounded-[6px] bg-[#21759B] flex items-center justify-center text-white font-serif font-black text-xs">
      W
    </div>
  ),
  google_analytics: (
    <div className="w-6 h-6 rounded-[6px] bg-[#F9AB00] flex items-center justify-center text-white">
      <div className="flex items-end gap-0.5 h-3.5">
        <div className="w-1 h-1.5 bg-white rounded-2xs" />
        <div className="w-1 h-2.5 bg-white rounded-2xs" />
        <div className="w-1 h-3.5 bg-white rounded-2xs" />
      </div>
    </div>
  ),

  // ─── TECH FRAMEWORKS & CLOUD ─────────────────────────────────────────────
  astro: (
    <div className="w-6 h-6 rounded-[6px] bg-[#BC52EE] flex items-center justify-center text-white font-bold text-xs">
      🚀
    </div>
  ),
  nestjs: (
    <div className="w-6 h-6 rounded-[6px] bg-[#E0234E] flex items-center justify-center text-white font-bold text-xs">
      🐱
    </div>
  ),
  fastapi: (
    <div className="w-6 h-6 rounded-[6px] bg-[#05998B] flex items-center justify-center text-white font-bold text-xs">
      ⚡
    </div>
  ),
  django: (
    <div className="w-6 h-6 rounded-[6px] bg-[#092E20] flex items-center justify-center text-[#44B78B] font-bold text-[9px]">
      dj
    </div>
  ),
  laravel: (
    <div className="w-6 h-6 rounded-[6px] bg-[#FF2D20] flex items-center justify-center text-white font-black text-xs">
      L
    </div>
  ),
  flutter: (
    <div className="w-6 h-6 rounded-[6px] bg-[#02569B] flex items-center justify-center text-[#54C5F8] font-black text-xs">
      F
    </div>
  ),
  postman: (
    <div className="w-6 h-6 rounded-[6px] bg-[#FF6C37] flex items-center justify-center text-white font-bold text-xs">
      👨‍🚀
    </div>
  ),
  clerk: (
    <div className="w-6 h-6 rounded-[6px] bg-[#6C47FF] flex items-center justify-center text-white font-bold text-[9px]">
      CL
    </div>
  ),
  neon_db: (
    <div className="w-6 h-6 rounded-[6px] bg-[#00E599] flex items-center justify-center text-black font-black text-[9px]">
      N
    </div>
  ),
  resend: (
    <div className="w-6 h-6 rounded-[6px] bg-black flex items-center justify-center text-white font-bold text-xs">
      R
    </div>
  ),

  // ─── GOOGLE MAIL, WIFI & PHONE CALL LOGOS ─────────────────────────────────
  gmail: (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M1.5 5.5v13a1.5 1.5 0 0 0 1.5 1.5h3.5v-10l-5-4.5z" />
      <path fill="#34A853" d="M22.5 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-3.5v-10l5-4.5z" />
      <path fill="#FBBC05" d="M17.5 10v-4.5l-5.5 4.5v10h3.5a1.5 1.5 0 0 0 1.5-1.5v-8.5z" />
      <path fill="#EA4335" d="M6.5 5.5l5.5 4.5 5.5-4.5L12 1.5 6.5 5.5z" />
    </svg>
  ),
  wifi_classic: (
    <div className="w-6 h-6 rounded-[6px] bg-[#0284c7] flex items-center justify-center text-white">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4zm0 6c-2.93 0-5.61 1.15-7.6 3.04L12 21l7.6-7.96C17.61 11.15 14.93 10 12 10zm0 5c-1.38 0-2.63.56-3.54 1.46L12 21l3.54-4.54C14.63 15.56 13.38 15 12 15z" />
      </svg>
    </div>
  ),
  wifi_free: (
    <div className="w-6 h-6 rounded-[6px] bg-[#059669] flex flex-col items-center justify-center text-white">
      <svg className="w-3.5 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4z" />
      </svg>
      <span className="text-[6px] font-black leading-none">FREE</span>
    </div>
  ),
  wifi_secure: (
    <div className="w-6 h-6 rounded-[6px] bg-[#4f46e5] flex items-center justify-center text-white">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C7.5 3 3.4 4.8.4 7.7l2.2 2.2C4.8 7.7 8.2 6.2 12 6.2s7.2 1.5 9.4 3.7l2.2-2.2C20.6 4.8 16.5 3 12 3z" />
        <path d="M14 13h-4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1zm-1 0v-1.5a1 1 0 0 0-2 0V13h2z" />
      </svg>
    </div>
  ),
  wifi_5g: (
    <div className="w-6 h-6 rounded-[6px] bg-[#7c3aed] flex flex-col items-center justify-center text-white">
      <svg className="w-3.5 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4z" />
      </svg>
      <span className="text-[6.5px] font-black text-amber-300 leading-none">5G</span>
    </div>
  ),
  phone_call: (
    <div className="w-6 h-6 rounded-[6px] bg-[#16a34a] flex items-center justify-center text-white">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z" />
      </svg>
    </div>
  ),
  phone_support: (
    <div className="w-6 h-6 rounded-[6px] bg-[#2563eb] flex items-center justify-center text-white">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1a9 9 0 0 0-9 9v7a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H5v-3a7 7 0 1 1 14 0v3h-2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-7a9 9 0 0 0-9-9z" />
      </svg>
    </div>
  ),
  phone_sos: (
    <div className="w-6 h-6 rounded-[6px] bg-[#dc2626] flex flex-col items-center justify-center text-white">
      <svg className="w-3.5 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z" />
      </svg>
      <span className="text-[6.5px] font-black leading-none">SOS</span>
    </div>
  ),
  whatsapp_call: (
    <div className="w-6 h-6 rounded-[6px] bg-[#25D366] flex items-center justify-center text-white">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.225-.652.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.085-.175-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.151-.175.201-.301.301-.501.101-.2.05-.376-.025-.527-.075-.15-.677-1.633-.928-2.235-.244-.587-.492-.507-.677-.517-.175-.009-.376-.01-.577-.01-.2 0-.527.075-.802.376s-1.054 1.03-1.054 2.511c0 1.48 1.079 2.91 1.229 3.11.15.2 2.124 3.243 5.147 4.549.719.31 1.28.496 1.718.635.722.23 1.379.197 1.898.12.578-.087 1.78-.728 2.031-1.431.251-.703.251-1.305.176-1.431-.076-.126-.276-.201-.577-.351zm-5.467 7.618c-2.02 0-4-.543-5.733-1.572l-.411-.244-4.261 1.117 1.137-4.153-.267-.425c-1.13-1.8-1.727-3.896-1.727-6.043 0-6.25 5.086-11.336 11.337-11.336 3.029 0 5.877 1.18 8.019 3.323 2.143 2.143 3.323 4.991 3.323 8.02 0 6.251-5.086 11.338-11.337 11.338z" />
      </svg>
    </div>
  ),
};
