import axios from 'axios';

function baseURL() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
}

export async function checkVoucher({ flight_number, flight_date }) {
  const response = await axios.post(`${baseURL()}/api/check`, { flight_number, flight_date });
  return response.data;
}

export async function generateVoucher(payload) {
  const response = await axios.post(`${baseURL()}/api/generate`, payload);
  return response.data.data;
}

export async function listVouchers() {
  const response = await axios.get(`${baseURL()}/api/vouchers`);
  return response.data.data;
}
