const express = require('express');
const path = require('path');
const app = express();

const publicDir = path.join(__dirname, 'public');

app.use(express.static(publicDir));

//===============================
app.get('/', function (req, res) {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/index.html', function (req, res) {
  res.sendFile(path.join(publicDir, 'index.html'));
});
//===============================

// app.get('/home.html', function (req, res) {
//   res.sendFile(path.join(publicDir, 'home.html'));
// });



app.listen(8080, function () {
  console.log('listening on 8080');
});

