const axios = require('axios');
const VTUProduct = require('../models/VTUProduct');

const getAuthHeaders = () => {
  const token = Buffer.from(`${process.env.VTPASS_USERNAME}:${process.env.VTPASS_API_KEY}`).toString('base64');
  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json'
  };
};

const categoryMapping = {
  'airtime': {
    category: 'airtime',
    type: 'airtime',
    serviceIDs: ['mtn', 'airtel', 'glo', '9mobile']
  },
  'data': {
    category: 'data',
    type: 'data',
    serviceIDs: ['mtn-data', 'airtel-data', 'glo-data', '9mobile-data', 'etisalat-data', 'smile-direct']
  },
  'tv-subscription': {
    category: 'tv-subscription',
    type: 'cable',
    serviceIDs: ['dstv', 'gotv', 'startimes', 'showmax']
  },
  'electricity-bill': {
    category: 'electricity-bill',
    type: 'electricity',
    serviceIDs: ['ikeja-electric', 'eko-electric', 'kano-electric', 'phed', 'jos-electric', 'ibadan-electric', 'kaduna-electric', 'abuja-electric', 'enugu-electric', 'benin-electric', 'aba-electric', 'yola-electric']
  },
  'education': {
    category: 'education',
    type: 'education',
    serviceIDs: ['waec', 'jamb', 'neco']
  },
  'insurance': {
    category: 'insurance',
    type: 'insurance',
    serviceIDs: ['ui-insure', 'personal-accident-insurance']
  },
  'other-services': {
    category: 'other-services',
    type: 'internet',
    serviceIDs: ['smile', 'spectranet']
  },
  'betting': {
    category: 'betting',
    type: 'betting',
    serviceIDs: []
    // Note: Betting services not available in VTPass. Products can be added manually by admin if integrated with another provider.
  }
};

const networkDisplayNames = {
  'mtn': 'MTN',
  'airtel': 'Airtel',
  'glo': 'Glo',
  '9mobile': '9mobile',
  'mtn-data': 'MTN',
  'airtel-data': 'Airtel',
  'glo-data': 'Glo',
  '9mobile-data': '9mobile',
  'etisalat-data': '9mobile',
  'dstv': 'DSTV',
  'gotv': 'GOtv',
  'startimes': 'StarTimes',
  'showmax': 'Showmax',
  'waec': 'WAEC',
  'jamb': 'JAMB',
  'neco': 'NECO',
  'smile': 'Smile',
  'smile-direct': 'Smile',
  'spectranet': 'Spectranet',
  'ui-insure': 'Universal Insurance',
  'personal-accident-insurance': 'Personal Accident Insurance'
};

const extractNetworkName = (serviceID) => {
  return networkDisplayNames[serviceID] || serviceID.toUpperCase();
};

const fetchServiceVariations = async (serviceID) => {
  try {
    const { data } = await axios.get(
      `${process.env.VTPASS_BASE_URL}/service-variations?serviceID=${serviceID}`,
      { headers: getAuthHeaders() }
    );
    
    if (data && data.content && data.content.varations) {
      return data.content.varations;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching variations for ${serviceID}:`, error.message);
    return [];
  }
};

const mapVariationToProduct = (variation, serviceID, categoryInfo) => {
  const network = extractNetworkName(serviceID);
  
  return {
    title: variation.name || variation.variation_code,
    displayName: variation.name || variation.variation_code,
    description: variation.name,
    category: categoryInfo.category,
    type: categoryInfo.type,
    serviceID: serviceID,
    variationCode: variation.variation_code,
    network: network,
    faceValue: parseFloat(variation.variation_amount) || 0,
    sellingPrice: parseFloat(variation.variation_amount) || 0,
    minimumAmount: parseFloat(variation.variation_amount) || 0,
    maximumAmount: parseFloat(variation.variation_amount) || 0,
    commissionRate: 0,
    vendor: 'vtpass',
    vendorCode: `${serviceID}_${variation.variation_code}`,
    validity: variation.name,
    isActive: true,
    isPopular: false,
    displayOrder: 0,
    lastSyncedAt: new Date(),
    vtpassData: variation
  };
};

const syncCategory = async (categoryKey) => {
  const categoryInfo = categoryMapping[categoryKey];
  if (!categoryInfo) {
    return { success: false, message: `Unknown category: ${categoryKey}` };
  }

  let totalSynced = 0;
  let totalErrors = 0;
  const syncedServices = [];

  for (const serviceID of categoryInfo.serviceIDs) {
    try {
      const variations = await fetchServiceVariations(serviceID);
      
      if (variations.length === 0) {
        console.log(`No variations found for ${serviceID}`);
        continue;
      }

      for (const variation of variations) {
        try {
          const productData = mapVariationToProduct(variation, serviceID, categoryInfo);
          
          const existingProduct = await VTUProduct.findOne({
            vendorCode: productData.vendorCode
          });

          if (existingProduct) {
            await VTUProduct.findByIdAndUpdate(existingProduct._id, {
              $set: {
                ...productData,
                commissionRate: existingProduct.commissionRate,
                isActive: existingProduct.isActive,
                isPopular: existingProduct.isPopular,
                displayOrder: existingProduct.displayOrder
              }
            });
          } else {
            await VTUProduct.create(productData);
          }
          
          totalSynced++;
        } catch (error) {
          console.error(`Error syncing variation ${variation.variation_code}:`, error.message);
          totalErrors++;
        }
      }

      syncedServices.push(serviceID);
    } catch (error) {
      console.error(`Error syncing service ${serviceID}:`, error.message);
      totalErrors++;
    }
  }

  return {
    success: true,
    category: categoryKey,
    totalSynced,
    totalErrors,
    syncedServices
  };
};

const syncAllCategories = async () => {
  const results = {
    startTime: new Date(),
    categories: {},
    totalProducts: 0,
    totalErrors: 0
  };

  for (const categoryKey of Object.keys(categoryMapping)) {
    const result = await syncCategory(categoryKey);
    results.categories[categoryKey] = result;
    results.totalProducts += result.totalSynced || 0;
    results.totalErrors += result.totalErrors || 0;
  }

  results.endTime = new Date();
  results.duration = results.endTime - results.startTime;

  return results;
};

const getServiceCategories = () => {
  return Object.keys(categoryMapping).map(key => ({
    key,
    category: categoryMapping[key].category,
    type: categoryMapping[key].type,
    serviceIDs: categoryMapping[key].serviceIDs
  }));
};

module.exports = {
  syncCategory,
  syncAllCategories,
  getServiceCategories,
  fetchServiceVariations
};
