import axios from 'axios';
import { storage } from '../utils/storage';

// ---------------------------------------------------------
// OPTION 1: If using Android Emulator (Standard Way)
// Use 10.0.2.2 to access your computer's localhost
// ---------------------------------------------------------
// const API_URL = 'http://10.0.2.2:8000/api/v1'; 

// ---------------------------------------------------------
// OPTION 2: If the Emulator fails to connect with 10.0.2.2
// You can KEEP your LAN IP (192.168.1.XX), it often works too!
// ---------------------------------------------------------
const API_URL = 'http://192.168.1.101:8000/api/v1'; 

const client = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to attach the Token
client.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;