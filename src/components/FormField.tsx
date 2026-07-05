interface FormFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

function FormField({ label, type = "text", value, onChange, required }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-white text-sm">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="p-2 rounded bg-white text-black"
      />
    </div>
  );
}

export default FormField;