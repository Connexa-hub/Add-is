const User = require('../models/User');
const Notification = require('../models/Notification');

const submitKYC = async (req, res) => {
  try {
    const userId = req.userId;
    const { personal, documents } = req.body;

    if (!personal || !personal.fullName || !personal.dateOfBirth || !personal.idNumber) {
      return res.status(400).json({
        success: false,
        message: 'Personal details are required: fullName, dateOfBirth, idNumber'
      });
    }

    if (!personal.bvn && !personal.nin) {
      return res.status(400).json({
        success: false,
        message: 'Either BVN or NIN is required for KYC verification (CBN regulation compliance)'
      });
    }

    if (!documents || documents.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'All documents required: ID front, ID back, and selfie'
      });
    }

    const requiredDocs = ['id_front', 'id_back', 'selfie'];
    const providedDocs = documents.map(d => d.type);
    const missingDocs = requiredDocs.filter(type => !providedDocs.includes(type));

    if (missingDocs.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing documents: ${missingDocs.join(', ')}`
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.kyc && user.kyc.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'KYC submission is already pending review'
      });
    }

    if (user.kyc && user.kyc.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'KYC is already approved'
      });
    }

    user.kyc = {
      status: 'pending',
      submittedAt: new Date(),
      personal: {
        fullName: personal.fullName,
        dateOfBirth: new Date(personal.dateOfBirth),
        address: personal.address,
        idNumber: personal.idNumber,
        bvn: personal.bvn,
        nin: personal.nin,
        nationality: personal.nationality || 'Nigeria',
        phoneNumber: personal.phoneNumber,
        state: personal.state,
        city: personal.city
      },
      documents: documents.map(doc => ({
        type: doc.type,
        url: doc.url,
        filename: doc.filename,
        uploadedAt: new Date()
      }))
    };

    await user.save();

    await Notification.create({
      userId: user._id,
      title: 'KYC Submitted',
      message: 'Your KYC verification has been submitted and is under review. You will be notified once reviewed.',
      type: 'info',
      actionType: 'system'
    });

    res.json({
      success: true,
      message: 'KYC submitted successfully and is under review',
      data: {
        status: user.kyc.status,
        submittedAt: user.kyc.submittedAt
      }
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit KYC',
      error: error.message
    });
  }
};

const getKYCStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('kyc');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const kycData = user.kyc || { status: 'not_submitted' };

    res.json({
      success: true,
      data: {
        status: kycData.status,
        submittedAt: kycData.submittedAt,
        reviewedAt: kycData.reviewedAt,
        rejectionReason: kycData.rejectionReason,
        personal: kycData.personal
      }
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC status',
      error: error.message
    });
  }
};

const listPendingKYC = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};

    if (status) {
      query['kyc.status'] = status;
    } else {
      query['kyc.status'] = 'pending';
    }

    const users = await User.find(query)
      .select('name email kyc createdAt')
      .sort({ 'kyc.submittedAt': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          userId: user._id,
          name: user.name,
          email: user.email,
          kyc: user.kyc,
          createdAt: user.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('List KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list KYC submissions',
      error: error.message
    });
  }
};

const approveKYC = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.userId;
    const { notes } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.kyc || user.kyc.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending KYC to approve'
      });
    }

    user.kyc.status = 'approved';
    user.kyc.reviewedAt = new Date();
    user.kyc.reviewerId = adminId;
    user.kyc.notes = notes;

    await user.save();

    await Notification.create({
      userId: user._id,
      title: 'KYC Approved',
      message: 'Congratulations! Your KYC verification has been approved. You now have full access to all features.',
      type: 'success',
      actionType: 'system'
    });

    res.json({
      success: true,
      message: 'KYC approved successfully',
      data: {
        userId: user._id,
        status: user.kyc.status,
        reviewedAt: user.kyc.reviewedAt
      }
    });
  } catch (error) {
    console.error('Approve KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve KYC',
      error: error.message
    });
  }
};

const rejectKYC = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.userId;
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.kyc || user.kyc.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending KYC to reject'
      });
    }

    user.kyc.status = 'rejected';
    user.kyc.reviewedAt = new Date();
    user.kyc.reviewerId = adminId;
    user.kyc.rejectionReason = reason;
    user.kyc.notes = notes;

    await user.save();

    await Notification.create({
      userId: user._id,
      title: 'KYC Rejected',
      message: `Your KYC verification was rejected. Reason: ${reason}. Please resubmit with correct information.`,
      type: 'warning',
      actionType: 'system'
    });

    res.json({
      success: true,
      message: 'KYC rejected',
      data: {
        userId: user._id,
        status: user.kyc.status,
        rejectionReason: reason,
        reviewedAt: user.kyc.reviewedAt
      }
    });
  } catch (error) {
    console.error('Reject KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject KYC',
      error: error.message
    });
  }
};

module.exports = {
  submitKYC,
  getKYCStatus,
  listPendingKYC,
  approveKYC,
  rejectKYC
};
