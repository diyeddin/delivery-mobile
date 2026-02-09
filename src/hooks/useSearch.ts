import { useState, useRef } from 'react';
import { TextInput, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storesApi } from '../api/stores';
import { productsApi } from '../api/products';
import { useAbortController } from './useAbortController';
import { handleApiError } from '../utils/handleApiError';
import { Store, Product } from '../types';

const HISTORY_KEY = 'search_history';

export function useSearch(type: 'store' | 'product') {
  const { getSignal } = useAbortController();

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'history' | 'suggestions' | 'results'>('history');
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<(Store | Product)[]>([]);
  const [results, setResults] = useState<(Store | Product)[]>([]);
  // Note: Using union type. Consumers should narrow with type guards or cast as needed.
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) { /* ignore */ }
  };

  const saveToHistory = async (text: string) => {
    if (!text.trim()) return;
    const clean = text.trim();
    const newHistory = [clean, ...history.filter(h => h !== clean)].slice(0, 10);
    setHistory(newHistory);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  };

  const fetchSuggestions = async (text: string) => {
    if (!text.trim()) return;
    const signal = getSignal();
    try {
      const params = { q: text, limit: 6 };
      const data = type === 'store'
        ? await storesApi.getAll(params, signal)
        : await productsApi.getAll(params, signal);

      const items = data.data || data || [];
      setSuggestions(items);
    } catch (error: unknown) {
      handleApiError(error, { fallbackTitle: 'Suggestion error', showToast: false });
    }
  };

  const performFullSearch = async (text: string) => {
    const term = text.trim();
    if (!term) return;

    Keyboard.dismiss();
    setMode('results');
    setLoading(true);
    saveToHistory(term);
    const signal = getSignal();

    try {
      const params = { q: term, limit: 50 };
      const data = type === 'store'
        ? await storesApi.getAll(params, signal)
        : await productsApi.getAll(params, signal);

      const items = data.data || data || [];
      setResults(items);
    } catch (error: unknown) {
      handleApiError(error, { fallbackTitle: 'Search error', showToast: false });
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setQuery(text);

    if (text.length === 0) {
      setMode('history');
      setSuggestions([]);
      return;
    }

    if (mode !== 'suggestions') setMode('suggestions');

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  const handleClear = () => {
    setQuery('');
    setMode('history');
    setSuggestions([]);
    setResults([]);
    inputRef.current?.focus();
  };

  return {
    query, setQuery, mode, history, suggestions, results,
    loading, inputRef,
    loadHistory, clearHistory, performFullSearch,
    handleTextChange, handleClear,
  };
}
