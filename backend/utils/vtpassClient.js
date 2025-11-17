// File: /addis-app/backend/utils/vtpassClient.js
const axios = require('axios');
const uuid = require('uuid');

const getAuthHeaders = () => {
  return {
    'api-key': process.env.VTPASS_API_KEY,
    'secret-key': process.env.VTPASS_SECRET_KEY,
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
