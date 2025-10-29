import Link from 'next/link';
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      
      <section className="pt-32 pb-20 px-6 flex items-center justify-center min-h-[70vh]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-8xl md:text-9xl font-black mb-8 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            404
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-white">
            Page Not Found
          </h1>
          
          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            Oops! The page you're looking for seems to have taken a detour. 
            Let's get you back on the right path to sustainable energy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="group inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-50 rounded-full text-black font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">Go Home</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            
            <Link
              href="/dashboard"
              className="group inline-flex items-center justify-center px-8 py-4 border border-gray-600 hover:border-gray-500 rounded-full text-gray-300 hover:text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">Dashboard</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </Link>
          </div>
          
          <div className="mt-12 p-6 bg-gradient-to-br from-gray-900/40 to-black/80 rounded-2xl border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-3">Need Help?</h3>
            <p className="text-gray-400 mb-4">
              If you believe this is an error, please contact our support team.
            </p>
            <Link
              href="/support"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              <span className="mr-1">Contact Support</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}