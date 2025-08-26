import React from "react";

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="flex justify-center md:justify-start mx-auto px-6 py-4 container">
        <img
          src="https://novaverte.com.br/wp-content/uploads/2024/04/novaverte-logo-1536x458.png"
          alt="Logo Nova Verte"
          className="h-12"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src =
              "https://placehold.co/300x90/f8fafc/2d3748?text=Nova+Verte";
          }}
        />
      </div>
    </header>
  );
};

export default Header;
