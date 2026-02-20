export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-center">
          🎯 Intraday Decision Intelligence Engine
        </h1>
        
        <div className="text-center space-y-4">
          <p className="text-xl">NIFTY & BANKNIFTY Options Analysis</p>
          <p className="text-muted-foreground">
            Real-time scoring • Option chain analysis • Risk management
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mt-8">
          <div className="border rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600">UP</div>
            <div className="text-sm text-muted-foreground mt-2">Status</div>
          </div>
          
          <div className="border rounded-lg p-6 text-center">
            <div className="text-3xl font-bold">Phase 0</div>
            <div className="text-sm text-muted-foreground mt-2">Setup Complete</div>
          </div>
        </div>

        <div className="border rounded-lg p-6 w-full max-w-2xl">
          <h2 className="font-semibold mb-4">Services Status:</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>API Gateway</span>
              <span className="text-green-600">:8080</span>
            </li>
            <li className="flex justify-between">
              <span>Market Data Service</span>
              <span className="text-green-600">:8081</span>
            </li>
            <li className="flex justify-between">
              <span>Option Chain Service</span>
              <span className="text-green-600">:8082</span>
            </li>
            <li className="flex justify-between">
              <span>Risk Service</span>
              <span className="text-green-600">:8083</span>
            </li>
            <li className="flex justify-between">
              <span>Journal Service</span>
              <span className="text-green-600">:8084</span>
            </li>
            <li className="flex justify-between">
              <span>Quant Engine</span>
              <span className="text-green-600">:8001</span>
            </li>
            <li className="flex justify-between">
              <span>AI Reasoning</span>
              <span className="text-green-600">:8002</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          Deterministic • Explainable • Risk-Aware
        </p>
      </div>
    </main>
  )
}
