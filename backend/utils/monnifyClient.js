const axios = require('axios');
const crypto = require('crypto');

class MonnifyClient {
  constructor() {
    this.apiKey = process.env.MONNIFY_API_KEY;
    this.secretKey = process.env.MONNIFY_SECRET_KEY;
    this.contractCode = process.env.MONNIFY_CONTRACT_CODE;
    this.baseUrl = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    try {
      const credentials = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64');
      
      const response = await axios.post(
        `${this.baseUrl}/api/v1/auth/login`,
        {},
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.responseBody) {
        this.accessToken = response.data.responseBody.accessToken;
        this.tokenExpiry = Date.now() + (3600 * 1000);
        return this.accessToken;
      }

      throw new Error('Failed to authenticate with Monnify');
    } catch (error) {
      console.error('Monnify authentication error:', error.response?.data || error.message);
      throw new Error('Monnify authentication failed');
    }
  }

  async getAccessToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
    return this.accessToken;
  }

  async initializeTransaction(params) {
    try {
      const token = await this.getAccessToken();
      const { amount, customerName, customerEmail, paymentReference, paymentDescription } = params;

      const payload = {
        amount: parseFloat(amount),
        customerName,
        customerEmail,
        paymentReference,
        paymentDescription: paymentDescription || 'Wallet Funding',
        currencyCode: 'NGN',
        contractCode: this.contractCode,
        redirectUrl: params.redirectUrl || '',
        paymentMethods: ['CARD', 'ACCOUNT_TRANSFER', 'USSD']
      };

      const response = await axios.post(
        `${this.baseUrl}/api/v1/merchant/transactions/init-transaction`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.responseBody) {
        return {
          success: true,
          data: response.data.responseBody
        };
      }

      throw new Error('Failed to initialize transaction');
    } catch (error) {
      console.error('Monnify transaction initialization error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.responseMessage || 'Failed to initialize payment');
    }
  }

  async verifyTransaction(transactionReference) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/api/v2/transactions/${encodeURIComponent(transactionReference)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.responseBody) {
        const transaction = response.data.responseBody;
        return {
          success: true,
          isPaid: transaction.paymentStatus === 'PAID',
          amount: transaction.amountPaid,
          status: transaction.paymentStatus,
          reference: transaction.transactionReference,
          paymentReference: transaction.paymentReference,
          paidOn: transaction.paidOn,
          data: transaction
        };
      }

      throw new Error('Failed to verify transaction');
    } catch (error) {
      console.error('Monnify verification error:', error.response?.data || error.message);
      throw new Error('Failed to verify payment');
    }
  }

  async createReservedAccount(params) {
    try {
      const token = await this.getAccessToken();
      const { accountReference, accountName, customerEmail, customerName } = params;

      const payload = {
        accountReference,
        accountName,
        currencyCode: 'NGN',
        contractCode: this.contractCode,
        customerEmail,
        customerName,
        getAllAvailableBanks: false,
        preferredBanks: ['035', '50515']
      };

      const response = await axios.post(
        `${this.baseUrl}/api/v2/bank-transfer/reserved-accounts`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.responseBody) {
        return {
          success: true,
          data: response.data.responseBody
        };
      }

      throw new Error('Failed to create reserved account');
    } catch (error) {
      console.error('Monnify reserved account error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.responseMessage || 'Failed to create virtual account');
    }
  }

  async getReservedAccountDetails(accountReference) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/api/v2/bank-transfer/reserved-accounts/${encodeURIComponent(accountReference)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.responseBody) {
        return {
          success: true,
          data: response.data.responseBody
        };
      }

      throw new Error('Failed to get reserved account details');
    } catch (error) {
      console.error('Monnify get reserved account error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAccountBalance() {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.baseUrl}/api/v1/merchant/wallet`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.responseBody) {
        return {
          success: true,
          balance: response.data.responseBody.availableBalance,
          data: response.data.responseBody
        };
      }

      throw new Error('Failed to get wallet balance');
    } catch (error) {
      console.error('Monnify wallet balance error:', error.response?.data || error.message);
      throw new Error('Failed to fetch wallet balance');
    }
  }

  verifyWebhookSignature(payload, signature) {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return hash === signature;
  }
}

module.exports = new MonnifyClient();
