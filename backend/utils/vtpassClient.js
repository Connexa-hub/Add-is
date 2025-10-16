// File: /addis-app/backend/utils/vtpassClient.js
const axios = require('axios');
const uuid = require('uuid');

const getAuthHeaders = () => {
  const token = Buffer.from(`${process.env.VTPASS_USERNAME}:${process.env.VTPASS_API_KEY}`).toString('base64');
  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json'
  };
};

const requestVTPass = async (serviceID, params) => {
  const payload = {
    request_id: uuid.v4(),
    serviceID,
    ...params
  };
  const { data } = await axios.post(`${process.env.VTPASS_BASE_URL}/pay`, payload, { headers: getAuthHeaders() });
  return data;
};

module.exports = { requestVTPass };
