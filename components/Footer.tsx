import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 mt-12">
      <div className="container mx-auto px-4 py-6 text-center text-gray-400">
        <p>&copy; {new Date().getFullYear()} LigaFull futebol digital. Todos os direitos reservados.</p>
        <p className="text-sm mt-1">Construído com React, TypeScript e Tailwind CSS.</p>
      </div>
    </footer>
  );
};

export default Footer;