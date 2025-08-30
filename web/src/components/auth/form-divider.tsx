interface FormDividerProps {
  text?: string;
}

export default function FormDivider({ text = "Or" }: FormDividerProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-gray-50 text-gray-500">{text}</span>
      </div>
    </div>
  );
}