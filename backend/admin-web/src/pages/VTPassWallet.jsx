
import React, { useState, useEffect } from 'react';
import { Wallet, RefreshCw, TrendingUp, DollarSign, AlertCircle, CreditCard, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function VTPassWallet() {
  const [vtpassBalance, setVtpassBalance] = useState(null);
  const [monnifySettings, setMonnifySettings] = useState({
    apiKey: 'MK_TEST_5XDLQVCRNP',
    secretKey: '95UELE71N39B0941JBTBFR7UC21BRFKP',
    baseUrl: 'https://sandbox.monnify.com',
    contractCode: '',
    walletNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  const fetchVTPassBalance = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/vtpass/balance');
      setVtpassBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching VTPass balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVTPassBalance();
  }, []);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Integration</h1>
        <p className="text-gray-600 mt-1">Manage VTPass and Monnify payment settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VTPass Wallet */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Wallet className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">VTPass Wallet</h2>
                <p className="text-sm text-gray-600">Bill payment service balance</p>
              </div>
            </div>
            <button
              onClick={fetchVTPassBalance}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white mb-6">
            <p className="text-blue-100 text-sm mb-2">Available Balance</p>
            <p className="text-4xl font-bold mb-4">
              {vtpassBalance !== null ? formatCurrency(vtpassBalance) : '---'}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp size={16} />
              <span>Updated just now</span>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href="https://vtpass.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">Fund VTPass Wallet</span>
              <ExternalLink size={18} className="text-gray-600" />
            </a>
            
            <a
              href="https://vtpass.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">View Dashboard</span>
              <ExternalLink size={18} className="text-gray-600" />
            </a>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">Important</p>
                <p className="text-yellow-700">
                  Keep sufficient balance in VTPass wallet to process user transactions. Low balance will cause transaction failures.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Monnify Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-3 rounded-lg">
              <CreditCard className="text-green-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Monnify Integration</h2>
              <p className="text-sm text-gray-600">Payment gateway credentials</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={monnifySettings.apiKey}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(monnifySettings.apiKey, 'apiKey')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copied === 'apiKey' ? <CheckCircle size={20} className="text-green-600" /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={monnifySettings.secretKey}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(monnifySettings.secretKey, 'secretKey')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copied === 'secretKey' ? <CheckCircle size={20} className="text-green-600" /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={monnifySettings.baseUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(monnifySettings.baseUrl, 'baseUrl')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {copied === 'baseUrl' ? <CheckCircle size={20} className="text-green-600" /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">Environment: Sandbox</p>
              <p className="text-sm text-blue-700">
                Currently using test credentials. Switch to production keys for live transactions.
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <a
                href="https://monnify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">Monnify Dashboard</span>
                <ExternalLink size={18} className="text-gray-600" />
              </a>
              
              <a
                href="https://docs.monnify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">API Documentation</span>
                <ExternalLink size={18} className="text-gray-600" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Integration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <p className="font-medium text-gray-900">VTPass Connected</p>
              <p className="text-sm text-gray-600">Active & operational</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <p className="font-medium text-gray-900">Monnify Configured</p>
              <p className="text-sm text-gray-600">Sandbox mode</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
            <AlertCircle className="text-yellow-600" size={24} />
            <div>
              <p className="font-medium text-gray-900">Production Ready</p>
              <p className="text-sm text-gray-600">Pending activation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
