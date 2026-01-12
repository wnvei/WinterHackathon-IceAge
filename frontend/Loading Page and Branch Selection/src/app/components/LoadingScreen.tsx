import { ImageWithFallback } from './figma/ImageWithFallback';

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 animate-fade-in z-10 px-4">
      {/* Polaroid photo style with animation */}
      <div className="relative animate-bounce" style={{ animationDuration: '2s' }}>
        <div className="bg-white p-3 pb-12 shadow-2xl transform rotate-2">
          <div className="w-64 h-48 bg-gradient-to-br from-orange-200 to-blue-200 flex items-center justify-center overflow-hidden relative">
            {/* Animated circles */}
            <div className="absolute w-20 h-20 bg-orange-400 rounded-full opacity-50 animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute w-32 h-32 bg-blue-400 rounded-full opacity-30 animate-pulse" style={{ animationDuration: '3s' }}></div>
            <div className="absolute w-16 h-16 bg-yellow-400 rounded-full opacity-40 animate-bounce"></div>
            
            {/* Center icon animation */}
            <div className="relative z-10 flex items-center justify-center">
              <div className="text-6xl animate-bounce" style={{ animationDuration: '1.5s' }}>
                📚
              </div>
            </div>
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-6 bg-gray-800 opacity-40"></div>
          </div>
        </div>
      </div>

      {/* Large title text */}
      <div className="text-center max-w-3xl">
        <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-4 leading-tight">
          WELCOME TO
          <br />
          <span className="text-5xl md:text-6xl">SJEC LEARNING</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 italic font-light">
          Your journey starts here
        </p>
      </div>

      {/* Loading dots */}
      <div className="flex gap-2 mt-4">
        <div className="w-3 h-3 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-3 h-3 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-3 h-3 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
}