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
      console.log('🔄 Monnify createReservedAccount called with params:', JSON.stringify(params, null, 2));
      
      const token = await this.getAccessToken();
      console.log('✅ Got Monnify access token');
      
      const { accountReference, accountName, customerEmail, customerName, bvn, nin } = params;

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

      if (bvn) {
        payload.bvn = bvn;
      } else if (nin) {
        payload.nin = nin;
      }

      console.log('📤 Sending Monnify request to:', `${this.baseUrl}/api/v2/bank-transfer/reserved-accounts`);
      console.log('📤 Payload:', JSON.stringify(payload, null, 2));

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

      console.log('📥 Monnify response status:', response.status);
      console.log('📥 Monnify response data:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.responseBody) {
        console.log('✅ Successfully created reserved account');
        console.log('📋 Account details:');
        const body = response.data.responseBody;
        console.log(`   Account Reference: ${body.accountReference}`);
        console.log(`   Account Name: ${body.accountName}`);
        console.log(`   Accounts Count: ${body.accounts?.length || 0}`);
        if (body.accounts && body.accounts.length > 0) {
          body.accounts.forEach((acc, idx) => {
            console.log(`   ${idx + 1}. ${acc.bankName} - ${acc.accountNumber} (${acc.accountName})`);
          });
        }
        return {
          success: true,
          data: response.data.responseBody
        };
      }

      throw new Error('Failed to create reserved account - no responseBody in response');
    } catch (error) {
      console.error('❌ Monnify reserved account error:', error.message);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
        
        // Handle duplicate account error (422) - account already exists
        if (error.response.status === 422 && 
            (error.response.data?.responseCode === 'R42' || 
             error.response.data?.responseMessage?.includes('cannot reserve more than'))) {
          console.log('🔄 Account already exists in Monnify, attempting to retrieve existing account...');
          
          // Try to get the existing account details
          const existingAccount = await this.getReservedAccountDetails(params.accountReference);
          
          if (existingAccount.success) {
            console.log('✅ Successfully retrieved existing account from Monnify');
            return existingAccount;
          } else {
            console.error('❌ Failed to retrieve existing account');
            throw new Error('Account exists in Monnify but could not retrieve details. Please contact support.');
          }
        }
      }
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

  async deallocateReservedAccount(accountReference) {
    try {
      const token = await this.getAccessToken();

      const response = await axios.delete(
        `${this.baseUrl}/api/v1/bank-transfer/reserved-accounts/reference/${encodeURIComponent(accountReference)}`,
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
          message: 'Reserved account deallocated successfully',
          data: response.data.responseBody
        };
      }

      return {
        success: false,
        message: 'Failed to deallocate reserved account'
      };
    } catch (error) {
      console.error('Monnify deallocate account error:', error.response?.data || error.message);
      
      // If account doesn't exist or already deallocated, consider it a success
      if (error.response?.status === 404 || error.response?.data?.responseCode === 'R404') {
        return {
          success: true,
          message: 'Account already deallocated or does not exist'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.responseMessage || 'Failed to deallocate reserved account',
        error: error.message
      };
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
