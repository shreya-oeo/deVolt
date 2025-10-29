import Header from "@/components/header";
import Footer from "@/components/footer";

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black mb-8 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
            Support Center
          </h1>
          <p className="text-xl text-gray-400 mb-12">
            Get help with your DeVolt experience. Our team is here 24/7.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Contact Support</h3>
              <p className="text-gray-400 mb-6">Reach out to our support team for immediate assistance.</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-blue-400">📧</span>
                  <span className="text-gray-300">support@devolt.network</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400">💬</span>
                  <span className="text-gray-300">Live Chat (24/7)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-purple-400">📱</span>
                  <span className="text-gray-300">+91 8077366062</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Quick Help</h3>
              <p className="text-gray-400 mb-6">Find answers to common questions and issues.</p>
              <div className="space-y-3">
                <div className="text-gray-300">• How to start charging</div>
                <div className="text-gray-300">• Wallet connection issues</div>
                <div className="text-gray-300">• DECH token rewards</div>
                <div className="text-gray-300">• Station availability</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}