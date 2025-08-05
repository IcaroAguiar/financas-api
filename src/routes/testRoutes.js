// Test routes to debug routing issues
const { Router } = require('express');

const router = Router();

console.log('🧪 Test routes loaded!');

router.get('/hello', (req, res) => {
  console.log('🎯 Test route hit!');
  res.json({ message: 'Test route works!' });
});

module.exports = router;