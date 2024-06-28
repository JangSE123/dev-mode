/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

const shim = require('fabric-shim');
const util = require('util');

const ABstore = class {

  // Initialize the chaincode
  async Init(stub) {
    console.info('========= ABstore Init =========');
    let ret = stub.getFunctionAndParameters();
    let defaultItems = [
      { name: "song1", price: 1500 },
      { name: "song2", price: 1000 }
  ];
    let items = JSON.stringify(defaultItems);
    console.info(ret);
    try {
      await stub.putState("admin_cash", Buffer.from("100000000"));
      await stub.putState("admin_point", Buffer.from("100000000"));
      await stub.putState("admin_items", Buffer.from(items))
      return shim.success();
    } catch (err) {
      return shim.error(err);
    }
  }

  async recharge(stub, args) {
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }
  
    let user = args[0];
    let rechargeAmount = parseInt(args[1]);
  
    if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
      throw new Error('Invalid recharge amount. Must be a positive integer');
    }
  
    let userCashBytes = await stub.getState(user + "_cash");
    if (!userCashBytes || userCashBytes.length === 0) {
      throw new Error('Failed to get state of user cash');
    }
  
    let userCash = parseInt(userCashBytes.toString());
    userCash += rechargeAmount;
  
    await stub.putState(user + "_cash", Buffer.from(userCash.toString()));
  
    return Buffer.from('Recharge successful');
  }

  async refund(stub, args) {
    if (args.length != 2) {
        throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let user = args[0];
    let refundAmount = parseInt(args[1]);

    if (isNaN(refundAmount) || refundAmount <= 0) {
        throw new Error('Invalid refund amount. Must be a positive integer');
    }

    let userCashBytes = await stub.getState(user + "_cash");
    if (!userCashBytes || userCashBytes.length === 0) {
        throw new Error('Failed to get state of user cash');
    }

    let userCash = parseInt(userCashBytes.toString());

    if (refundAmount > userCash) {
        throw new Error('Refund amount exceeds user cash balance');
    }

    userCash -= refundAmount;

    await stub.putState(user + "_cash", Buffer.from(userCash.toString()));

    return Buffer.from('Refund successful');
  }

  async Payment(stub) {
    console.log("========= Add Cash =========");
    console.info(ret);
    let method = this[ret.fcn];
    if (!method) {
      console.log('no method of name:' + ret.fcn + ' found');
      return shim.success();
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    let method = this[ret.fcn];
    if (!method) {
      console.log('no method of name:' + ret.fcn + ' found');
      return shim.success();
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async init(stub, args) {
    // initialise only if 2 parameters passed.
    if (args.length != 3) {
      return shim.error('Incorrect number of arguments. Expecting 3');
    }

    let user = args[0];
    let user_cash = "0";
    let user_point = "1000";

    if (typeof parseInt(user_cash) !== 'number' || typeof parseInt(user_point) !== 'number') {
      return shim.error('Expecting integer value for asset holding');
    }

    let user_items = JSON.stringify([]);

    await stub.putState(user + "_cash", Buffer.from(user_cash));
    await stub.putState(user + "_point", Buffer.from(user_point));
    await stub.putState(user + "_items", Buffer.from(user_items));
  }

  async payment(stub, args) {
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }

    let buyer = args[0];
    let seller = args[1];
    let amount = parseInt(args[2]);
    let adminCash = 'admin_cash';
    let adminPoint = 'admin_point';

    if (!buyer || !seller || isNaN(amount)) {
      throw new Error('Invalid arguments. Expecting buyer, seller, and amount');
    } 

    let buyerCashBytes = await stub.getState(buyer + "_cash");
    let buyerPointBytes = await stub.getState(buyer + "_point");
    if (!buyerCashBytes || buyerCashBytes.length === 0 || !buyerPointBytes || buyerPointBytes.length === 0) {
      throw new Error('Failed to get state of buyer');
    }

    let buyerCash = parseInt(buyerCashBytes.toString());
    let buyerPoint = parseInt(buyerPointBytes.toString());

    let sellerCashBytes = await stub.getState(seller + "_cash");
    let sellerPointBytes = await stub.getState(seller + "_point");
    if (!sellerCashBytes || sellerCashBytes.length === 0 || !sellerPointBytes || sellerPointBytes.length === 0) {
      throw new Error('Failed to get state of seller');
    }

    let sellerCash = parseInt(sellerCashBytes.toString());
    let sellerPoint = parseInt(sellerPointBytes.toString());

    let adminCashBytes = await stub.getState(adminCash);
    let adminPointBytes = await stub.getState(adminPoint);
    if (!adminCashBytes || adminCashBytes.length === 0 || !adminPointBytes || adminPointBytes.length === 0) {
      throw new Error('Failed to get state of admin');
    }
    let adminCashVal = parseInt(adminCashBytes.toString());
    let adminPointVal = parseInt(adminPointBytes.toString());

    // Purchase using points first, then cash if necessary
    let remainAmount = amount;

    if (buyerPoint >= remainAmount) {
      buyerPoint -= remainAmount;
      remainAmount = 0;
    } else {
      remainAmount -= buyerPoint;
      buyerPoint = 0;
    }

    // Remaining amount is paid in cash, and 5% of cash payment is added as points
    let promotionPoint = 0;
    if (remainAmount > 0) {
      if (buyerCash >= remainAmount) {
        buyerCash -= remainAmount;
        adminCashVal += remainAmount;

        promotionPoint = Math.floor(remainAmount * 0.05);
        buyerPoint += promotionPoint;
        remainAmount = 0;
      } else {
        throw new Error(buyer + ' does not have enough cash');
      }
    }

    // Deduct tax from amount and transfer the remaining to the seller
    let tax = Math.floor(amount * 0.1);
    let totalPrice = amount - tax;

    adminCashVal -= totalPrice;
    sellerCash += totalPrice;

    console.info(util.format('Buyer Cash = %d, Buyer Points = %d, Seller Cash = %d, Seller Points = %d, Admin Cash = %d, Admin Points = %d', buyerCash, buyerPoint, sellerCash, sellerPoint, adminCashVal, adminPointVal));

    await stub.putState(buyer + "_cash", Buffer.from(buyerCash.toString()));
    await stub.putState(buyer + "_point", Buffer.from(buyerPoint.toString()));
    await stub.putState(seller + "_cash", Buffer.from(sellerCash.toString()));
    await stub.putState(seller + "_point", Buffer.from(sellerPoint.toString()));
    await stub.putState(adminCash, Buffer.from(adminCashVal.toString()));
    await stub.putState(adminPoint, Buffer.from(adminPointVal.toString()));

    return Buffer.from('Transaction successful');
  }


  async musicRegister(stub, args) {
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }
    let seller = args[0];
    let musicName = args[1];
    let price = parseInt(args[2]);
    let adminPoint = "admin_point";
    let adminCash = "admin_cash";

    if (!seller) {
      throw new Error('seller must not be empty');
    }

    let sellerPointBytes = await stub.getState(seller + "_point");
    if (!sellerPointBytes || sellerPointBytes.length === 0) {
      throw new Error('Failed to get state of seller points');
    }
    let sellerPoint = parseInt(sellerPointBytes.toString());

    let sellerCashBytes = await stub.getState(seller + "_cash");
    if (!sellerCashBytes || sellerCashBytes.length === 0) {
      throw new Error('Failed to get state of seller cash');
    }
    let sellerCash = parseInt(sellerCashBytes.toString());

    let adminPointBytes = await stub.getState(adminPoint);
    if (!adminPointBytes || adminPointBytes.length === 0) {
      throw new Error('Failed to get state of admin points');
    }
    let adminPointVal = parseInt(adminPointBytes.toString());

    let adminCashBytes = await stub.getState(adminCash);
    if (!adminCashBytes || adminCashBytes.length === 0) {
      throw new Error('Failed to get state of admin cash');
    }
    let adminCashVal = parseInt(adminCashBytes.toString());

    
    if (isNaN(price)) {
      throw new Error('Expecting integer value for price');
    }

    // Ensure seller has enough value to deduct the fee
    let fee = price * 0.02;
    if (sellerPoint + sellerCash < fee) {
      throw new Error('seller does not have enough value to pay the fee');
    }

    // Deduct fee from POINT first, then from CASH if necessary
    if (sellerPoint >= fee) {
      sellerPoint -= fee;
      adminPointVal += fee;
    } else {
      let remainingFee = fee - sellerPoint;
      sellerPoint = 0;
      sellerCash -= remainingFee;
      adminCashVal += remainingFee;
    }

    // Seller's items 확인
    let sellerItemsBytes = await stub.getState(seller + "_items");
    let sellerItems = [];
    if (sellerItemsBytes && sellerItemsBytes.length > 0) {
        sellerItems = JSON.parse(sellerItemsBytes.toString());
    }

    // 음악과 가격을 객체 형태로 추가
    sellerItems.push({name: musicName, price: price});


    console.info(util.format('sellerPoint = %d, sellerCash = %d, adminPointVal = %d, adminCashVal = %d\n', sellerPoint, sellerCash, adminPointVal, adminCashVal));

    // Write the updated states back to the ledger
    await stub.putState(seller + "_point", Buffer.from(sellerPoint.toString()));
    await stub.putState(seller + "_cash", Buffer.from(sellerCash.toString()));
    await stub.putState(adminPoint, Buffer.from(adminPointVal.toString()));
    await stub.putState(adminCash, Buffer.from(adminCashVal.toString()));

    // Save the music information to the ledger
    await stub.putState(musicName, Buffer.from(JSON.stringify({ seller: seller, price: price })));
  }

  async buyMusic(stub, args) {
    if (args.length != 4) {
        throw new Error('Incorrect number of arguments. Expecting 4');
    }

    let buyer = args[0];
    let seller = args[1];
    let musicName = args[2];
    let price = parseInt(args[3]);
    let adminCash = 'admin_cash';
    let adminPoint = 'admin_point';

    if (!musicName) {
        throw new Error('Invalid arguments. Expecting musicName');
    }

    if (!buyer || !seller || isNaN(price)) {
        throw new Error('Invalid arguments. Expecting buyer, seller, and price');
    }

    console.info(`Attempting to buy music: ${musicName} from seller: ${seller} to buyer: ${buyer} for price: ${price}`);

    // Seller's items 확인
    let sellerItemsBytes = await stub.getState(seller + "_items");
    if (!sellerItemsBytes || sellerItemsBytes.length === 0) {
        throw new Error('Failed to get state of seller items');
    }

    let sellerItems = JSON.parse(sellerItemsBytes.toString());
    if (!sellerItems.includes(musicName)) {
        throw new Error('Seller does not own the specified music');
    }

    console.info(`Seller items before transaction: ${JSON.stringify(sellerItems)}`);

    // Buyer's items 확인
    let buyerItemsBytes = await stub.getState(buyer + "_items");
    if (!buyerItemsBytes || buyerItemsBytes.length === 0) {
        throw new Error('Failed to get state of buyer items');
    }

    let buyerItems = JSON.parse(buyerItemsBytes.toString());
    console.info(`Buyer items before transaction: ${JSON.stringify(buyerItems)}`);

    let buyerCashBytes = await stub.getState(buyer + "_cash");
    let buyerPointBytes = await stub.getState(buyer + "_point");
    if (!buyerCashBytes || buyerCashBytes.length === 0 || !buyerPointBytes || buyerPointBytes.length === 0) {
        throw new Error('Failed to get state of buyer');
    }

    let buyerCash = parseInt(buyerCashBytes.toString());
    let buyerPoint = parseInt(buyerPointBytes.toString());

    let sellerCashBytes = await stub.getState(seller + "_cash");
    let sellerPointBytes = await stub.getState(seller + "_point");
    if (!sellerCashBytes || sellerCashBytes.length === 0 || !sellerPointBytes || sellerPointBytes.length === 0) {
        throw new Error('Failed to get state of seller');
    }

    let sellerCash = parseInt(sellerCashBytes.toString());
    let sellerPoint = parseInt(sellerPointBytes.toString());

    let adminCashBytes = await stub.getState(adminCash);
    let adminPointBytes = await stub.getState(adminPoint);
    if (!adminCashBytes || adminCashBytes.length === 0 || !adminPointBytes || adminPointBytes.length === 0) {
        throw new Error('Failed to get state of admin');
    }
    let adminCashVal = parseInt(adminCashBytes.toString());
    let adminPointVal = parseInt(adminPointBytes.toString());

    // Purchase using points first, then cash if necessary
    let remainPrice = price;

    if (buyerPoint >= remainPrice) {
        buyerPoint -= remainPrice;
        remainPrice = 0;
    } else {
        remainPrice -= buyerPoint;
        buyerPoint = 0;
    }

    // Remaining amount is paid in cash, and 5% of cash payment is added as points
    let promotionPoint = 0;
    if (remainPrice > 0) {
        if (buyerCash >= remainPrice) {
            buyerCash -= remainPrice;
            adminCashVal += remainPrice;

            promotionPoint = Math.floor(remainPrice * 0.05);
            buyerPoint += promotionPoint;
            remainPrice = 0;
        } else {
            throw new Error(buyer + ' does not have enough cash');
        }
    }

    // Deduct tax from amount and transfer the remaining to the seller
    let tax = Math.floor(price * 0.1);
    let totalPrice = price - tax;

    adminCashVal += tax;
    sellerCash += totalPrice;

    // Update seller's items
    sellerItems = sellerItems.filter(item => item !== musicName);
    await stub.putState(seller + "_items", Buffer.from(JSON.stringify(sellerItems)));

    // Update buyer's items
    buyerItems.push(musicName);
    await stub.putState(buyer + "_items", Buffer.from(JSON.stringify(buyerItems)));

    console.info(util.format('Buyer Cash = %d, Buyer Points = %d, Seller Cash = %d, Seller Points = %d, Admin Cash = %d, Admin Points = %d', buyerCash, buyerPoint, sellerCash, sellerPoint, adminCashVal, adminPointVal));
    console.info(`Seller items after transaction: ${JSON.stringify(sellerItems)}`);
    console.info(`Buyer items after transaction: ${JSON.stringify(buyerItems)}`);

    await stub.putState(buyer + "_cash", Buffer.from(buyerCash.toString()));
    await stub.putState(buyer + "_point", Buffer.from(buyerPoint.toString()));
    await stub.putState(seller + "_cash", Buffer.from(sellerCash.toString()));
    await stub.putState(seller + "_point", Buffer.from(sellerPoint.toString()));
    await stub.putState(adminCash, Buffer.from(adminCashVal.toString()));
    await stub.putState(adminPoint, Buffer.from(adminPointVal.toString()));

    return Buffer.from('Transaction successful');
}



  async invoke(stub, args) {
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }

    let A = args[0];
    let B = args[1];
    let Admin = "admin";
    if (!A || !B) {
      throw new Error('asset holding must not be empty');
    }

    // Get the state from the ledger
    let Avalbytes = await stub.getState(A);
    if (!Avalbytes) {
      throw new Error('Failed to get state of asset holder A');
    }
    let Aval = parseInt(Avalbytes.toString());

    let Bvalbytes = await stub.getState(B);
    if (!Bvalbytes) {
      throw new Error('Failed to get state of asset holder B');
    }
    let Bval = parseInt(Bvalbytes.toString());

    let Adminvalbytes = await stub.getState(Admin);
    if (!Adminvalbytes) {
      throw new Error('Failed to get state of asset holder A');
    }
    let Adminval = parseInt(Adminvalbytes.toString());
    // Perform the execution
    let amount = parseInt(args[2]);
    if (typeof amount !== 'number') {
      throw new Error('Expecting integer value for amount to be transaferred');
    }
    Aval = Aval - amount;
    Bval = Bval + amount - (amount / 10);
    Adminval = Adminval + (amount / 10);
    console.info(util.format('Aval = %d, Bval = %d, Adminval = %d\n', Aval, Bval, Adminval));

    // Write the states back to the ledger
    await stub.putState(A, Buffer.from(Aval.toString()));
    await stub.putState(B, Buffer.from(Bval.toString()));
    await stub.putState(Admin, Buffer.from(Adminval.toString()));
  }

  // Deletes an entity from state
  async delete(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let A = args[0];

    // Delete the key from the state in ledger
    await stub.deleteState(A);
  }

  // query callback representing the query of a chaincode
  async query(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting name of the person to query')
    }

    let jsonResp = {};
    let A = args[0];

    // Get the state from the ledger
    let Avalbytes = await stub.getState(A);
    if (!Avalbytes) {
      jsonResp.error = 'Failed to get state for ' + A;
      throw new Error(JSON.stringify(jsonResp));
    }

    jsonResp.name = A;
    jsonResp.amount = Avalbytes.toString();
    console.info('Query Response:');
    console.info(jsonResp);
    return Avalbytes;
  }
};

shim.start(new ABstore());
