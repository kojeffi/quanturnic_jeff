import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { backend } from 'declarations/backend';
import botImg from '/bot.svg';
import userImg from '/user.svg';
import '/index.css';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [botState, setBotState] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [signals, setSignals] = useState([]);
  const [strategy, setStrategy] = useState('momentum');
  const [riskLevel, setRiskLevel] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState(null);

  // Initialize bot state
  useEffect(() => {
    const init = async () => {
      const state = await backend.get_bot_state();
      const trades = await backend.get_trade_history();
      const signalsData = await backend.get_signals();
      
      setBotState(state);
      setTradeHistory(trades);
      setSignals(signalsData);
      setStrategy(state.strategy);
      setRiskLevel(state.risk_level);
      
      // Generate mock market data
      const labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
      const prices = labels.map((_, i) => 100 + Math.sin(i / 2) * 20 + Math.random() * 10);
      
      setMarketData({
        labels,
        datasets: [
          {
            label: 'ICP Price',
            data: prices,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
          },
        ],
      });
    };
    
    init();
  }, []);

  const toggleBot = async () => {
    setIsLoading(true);
    const newState = await backend.toggle_bot(!botState.active);
    setBotState(newState);
    setIsLoading(false);
  };

  const updateStrategy = async () => {
    setIsLoading(true);
    const newState = await backend.update_strategy(strategy, riskLevel);
    setBotState(newState);
    setIsLoading(false);
  };

  const analyzeMarket = async () => {
    setIsLoading(true);
    // In a real implementation, you would fetch actual market data
    await backend.analyze_market("market data");
    const newSignals = await backend.get_signals();
    setSignals(newSignals);
    setIsLoading(false);
  };

  const executeTrades = async () => {
    setIsLoading(true);
    await backend.execute_trades();
    const newTrades = await backend.get_trade_history();
    setTradeHistory(newTrades);
    setIsLoading(false);
  };

  const DashboardTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-700">Bot Status</h3>
          <p className={`text-2xl mt-2 ${botState?.active ? 'text-green-500' : 'text-red-500'}`}>
            {botState?.active ? 'ACTIVE' : 'INACTIVE'}
          </p>
          <button
            onClick={toggleBot}
            disabled={isLoading}
            className={`mt-4 w-full py-2 rounded ${botState?.active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
          >
            {botState?.active ? 'Stop Bot' : 'Start Bot'}
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-700">Current Balance</h3>
          <p className="text-2xl mt-2 text-blue-500">${botState?.balance.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">Last analysis: {
            botState?.last_analysis ? new Date(botState.last_analysis / 1_000_000).toLocaleString() : 'Never'
          }</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-700">Current Strategy</h3>
          <p className="text-xl mt-2 capitalize">{botState?.strategy}</p>
          <p className="text-sm text-gray-500 mt-2">Risk level: {botState?.risk_level.toFixed(2)}</p>
        </div>
      </div>
      
      {marketData && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-700 mb-4">Market Analysis</h3>
          <Line data={marketData} />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-700 mb-4">Recent Signals</h3>
          <div className="space-y-2">
            {signals.slice(0, 5).map((signal, i) => (
              <div key={i} className="border-b pb-2">
                <div className="flex justify-between">
                  <span className="font-medium">{signal.pair}</span>
                  <span className={`font-bold ${signal.action === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                    {signal.action}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>${signal.price.toFixed(2)}</span>
                  <span>Confidence: {(signal.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={analyzeMarket}
            disabled={isLoading}
            className="mt-4 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Analyze Market
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-700 mb-4">Recent Trades</h3>
          <div className="space-y-2">
            {tradeHistory.slice(0, 5).map((trade, i) => (
              <div key={i} className="border-b pb-2">
                <div className="flex justify-between">
                  <span className="font-medium">{trade.signal.pair}</span>
                  <span className={`font-bold ${trade.signal.action === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.signal.action}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>${trade.signal.price.toFixed(2)}</span>
                  <span>{new Date(trade.timestamp / 1_000_000).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={executeTrades}
            disabled={isLoading || !botState?.active}
            className="mt-4 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Execute Trades
          </button>
        </div>
      </div>
    </div>
  );

  const StrategyTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold text-gray-700 mb-4">Trading Strategy</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Strategy Type</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="momentum">Momentum</option>
              <option value="mean_reversion">Mean Reversion</option>
              <option value="arbitrage">Arbitrage</option>
              <option value="ml_based">ML-Based</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Level: {riskLevel.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={riskLevel}
              onChange={(e) => setRiskLevel(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>
          
          <button
            onClick={updateStrategy}
            disabled={isLoading}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Update Strategy
          </button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold text-gray-700 mb-4">Strategy Performance</h3>
        {marketData && (
          <Bar data={{
            labels: ['Last Week', 'Last Month', 'Last Quarter'],
            datasets: [
              {
                label: 'Profit/Loss',
                data: [5.2, 12.7, 28.4],
                backgroundColor: ['rgba(59, 130, 246, 0.5)'],
                borderColor: ['rgb(59, 130, 246)'],
                borderWidth: 1,
              },
            ],
          }} />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">Quanturnic</h1>
            <span className="text-sm bg-blue-700 px-2 py-1 rounded">v0.1.0</span>
          </div>
          <div className="text-sm">
            <span className="bg-green-500 px-2 py-1 rounded">On-Chain</span>
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex border-b">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'strategy' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('strategy')}
            >
              Strategy
            </button>
          </div>
          
          <div className="p-4">
            {activeTab === 'dashboard' ? <DashboardTab /> : <StrategyTab />}
          </div>
        </div>
        
        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-700">Quanturnic AI Assistant</h2>
          </div>
          <div className="p-4">
            <div className="h-64 overflow-y-auto mb-4 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start mb-4">
                <div className="mr-3 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  Q
                </div>
                <div className="bg-white p-3 rounded-lg shadow max-w-[80%]">
                  <p>Hello! I'm Quanturnic, your AI trading assistant. How can I help you with your trading strategy today?</p>
                </div>
              </div>
            </div>
            <div className="flex">
              <input
                type="text"
                placeholder="Ask about market conditions, strategies, or trades..."
                className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);