const express = require('express');
const router = express.Router();
const controller = require('../controllers/technicalSupportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', controller.getList);
router.get('/my', authenticateToken, controller.getMyList);
router.get('/faq', controller.getFAQ);
router.get(
    '/statistics',
    authenticateToken,
    requireRole(['admin']),
    controller.getStatistics
);
router.get('/:id', controller.getDetail);

router.post('/', authenticateToken, controller.create);
router.put('/:id', authenticateToken, controller.update);
router.put(
    '/:id/status',
    authenticateToken,
    requireRole(['admin']),
    controller.updateStatus
);
router.delete('/:id', authenticateToken, controller.delete);

module.exports = router;
