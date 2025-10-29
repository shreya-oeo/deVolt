import Header from "@/components/header";
import Footer from "@/components/footer";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black mb-8 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
            Documentation
          </h1>
          <p className="text-xl text-gray-400 mb-12">
            Everything you need to know about using DeVolt's decentralized energy platform.
          </p>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 p-8">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-4">Getting Started</h3>
              <p className="text-gray-400 mb-6">Learn how to set up your wallet and start charging.</p>
              <ul className="space-y-2 text-gray-300">
                <li>• Create your account</li>
                <li>• Connect your wallet</li>
                <li>• Find charging stations</li>
                <li>• Start your first session</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 p-8">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-white mb-4">Charging Guide</h3>
              <p className="text-gray-400 mb-6">Master the art of efficient EV charging with DeVolt.</p>
              <ul className="space-y-2 text-gray-300">
                <li>• Station types & speeds</li>
                <li>• Payment methods</li>
                <li>• Charging optimization</li>
                <li>• Troubleshooting</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 p-8">
              <div className="text-4xl mb-4">🪙</div>
              <h3 className="text-2xl font-bold text-white mb-4">DECH Tokens</h3>
              <p className="text-gray-400 mb-6">Understand our reward system and tokenomics.</p>
              <ul className="space-y-2 text-gray-300">
                <li>• How to earn DECH</li>
                <li>• Token utility</li>
                <li>• Staking rewards</li>
                <li>• Governance voting</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 p-8">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-2xl font-bold text-white mb-4">Blockchain Integration</h3>
              <p className="text-gray-400 mb-6">Deep dive into our Solana-based infrastructure.</p>
              <ul className="space-y-2 text-gray-300">
                <li>• Smart contracts</li>
                <li>• Transaction flow</li>
                <li>• Security features</li>
                <li>• Network fees</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 p-8">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-2xl font-bold text-white mb-4">For Businesses</h3>
              <p className="text-gray-400 mb-6">Enterprise solutions and fleet management.</p>
              <ul className="space-y-2 text-gray-300">
                <li>• Fleet management</li>
                <li>• Bulk charging</li>
                <li>• Analytics dashboard</li>
                <li>• API integration</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 p-8">
              <div className="text-4xl mb-4">🛠️</div>
              <h3 className="text-2xl font-bold text-white mb-4">Developer API</h3>
              <p className="text-gray-400 mb-6">Build on top of DeVolt's infrastructure.</p>
              <ul className="space-y-2 text-gray-300">
                <li>• API documentation</li>
                <li>• SDK downloads</li>
                <li>• Code examples</li>
                <li>• Testing environment</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}