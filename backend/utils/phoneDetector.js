const nigerianNetworkPrefixes = {
  MTN: ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916', '07025', '07026', '0704'],
  GLO: ['0805', '0807', '0705', '0815', '0811', '0905', '0915'],
  AIRTEL: ['0802', '0808', '0708', '0812', '0701', '0902', '0907', '0901', '0904', '0912'],
  '9MOBILE': ['0809', '0817', '0818', '0909', '0908']
};

const detectNetwork = (phoneNumber) => {
  if (!phoneNumber) {
    return { network: null, normalized: null, valid: false };
  }

  let normalized = phoneNumber.toString().replace(/\D/g, '');
  
  if (normalized.startsWith('234')) {
    normalized = '0' + normalized.substring(3);
  }
  
  if (normalized.startsWith('+234')) {
    normalized = '0' + normalized.substring(4);
  }

  if (normalized.length !== 11 || !normalized.startsWith('0')) {
    return { 
      network: null, 
      normalized: normalized, 
      valid: false,
      error: 'Invalid phone number format. Expected 11 digits starting with 0.'
    };
  }

  for (const [network, prefixes] of Object.entries(nigerianNetworkPrefixes)) {
    for (const prefix of prefixes) {
      if (normalized.startsWith(prefix)) {
        return {
          network,
          normalized: `+234${normalized.substring(1)}`,
          local: normalized,
          valid: true
        };
      }
    }
  }

  return {
    network: 'UNKNOWN',
    normalized: `+234${normalized.substring(1)}`,
    local: normalized,
    valid: true,
    warning: 'Network could not be auto-detected. Please select manually.'
  };
};

module.exports = {
  detectNetwork,
  nigerianNetworkPrefixes
};
