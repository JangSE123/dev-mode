const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
let path = require('path');
let sdk = require('./sdk');

const PORT = 8001;
const HOST = '0.0.0.0';
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
   secret: 'admin', // 원하는 비밀키로 변경하세요.
   resave: false,
   saveUninitialized: true,
   cookie: { secure: false } // HTTPS를 사용하는 경우 true로 설정하세요.
}));

// 음악 리스트를 저장할 변수
let musicList = [
   { title: 'Song 1', seller: 'admin', description: 'TEST SONG 1', price: 15000 },
   { title: 'Song 2', seller: 'admin', description: 'TEST SONG 2', price: 20000 },
   // 초기 음악 리스트 데이터
];

app.get('/init', function (req, res) {
   let user = req.query.user;
   let cash = 0;
   let point = 0;
   let args = [user, cash, point];
   sdk.send(false, 'init', args, res);
});

// app.get('/recharge', function (req, res) {
//    let user = req.query.user;
//    let rechargeAmount = req.query.amount;

//    if (!user || !rechargeAmount) {
//       res.status(400).send('User and recharge amount are required');
//       return;
//    }

//    let args = [user, rechargeAmount];
//    sdk.send(false, 'recharge', args, res);
// });

app.post('/recharge', function (req, res) {
   let user = req.body.user;
   let rechargeAmount = req.body.amount;

   if (!user || !rechargeAmount) {
      res.status(400).send('User and recharge amount are required');
      return;
   }

   let args = [user, rechargeAmount];
   sdk.send(false, 'recharge', args, res);
});

app.post('/refund', function (req, res) {
   let user = req.body.user;
   let refundAmount = req.body.amount;

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

app.get('/transfer', function (req, res) {
   let sender = req.query.sender;
   let receiver = req.query.receiver;
   let amount = req.query.amount;
   let args = [sender, receiver, amount];
   sdk.send(false, 'transfer', args, res);
});

app.get('/musicregister', function (req, res) {
   let seller = req.query.seller;
   let music = req.query.music;
   let price = req.query.price;
   let args = [seller, music, price];
   sdk.send(false, 'musicRegister', args, res);
});

app.get('/musiclist', async function (req, res) {
      res.json(musicList);
});

// 음악 등록 엔드포인트
app.post('/musiclist', function (req, res) {
   const { title, seller, description, price } = req.body;

   if (!title || !seller || !description || !price) {
      res.status(400).send('All fields are required');
      return;
   }

   const newMusic = { title, seller, description, price };
   musicList.push(newMusic);
   res.status(201).send('Music registered successfully');
});

app.get('/buymusic', function (req, res) {
   let buyer = req.query.buyer;
   let seller = req.query.seller;
   let sellerItem = req.query.musicName;
   let args = [buyer, seller, sellerItem];
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
      

      // 세션에 저장
      req.session.wallet = {
         walletID: name.toString(),
         cash: cashResult.toString(),
         point: pointResult.toString(),
         items: JSON.parse(itemsResult.toString())
      };

      res.json(req.session.wallet);
   } catch (error) {
      res.status(500).send(error.toString());
   }
});

// 세션 데이터를 제공하는 엔드포인트
app.get('/session', function (req, res) {
   if (!req.session.wallet) {
       res.status(404).send('No session data found');
   } else {
       res.json(req.session.wallet);
   }
});


app.use(express.static(path.join(__dirname, '../client')));
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
