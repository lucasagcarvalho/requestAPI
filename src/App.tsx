import { Save, Database, ChevronDown, RefreshCw, Send, Check, Copy } from 'lucide-react';
import React, { useState, useEffect } from 'react';

function App() {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT'>('GET');
  const [url, setUrl] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [environment, setEnvironment] = useState<'development' | 'production'>('development');
  const [useAuth, setUseAuth] = useState(false);
  const [token, setToken] = useState('');
  const [jsonBody, setJsonBody] = useState('');
  const [urlParams, setUrlParams] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [savedUrls, setSavedUrls] = useState({
    development: '',
    production: ''
  });

  // Load saved URLs from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('apiTesterUrls');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setSavedUrls(parsed);
      setBaseUrl(parsed[environment]);
    }
  }, []);

  // Update baseUrl when environment changes
  useEffect(() => {
    setBaseUrl(savedUrls[environment] || '');
  }, [environment, savedUrls]);

  const saveBaseUrl = () => {
    const newSavedUrls = {
      ...savedUrls,
      [environment]: baseUrl
    };
    setSavedUrls(newSavedUrls);
    localStorage.setItem('apiTesterUrls', JSON.stringify(newSavedUrls));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse('');
    setStatusCode(null);

    try {
      // Construct the full URL
      const fullUrl = `${baseUrl}${url}${urlParams ? `?${urlParams}` : ''}`;
      
      // Prepare headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (useAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Prepare request options
      const options: RequestInit = {
        method,
        headers,
      };
      
      // Add body for POST and PUT requests
      if (method !== 'GET' && jsonBody) {
        try {
          // Validate JSON
          JSON.parse(jsonBody);
          options.body = jsonBody;
        } catch (e) {
          setError('Invalid JSON in request body');
          setLoading(false);
          return;
        }
      }
      
      // Make the request
      const res = await fetch(fullUrl, options);
      setStatusCode(res.status);
      
      try {
        const data = await res.json();
        // Format and display the response
        setResponse(JSON.stringify(data, null, 2));
      } catch (e) {
        // Handle non-JSON responses
        const text = await res.text();
        setResponse(text || 'No response body');
      }
    } catch (err) {
      setError(`Request failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatJsonBody = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(jsonBody), null, 2);
      setJsonBody(formatted);
    } catch (e) {
      setError('Invalid JSON in request body');
    }
  };

  // Function to syntax highlight JSON
  const syntaxHighlight = (json: string) => {
    if (!json) return '';
    
    // Try to parse and format the JSON
    try {
      if (typeof json !== 'string') {
        json = JSON.stringify(json, null, 2);
      } else {
        // Make sure it's valid JSON before parsing
        JSON.parse(json);
        json = JSON.stringify(JSON.parse(json), null, 2);
      }
    } catch (e) {
      return json; // Return as-is if not valid JSON
    }
    
    // Apply syntax highlighting with colors
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'text-purple-600'; // string
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-red-600'; // key
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-blue-600'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-gray-600'; // null
      } else {
        cls = 'text-green-600'; // number
      }
      return `<span class="${cls}">${match}</span>`;
    });
  };

  // Get status code color
  const getStatusCodeColor = (code: number | null) => {
    if (!code) return 'text-gray-600';
    if (code >= 200 && code < 300) return 'text-green-600';
    if (code >= 300 && code < 400) return 'text-blue-600';
    if (code >= 400 && code < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get status text
  const getStatusText = (code: number | null) => {
    if (!code) return '';
    
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    
    return statusTexts[code] || '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">API Testing Interface</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Panel */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Request</h2>
              
              {/* Base URL with Save Button */}
              <div className="mb-4">
                <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Base URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="baseUrl"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={environment === 'development' ? 'http://localhost:3000' : 'https://api.example.com'}
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={saveBaseUrl}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 border-l-0 rounded-r-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Save Base URL"
                  >
                    <Save size={18} className="text-gray-600" />
                  </button>
                </div>
                {savedUrls[environment] && (
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <Database size={12} className="mr-1" />
                    Saved: {savedUrls[environment]}
                  </div>
                )}
              </div>
              
              {/* HTTP Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <div className="relative">
                  <select
                    className="block appearance-none w-full bg-white border border-gray-300 rounded-md py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as 'GET' | 'POST' | 'PUT')}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
              
              {/* Endpoint URL */}
              <div className="mb-4">
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                  Endpoint URL
                </label>
                <input
                  type="text"
                  id="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/api/users"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
              
              {/* URL Parameters */}
              <div className="mb-4">
                <label htmlFor="urlParams" className="block text-sm font-medium text-gray-700 mb-1">
                  URL Parameters
                </label>
                <input
                  type="text"
                  id="urlParams"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="id=123&filter=active"
                  value={urlParams}
                  onChange={(e) => setUrlParams(e.target.value)}
                />
              </div>
              
              {/* Authentication */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="useAuth"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={useAuth}
                    onChange={(e) => setUseAuth(e.target.checked)}
                  />
                  <label htmlFor="useAuth" className="ml-2 block text-sm text-gray-700">
                    Use Bearer Token Authentication
                  </label>
                </div>
                
                {useAuth && (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                )}
              </div>
              
              {/* Request Body (for POST/PUT) */}
              {method !== 'GET' && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="jsonBody" className="block text-sm font-medium text-gray-700">
                      Request Body (JSON)
                    </label>
                    <button
                      type="button"
                      onClick={formatJsonBody}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Format JSON
                    </button>
                  </div>
                  <textarea
                    id="jsonBody"
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder='{"name": "John", "email": "john@example.com"}'
                    value={jsonBody}
                    onChange={(e) => setJsonBody(e.target.value)}
                  />
                </div>
              )}
              
              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw size={18} className="animate-spin mr-2" />
                ) : (
                  <Send size={18} className="mr-2" />
                )}
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </form>
          </div>
          
          {/* Response Panel */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-gray-700">Response</h2>
                {statusCode && (
                  <div className={`ml-4 px-2 py-1 rounded-md ${getStatusCodeColor(statusCode)} bg-opacity-10 flex items-center`}>
                    <span className={`font-mono font-bold ${getStatusCodeColor(statusCode)}`}>{statusCode}</span>
                    <span className="ml-2 text-sm">{getStatusText(statusCode)}</span>
                  </div>
                )}
              </div>
              {response && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} className="mr-1" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
                {error}
              </div>
            )}
            
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 h-[500px] overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw size={24} className="animate-spin text-blue-600" />
                </div>
              ) : response ? (
                <pre 
                  className="text-sm font-mono whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: syntaxHighlight(response) }}
                />
              ) : (
                <div className="text-gray-500 text-center h-full flex items-center justify-center">
                  Response will appear here after sending a request
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;