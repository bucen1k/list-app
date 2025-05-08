// server/app.js

const express = require('express');
const path = require('path');
const { getState, updateState } = require('./state');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API для получения элементов
app.get('/api/items', (req, res) => {
  const { search = '', offset = 0, limit = 20 } = req.query;
  const state = getState();

  let items = Array.from({ length: 1000000 }, (_, i) => ({
    id: i + 1,
    value: `Item ${i + 1}`,
    selected: state.selectedItems.includes(i + 1)
  }));

  if (search) {
    items = items.filter(item => 
      item.value.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (state.customOrder) {
    items.sort((a, b) => {
      const indexA = state.customOrder.indexOf(a.id);
      const indexB = state.customOrder.indexOf(b.id);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }

  const paginatedItems = items.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.json({
    items: paginatedItems,
    total: items.length
  });
});

// Новый API для получения состояния
app.get('/api/state', (req, res) => {
  res.json(getState());
});

// API для обновления состояния
app.post('/api/state', (req, res) => {
  updateState(req.body);
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
