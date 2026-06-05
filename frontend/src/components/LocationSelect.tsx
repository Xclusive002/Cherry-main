import { useEffect, useState } from 'react';

export default function LocationSelect({
  value,
  onChange,
  className = '',
}: {
  value?: { country?: string; state?: string };
  onChange?: (v: { country?: string; state?: string }) => void;
  className?: string;
}) {
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!value) {
      setInput('');
      return;
    }
    const s = value.state ? `${value.state}, ${value.country || ''}`.trim() : value.country || '';
    setInput(s);
  }, [value]);

  const handleChange = (v: string) => {
    setInput(v);
    const parts = v.split(',').map((p) => p.trim()).filter(Boolean);
    let country: string | undefined = undefined;
    let state: string | undefined = undefined;
    if (parts.length === 1) {
      country = parts[0];
    } else if (parts.length > 1) {
      country = parts[parts.length - 1];
      state = parts.slice(0, -1).join(', ');
    }
    onChange && onChange({ country, state });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        type="text"
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="e.g. California, United States"
        className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary"
      />
      <p className="text-sm text-text-secondary">Please include your State and Country (e.g. "California, United States").</p>
    </div>
  );
}
