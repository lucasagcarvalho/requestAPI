import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function App() {
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

  // Load saved URLs from AsyncStorage on component mount
  useEffect(() => {
    const loadSavedUrls = async () => {
      try {
        const savedData = await AsyncStorage.getItem('apiTesterUrls');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setSavedUrls(parsed);
          setBaseUrl(parsed[environment]);
        }
      } catch (e) {
        console.error('Failed to load saved URLs', e);
      }
    };
    
    loadSavedUrls();
  }, []);

  // Update baseUrl when environment changes
  useEffect(() => {
    setBaseUrl(savedUrls[environment] || '');
  }, [environment, savedUrls]);

  const saveBaseUrl = async () => {
    try {
      const newSavedUrls = {
        ...savedUrls,
        [environment]: baseUrl
      };
      setSavedUrls(newSavedUrls);
      await AsyncStorage.setItem('apiTesterUrls', JSON.stringify(newSavedUrls));
    } catch (e) {
      console.error('Failed to save URL', e);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResponse('');
    setStatusCode(null);

    try {
      // Construct the full URL
      const fullUrl = `${baseUrl}${url}${urlParams ? `?${urlParams}` : ''}`;
      
      // Prepare headers
      const headers: Record<string, string> = {
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

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(response);
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

  // Get status code color
  const getStatusCodeColor = (code: number | null) => {
    if (!code) return '#6B7280'; // gray
    if (code >= 200 && code < 300) return '#10B981'; // green
    if (code >= 300 && code < 400) return '#3B82F6'; // blue
    if (code >= 400 && code < 500) return '#F59E0B'; // yellow
    return '#EF4444'; // red
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView}>
          <Text style={styles.title}>API Testing Interface</Text>
          
          {/* Request Panel */}
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Request</Text>
            
            {/* Environment Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Environment</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity 
                  style={styles.radioButton} 
                  onPress={() => setEnvironment('development')}
                >
                  <View style={[
                    styles.radio, 
                    environment === 'development' && styles.radioSelected
                  ]} />
                  <Text style={styles.radioLabel}>Development</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.radioButton} 
                  onPress={() => setEnvironment('production')}
                >
                  <View style={[
                    styles.radio, 
                    environment === 'production' && styles.radioSelected
                  ]} />
                  <Text style={styles.radioLabel}>Production</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Base URL with Save Button */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Base URL</Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={styles.inputWithButtonField}
                  placeholder={environment === 'development' ? 'http://localhost:3000' : 'https://api.example.com'}
                  value={baseUrl}
                  onChangeText={setBaseUrl}
                />
                <TouchableOpacity style={styles.saveButton} onPress={saveBaseUrl}>
                  <Icon name="content-save" size={20} color="#4B5563" />
                </TouchableOpacity>
              </View>
              {savedUrls[environment] ? (
                <View style={styles.savedUrlContainer}>
                  <Icon name="database" size={12} color="#6B7280" />
                  <Text style={styles.savedUrlText}>Saved: {savedUrls[environment]}</Text>
                </View>
              ) : null}
            </View>
            
            {/* HTTP Method */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Method</Text>
              <View style={styles.methodSelector}>
                <TouchableOpacity
                  style={[styles.methodButton, method === 'GET' && styles.methodButtonSelected]}
                  onPress={() => setMethod('GET')}
                >
                  <Text style={[styles.methodButtonText, method === 'GET' && styles.methodButtonTextSelected]}>GET</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, method === 'POST' && styles.methodButtonSelected]}
                  onPress={() => setMethod('POST')}
                >
                  <Text style={[styles.methodButtonText, method === 'POST' && styles.methodButtonTextSelected]}>POST</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodButton, method === 'PUT' && styles.methodButtonSelected]}
                  onPress={() => setMethod('PUT')}
                >
                  <Text style={[styles.methodButtonText, method === 'PUT' && styles.methodButtonTextSelected]}>PUT</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Endpoint URL */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Endpoint URL</Text>
              <TextInput
                style={styles.input}
                placeholder="/api/users"
                value={url}
                onChangeText={setUrl}
              />
            </View>
            
            {/* URL Parameters */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>URL Parameters</Text>
              <TextInput
                style={styles.input}
                placeholder="id=123&filter=active"
                value={urlParams}
                onChangeText={setUrlParams}
              />
            </View>
            
            {/* Authentication */}
            <View style={styles.formGroup}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setUseAuth(!useAuth)}
                >
                  {useAuth && <Icon name="check" size={16} color="#3B82F6" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Use Bearer Token Authentication</Text>
              </View>
              
              {useAuth && (
                <TextInput
                  style={styles.input}
                  placeholder="Enter your token"
                  value={token}
                  onChangeText={setToken}
                />
              )}
            </View>
            
            {/* Request Body (for POST/PUT) */}
            {method !== 'GET' && (
              <View style={styles.formGroup}>
                <View style={styles.jsonHeaderContainer}>
                  <Text style={styles.label}>Request Body (JSON)</Text>
                  <TouchableOpacity onPress={formatJsonBody}>
                    <Text style={styles.formatButton}>Format JSON</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.jsonInput}
                  placeholder='{"name": "John", "email": "john@example.com"}'
                  value={jsonBody}
                  onChangeText={setJsonBody}
                  multiline
                  numberOfLines={10}
                />
              </View>
            )}
            
            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
              ) : (
                <Icon name="send" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              )}
              <Text style={styles.submitButtonText}>
                {loading ? 'Sending...' : 'Send Request'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Response Panel */}
          <View style={styles.panel}>
            <View style={styles.responseHeader}>
              <View style={styles.responseHeaderLeft}>
                <Text style={styles.panelTitle}>Response</Text>
                {statusCode && (
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusCodeColor(statusCode)}20` }]}>
                    <Text style={[styles.statusCode, { color: getStatusCodeColor(statusCode) }]}>
                      {statusCode}
                    </Text>
                    <Text style={styles.statusText}>{getStatusText(statusCode)}</Text>
                  </View>
                )}
              </View>
              {response ? (
                <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                  {copied ? (
                    <>
                      <Icon name="check" size={16} color="#6B7280" style={styles.copyIcon} />
                      <Text style={styles.copyText}>Copied!</Text>
                    </>
                  ) : (
                    <>
                      <Icon name="content-copy" size={16} color="#6B7280" style={styles.copyIcon} />
                      <Text style={styles.copyText}>Copy</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            <View style={styles.responseContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                </View>
              ) : response ? (
                <ScrollView style={styles.responseScroll}>
                  <Text style={styles.responseText}>{response}</Text>
                </ScrollView>
              ) : (
                <View style={styles.emptyResponseContainer}>
                  <Text style={styles.emptyResponseText}>
                    Response will appear here after sending a request
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radio: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  radioLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithButtonField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRightWidth: 0,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderLeftWidth: 0,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  savedUrlText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  methodSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  methodButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  methodButtonSelected: {
    backgroundColor: '#3B82F6',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  methodButtonTextSelected: {
    color: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  jsonHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  formatButton: {
    fontSize: 12,
    color: '#3B82F6',
  },
  jsonInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minHeight: 200,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 8,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  responseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusText: {
    fontSize: 12,
    marginLeft: 6,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyIcon: {
    marginRight: 4,
  },
  copyText: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  responseContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    height: 300,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseScroll: {
    flex: 1,
    padding: 12,
  },
  responseText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  emptyResponseContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyResponseText: {
    color: '#6B7280',
    textAlign: 'center',
  },
});