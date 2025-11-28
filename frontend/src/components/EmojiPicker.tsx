import { useState } from 'react';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const COMMON_EMOJIS = [
  '📊', '🌡️', '💧', '💨', '🌪️', '💡', '🚶', '📍',
  '🔋', '📶', '💾', '🌐', '🗺️', '⚡', '🔥', '❄️',
  '🌞', '🌙', '⭐', '☁️', '🌧️', '⚠️', '✅', '❌',
  '🔴', '🟢', '🟡', '🔵', '🟣', '🟠', '⚪', '⚫',
  '📱', '💻', '⌚', '🎮', '📷', '🎥', '🔊', '🔇',
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
  '🏠', '🏭', '🏢', '🏪', '🏫', '🏥', '🏦', '🏨',
];

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Selected Emoji Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full input flex items-center justify-between hover:border-primary-400 transition-colors"
      >
        <span className="text-2xl">{value || '📊'}</span>
        <span className="text-xs text-neutral-500">Click to change</span>
      </button>

      {/* Emoji Grid Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 p-3 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-8 gap-2">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className={`w-10 h-10 flex items-center justify-center text-2xl rounded hover:bg-primary-50 transition-colors ${
                    emoji === value ? 'bg-primary-100 ring-2 ring-primary-500' : ''
                  }`}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="mt-3 pt-3 border-t border-neutral-200">
              <label className="text-xs text-neutral-600 mb-1 block">Or paste custom emoji:</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="Paste any emoji..."
                maxLength={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.target as HTMLInputElement;
                    if (input.value) {
                      handleSelect(input.value);
                      input.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
