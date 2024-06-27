const express = require('express');
const app = express();
let path = require('path');
let sdk = require('./sdk');

const PORT = 8001;
const HOST = '0.0.0.0';
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.get('/init', function (req, res) {
   let userID = req.query.userID;
   let userPW = req.query.userPW;
   let args = [userID, userPW];
   sdk.send(false, 'init', args, res);
});

app.get('/invoke', function (req, res) {
   let sender = req.query.sender;
   let receiver = req.query.receiver;
   let amount = req.query.amount;
   let args = [sender, receiver, amount,toString()];
   sdk.send(false, 'invoke', args, res);
});

app.get('/query', function (req, res) {
   let name = req.query.name;
   let args = [name];
   sdk.send(true, 'query', args, res);
});

app.get('/delete', function(req, res) {
   let name = req.query.name;
   let args = [name];
   sdk.send(false, 'delete', args, res);
})

app.use(express.static(path.join(__dirname, '../client')));
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
