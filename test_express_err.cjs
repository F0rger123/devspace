const express = require('express');
const app = express();
app.post('/error', (req, res) => {
  throw new Error("test error");
});
app.listen(3001, () => "started");
