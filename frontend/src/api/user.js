import axios from 'axios';
import { API_URL } from './admin';

export const registerUser = async ({ name, email, password, password_confirmation }) => {
  const res = await axios.post(`${API_URL}/user/register`, {
    name, email, password, password_confirmation,
  });
  return res.data; // { message, verification_url }
};

export const loginUser = async ({ email, password }) => {
  const res = await axios.post(`${API_URL}/user/login`, { email, password });
  return res.data; // { token, user }
};

export const resendVerification = async ({ email }) => {
  const res = await axios.post(`${API_URL}/user/email/resend`, { email });
  return res.data; // { message, verification_url }
};

export const requestPasswordReset = async ({ email }) => {
  const res = await axios.post(`${API_URL}/user/password/request`, { email });
  return res.data; // { message, reset_url }
};

export const resetPassword = async ({ id, hash, password, password_confirmation }) => {
  const res = await axios.post(`${API_URL}/user/password/reset`, { id, hash, password, password_confirmation });
  return res.data; // { message }
};