import React from 'react';
import { Eye, FileText, CreditCard, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-5xl aspect-video bg-gradient-to-r from-red-700 via-red-600 to-red-500 rounded-lg shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-1/2 h-full bg-opacity-70 flex flex-col justify-center pl-12">
            <div className="flex items-center mb-4">
              <Eye className="h-16 w-16 text-white" />
              <h1 className="text-6xl font-bold text-white ml-4">DrishtiRx</h1>
            </div>
            <p className="text-white text-xl">A Complete Optical Retail Management Software</p>
          </div>
          <div className="w-1/2 h-full bg-opacity-50 flex justify-center items-center">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-full h-80 w-80 border-4 border-white border-opacity-20 shadow-2xl flex items-center justify-center">
              <div className="rounded-full h-72 w-72 overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/19043905/pexels-photo-19043905/free-photo-of-close-up-of-a-woman-wearing-eyeglasses.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt="Person wearing glasses"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-gray-600">Software By:</p>
        <h3 className="font-bold text-gray-800 mt-1">HS Visionware Systems</h3>
        <p className="text-sm text-gray-600 mt-2">www.dirshtirx.com</p>
        <p className="text-sm text-gray-600">harshu.shreyash64@gmail.com</p>
        <p className="text-sm text-gray-600">+91-7758870726</p>
      </div>
    </div>
  );
};

export default HomePage;