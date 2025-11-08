import axios from 'axios';
import { API_URL } from './admin';

export const getProvinces = async () => {
  const res = await axios.get(`${API_URL}/shipping/provinces`);
  return res.data; // { ok, data: [{ province_id, province }] }
};

export const getCities = async (provinceId) => {
  const res = await axios.get(`${API_URL}/shipping/cities`, {
    params: { province_id: provinceId }
  });
  return res.data; // { ok, data: [{ city_id, city_name, type, postal_code }] }
};

export const getSubdistricts = async (cityId) => {
  const res = await axios.get(`${API_URL}/shipping/subdistricts`, {
    params: { city_id: cityId }
  });
  return res.data; // { ok, data: [{ subdistrict_id, subdistrict_name }] }
};

export const getShippingCost = async ({ destination_city_id, destination_subdistrict_id, weight, length, width, height }) => {
  const payload = { destination_city_id, weight };
  if (destination_subdistrict_id) payload.destination_subdistrict_id = destination_subdistrict_id;
  if (length) payload.length = length;
  if (width) payload.width = width;
  if (height) payload.height = height;
  const res = await axios.post(`${API_URL}/shipping/cost`, payload);
  return res.data; // { ok, data: { jne: [...], jnt: [...] }, warning? }
};