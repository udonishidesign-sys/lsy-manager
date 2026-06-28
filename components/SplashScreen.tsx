// components/SplashScreen.tsx
"use client";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-teal-600 text-white">
      <div className="text-center animate-pulse">
        <h1 className="text-2xl font-bold">LSY Manager</h1>
        <p className="text-sm mt-2 opacity-80">Loading...</p>
      </div>
    </div>
  );
}
