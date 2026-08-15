'use client';

import React from "react";

const typeStyles = {
  success: {
    bg: "bg-green-600/90 border-green-400",
    text: "text-white",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    bg: "bg-red-600/90 border-red-400",
    text: "text-white",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  info: {
    bg: "bg-blue-600/90 border-blue-400",
    text: "text-white",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01" />
      </svg>
    ),
  },
  warning: {
    bg: "bg-yellow-500/90 border-yellow-400",
    text: "text-black",
    icon: (
      <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
      </svg>
    ),
  },
};

type ToastType = keyof typeof typeStyles;

interface InlineToastProps {
  type: ToastType;
  message: string;
  onClose?: () => void;
}

export const InlineToast: React.FC<InlineToastProps> = ({ type, message, onClose }) => {
  const style = typeStyles[type] || typeStyles.info;
  return (
<div
  className={`flex items-center gap-2 px-4 py-2 rounded-md border shadow-md ${style.bg} ${style.text}`}
  role={type === 'error' ? 'alert' : 'status'}
>
      <span>{style.icon}</span>
      <span className="flex-1 text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-lg font-bold focus:outline-none"
          aria-label="Fermer la notification"
        >
          ×
        </button>
      )}
    </div>
  );
}; 