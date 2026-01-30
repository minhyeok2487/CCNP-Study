'use client';

interface OptionButtonProps {
  label: string;
  text: string;
  state: 'default' | 'selected' | 'correct' | 'wrong';
  onClick: () => void;
  disabled?: boolean;
}

export default function OptionButton({
  label,
  text,
  state,
  onClick,
  disabled = false,
}: OptionButtonProps) {
  const getStyles = () => {
    switch (state) {
      case 'selected':
        return 'border-blue-500 bg-blue-50 text-blue-900';
      case 'correct':
        return 'border-green-500 bg-green-50 text-green-900';
      case 'wrong':
        return 'border-red-500 bg-red-50 text-red-900';
      default:
        return 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50';
    }
  };

  const getLabelStyles = () => {
    switch (state) {
      case 'selected':
        return 'bg-blue-500 text-white';
      case 'correct':
        return 'bg-green-500 text-white';
      case 'wrong':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'correct':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'wrong':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center p-4 border-2 rounded-lg transition-all ${getStyles()} ${
        disabled ? 'cursor-default' : 'cursor-pointer'
      }`}
    >
      <span
        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold mr-3 ${getLabelStyles()}`}
      >
        {label}
      </span>
      <span className="flex-grow text-left">{text}</span>
      {getIcon() && <span className="flex-shrink-0 ml-3">{getIcon()}</span>}
    </button>
  );
}
