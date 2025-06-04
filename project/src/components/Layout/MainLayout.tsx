import React from 'react';
import TopMenuBar from './TopMenuBar';
import NavigationButtons from './NavigationButtons';
import { Eye } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-1 border-b border-gray-200">
          <div className="flex items-center">
            <Eye className="h-6 w-6 text-red-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-800">DrishtiRx</h1>
          </div>
        </div>
        <TopMenuBar />
        <NavigationButtons />
      </header>
      
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="w-full max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-2 px-4 text-sm text-gray-600 text-center">
        Drishti - A Complete Optical Retail Management Software
      </footer>
    </div>
  );
};

export default MainLayout;