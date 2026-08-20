import jwt from 'jsonwebtoken';
import Manager from './Manager.js';

// Verifies the managerToken cookie, loads the manager (with role populated),
// and attaches req.manager + req.permissions for downstream routes/controllers.
export const managerAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.managerToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const manager = await Manager.findById(decoded.managerId).populate('role', 'name label permissions');

    if (!manager) {
      return res.status(401).json({ success: false, message: 'Manager account not found.' });
    }

    if (manager.status !== 'active') {
      return res.status(403).json({ success: false, message: `This account is ${manager.status}.` });
    }

    req.manager = manager;
    req.permissions = await manager.getEffectivePermissions();

    next();
  } catch (error) {
    console.error('Manager auth middleware error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};