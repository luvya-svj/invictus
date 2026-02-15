const express = require('express');
const router = express.Router();
const { getAllComponents, addComponent, updateComponent, importExcel, clearComponents } = require('../controllers/inventoryController');
const { recordProduction, listProductionHistory, getProductionRunDetails } = require('../controllers/productionController');
const { getTriggers, fulfillTrigger } = require('../controllers/procurementController');
const { login, register } = require('../controllers/authController');
const { getDashboardStats } = require('../controllers/analyticsController');
const auth = require('../middleware/authMiddleware');
const { createPCB, listPCBs, mapComponents, getPCBMapping } = require('../controllers/pcbController');

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);

const upload = require('../middleware/uploadMiddleware');

// Test Route
router.get('/test', (req, res) => res.json({ status: 'ok', msg: 'Backend is reachable' }));

// Inventory Routes
router.get('/components', auth, getAllComponents);
router.post('/components', auth, addComponent);
router.put('/components/:id', auth, updateComponent);
router.post('/components/import', auth, upload.single('file'), importExcel);
router.delete('/components', auth, clearComponents);

// Production Routes
router.post('/production', auth, recordProduction);
router.get('/production/pcbs', auth, listPCBs);
router.get('/production/history', auth, listProductionHistory);
router.get('/production/history/:id', auth, getProductionRunDetails);

// Procurement Routes
router.get('/procurement/triggers', auth, getTriggers);
router.post('/procurement/triggers/:id/fulfill', auth, fulfillTrigger);

// PCB Mapping Routes (Step 2)
router.post('/pcbs', auth, createPCB);
router.get('/pcbs', auth, listPCBs);
router.post('/pcbs/:pcbId/components', auth, mapComponents);
router.get('/pcbs/:pcbId/components', auth, getPCBMapping);

// Analytics Routes
router.get('/analytics/dashboard', auth, getDashboardStats);

// Generic Excel Routes
const { uploadExcel, getFiles, getSheets, getSheetRows, getSheetAnalytics, deleteFile, clearAllFiles } = require('../controllers/excelController');
router.post('/excel/upload', auth, upload.single('file'), uploadExcel);
router.get('/excel/files', auth, getFiles);
router.delete('/excel/files', auth, clearAllFiles);
router.delete('/excel/files/:fileId', auth, deleteFile);
router.get('/excel/files/:fileId/sheets', auth, getSheets);
router.get('/excel/sheets/:sheetId/rows', auth, getSheetRows);
router.get('/excel/sheets/:sheetId/analytics', auth, getSheetAnalytics);

module.exports = router;
