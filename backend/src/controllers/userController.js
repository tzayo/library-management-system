import { Op } from 'sequelize';
import { User, Loan, Book } from '../models/index.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
  try {
    const {
      search = '',
      role = '',
      isActive = '',
      page = 1,
      limit = 20
    } = req.query;

    // Build where clause
    const where = {};

    // Search by name or email
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by role
    if (role) {
      where.role = role;
    }

    // Filter by active status
    if (isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch users with loan counts
    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      attributes: {
        exclude: ['password']
      }
    });

    // Get active loan counts for each user
    const usersWithLoans = await Promise.all(
      users.map(async (user) => {
        const activeLoansCount = await Loan.count({
          where: {
            userId: user.id,
            returnedAt: null
          }
        });

        return {
          ...user.toJSON(),
          activeLoansCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        users: usersWithLoans,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading users list',
      error: error.message
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: {
        exclude: ['password']
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's loan statistics
    const activeLoans = await Loan.count({
      where: {
        userId: id,
        returnedAt: null
      }
    });

    const totalLoans = await Loan.count({
      where: { userId: id }
    });

    const overdueLoans = await Loan.count({
      where: {
        userId: id,
        status: 'overdue'
      }
    });

    // Get recent loans
    const recentLoans = await Loan.findAll({
      where: { userId: id },
      limit: 10,
      order: [['borrowedAt', 'DESC']],
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'author', 'coverImage']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
        statistics: {
          activeLoans,
          totalLoans,
          overdueLoans
        },
        recentLoans
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading user details',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, role, isActive } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (id === req.user.id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Cannot disable your own account'
      });
    }

    // Prevent admin from changing their own role
    if (id === req.user.id && role && role !== user.role) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'This email already exists in the system'
        });
      }
    }

    // Update user
    await user.update({
      fullName: fullName !== undefined ? fullName : user.fullName,
      email: email !== undefined ? email : user.email,
      phone: phone !== undefined ? phone : user.phone,
      role: role !== undefined ? role : user.role,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    res.status(200).json({
      success: true,
      message: 'User details updated successfully',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user details',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user has active loans
    const activeLoans = await Loan.count({
      where: {
        userId: id,
        returnedAt: null
      }
    });

    if (activeLoans > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active loans'
      });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-active
// @access  Private (Admin)
export const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot disable your own account'
      });
    }

    // If deactivating, check for active loans
    if (user.isActive) {
      const activeLoans = await Loan.count({
        where: {
          userId: id,
          returnedAt: null
        }
      });

      if (activeLoans > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot disable user with active loans'
        });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isActive ? 'User activated successfully' : 'User deactivated successfully',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Toggle user active error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing user status',
      error: error.message
    });
  }
};

// @desc    Change user role
// @route   PUT /api/users/:id/role
// @access  Private (Admin)
export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'editor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing user role',
      error: error.message
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin)
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const inactiveUsers = await User.count({ where: { isActive: false } });

    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      group: ['role']
    });

    const roleStats = {};
    usersByRole.forEach(item => {
      roleStats[item.role] = parseInt(item.getDataValue('count'));
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: roleStats
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading user statistics',
      error: error.message
    });
  }
};
