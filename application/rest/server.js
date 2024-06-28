const express = require('express');
const app = express();
let path = require('path');
let sdk = require('./sdk');

const PORT = 8001;
const HOST = '0.0.0.0';
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/init', function (req, res) {
   let user = req.query.user;
   let cash = 0;
   let point = 0;
   let args = [user, cash, point];
   sdk.send(false, 'init', args, res);
});

app.get('/recharge', function (req, res) {
   let user = req.query.user;
   let rechargeAmount = req.query.amount;

   if (!user || !rechargeAmount) {
      res.status(400).send('User and recharge amount are required');
      return;
   }

   let args = [user, rechargeAmount];
   sdk.send(false, 'recharge', args, res);
});

app.get('/refund', function (req, res) {
   let user = req.query.user;
   let refundAmount = req.query.amount;

   if (!user || !refundAmount) {
      res.status(400).send('User and recharge amount are required');
      return;
   }

   let args = [user, refundAmount];
   sdk.send(false, 'refund', args, res);
});


app.get('/invoke', function (req, res) {
   let sender = req.query.sender;
   let receiver = req.query.receiver;
   let amount = req.query.amount;
   let args = [sender, receiver, amount];
   sdk.send(false, 'invoke', args, res);
});

app.get('/payment', function (req, res) {
   let buyer = req.query.buyer;
   let seller = req.query.seller;
   let amount = req.query.amount;
   let args = [buyer, seller, amount];
   sdk.send(false, 'payment', args, res);
});

app.get('/musicregister', function (req, res) {
   let seller = req.query.seller;
   let music = req.query.music;
   let price = req.query.price;
   let args = [seller, music, price];
   sdk.send(false, 'musicRegister', args, res);
});

app.get('/buymusic', function (req, res) {
   let buyer = req.query.buyer;
   let seller = req.query.seller;
   let sellerItem = req.query.musicName;
   let price = req.query.price;
   let args = [buyer, seller, sellerItem, price];
   sdk.send(false, 'buyMusic', args, res);
});

app.get('/query', async function (req, res) {
   try {
      let name = req.query.name;
      let cashArgs = [name + '_cash'];
      let pointArgs = [name + '_point'];
      let itemsArgs = [name + '_items'];

      let cashResult = await sdk.query('query', cashArgs);
      let pointResult = await sdk.query('query', pointArgs);
      let itemsResult = await sdk.query('query', itemsArgs);

      res.json({
         cash: cashResult.toString(),
         point: pointResult.toString(),
         items: JSON.parse(itemsResult.toString())
      });
   } catch (error) {
      res.status(500).send(error.toString());
   }
});


app.use(express.static(path.join(__dirname, '../client')));
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
