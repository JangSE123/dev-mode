const shim = require('fabric-shim');
const util = require('util');

const ABstore = class {

  async Init(stub) {
    console.info('========= ABstore Init =========');
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    try {

      let userID = "admin";
      let userPW = "admin";
      let userCash = "100000";
      let userPoint = "100000";
  
      await stub.putState(userID, Buffer.from(JSON.stringify({ userPW, userCash, userPoint })));
      return shim.success();
    } catch (err) {
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
    if (args.length != 2) {
      return shim.error('Incorrect number of arguments. Expecting 2');
    }

    let userID = args[0];
    let userPW = args[1];
    let userCash = "0";
    let userPoint = "1000";

    await stub.putState(userID, Buffer.from(JSON.stringify({ userPW, userCash, userPoint })));
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

    let Avalbytes = await stub.getState(A);
    if (!Avalbytes) {
      throw new Error('Failed to get state of asset holder A');
    }
    let Aval = JSON.parse(Avalbytes.toString());

    let Bvalbytes = await stub.getState(B);
    if (!Bvalbytes) {
      throw new Error('Failed to get state of asset holder B');
    }
    let Bval = JSON.parse(Bvalbytes.toString());

    let Adminvalbytes = await stub.getState(Admin);
    if (!Adminvalbytes) {
      throw new Error('Failed to get state of asset holder A');
    }
    let Adminval = JSON.parse(Adminvalbytes.toString());
    
    let amount = parseInt(args[2]);
    if (typeof amount !== 'number') {
      throw new Error('Expecting integer value for amount to be transaferred');
    }
    Aval.userCash = parseInt(Aval.userCash) - amount;
    Bval.userCash = parseInt(Bval.userCash) + amount - (amount / 10);
    Adminval.userCash = parseInt(Adminval.userCash) + (amount / 10);

    await stub.putState(A, Buffer.from(JSON.stringify(Aval)));
    await stub.putState(B, Buffer.from(JSON.stringify(Bval)));
    await stub.putState(Admin, Buffer.from(JSON.stringify(Adminval)));
  }

  async delete(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let userID = args[0];
    await stub.deleteState(userID);
  }
  async query(stub, args) {
    if (args.length != 1) {
        throw new Error('Incorrect number of arguments. Expecting name of the person to query');
    }

    let jsonResp = {};
    let userID = args[0];

    let userBytes = await stub.getState(userID);
    if (!userBytes || userBytes.length === 0) {
        jsonResp.error = 'Failed to get state for ' + userID;
        throw new Error(JSON.stringify(jsonResp));
    }

    jsonResp.name = userID;
    jsonResp.data = JSON.parse(userBytes.toString());
    console.info('Query Response:');
    console.info(jsonResp);
    return Buffer.from(JSON.stringify(jsonResp));
}
};

shim.start(new ABstore());
