export default function Button({
  children,
  variant = 'default',
  active = false,
  onClick,
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'default';
  active?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const baseStyles = 'w-[124px] py-2 rounded-lg font-medium transition-colors text-[#E0E0E0]';
  const variants = {
    primary: 'bg-[#F06718]/70 hover:bg-[#F06718]/80',
    default: active ? 'bg-[#F06718]/70 hover:bg-[#F06718]/80' : 'border border-[#E0E0E0]/20 hover:bg-[#3C3C3C]',
  };

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}>
      {children}
    </button>
  );
}
