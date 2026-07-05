interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "danger" | "secondary";
  disabled?: boolean;
}

function Button({ children, onClick, type = "button", variant = "primary", disabled }: ButtonProps) {
  const colors = {
    primary: "bg-blue-600 hover:bg-blue-700",
    danger: "bg-red-600 hover:bg-red-700",
    secondary: "bg-gray-700 hover:bg-gray-600",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${colors[variant]} text-white px-4 py-2 rounded disabled:bg-gray-500 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

export default Button;