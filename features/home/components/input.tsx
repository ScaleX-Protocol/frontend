export default function Input({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={label} className="text-xs text-[#A0A0A0]">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-[#2C2C2C] text-[#E0E0E0] px-3 py-2 rounded-lg text-sm border border-neutral-800 focus:outline-none focus:border-orange-600"
      />
    </div>
  );
}
