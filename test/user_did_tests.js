var Web3Latest = require("web3");
const utils = require("ethereumjs-util");
var web3 = new Web3Latest("ws://localhost:9545");

var userdidregistry = artifacts.require("./UserDIDRegistry.sol");

contract("User DID Registry", async accounts => {
  let registry;

  let did;

  let owner_public_key1;
  let owner_account1;

  let owner_public_key2;
  let owner_account2;

  let owner_public_key3;
  let owner_account3;

  let payerkey;
  let h;

  before(async () => {
    console.log("\t" + web3.version);
    registry = await userdidregistry.deployed();

    console.log("\n\towner key 1");
    // private keys should always be prefixed with '0x'
    let owner_private_key1 =
      "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
    console.log("\t\tprivate: " + owner_private_key1);
    owner_public_key1 = utils.addHexPrefix(
      utils.privateToPublic(owner_private_key1).toString("hex")
    );
    console.log("\t\tpublic: " + owner_public_key1);
    owner_account1 = web3.eth.accounts.privateKeyToAccount(owner_private_key1);
    console.log("\t\taccount: " + owner_account1.address);

    console.log("\n\towner key 2");
    // private keys should always be prefixed with '0x'
    let owner_private_key2 =
      "0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1";
    console.log("\t\tprivate: " + owner_private_key2);
    owner_public_key2 = utils.addHexPrefix(
      utils.privateToPublic(owner_private_key2).toString("hex")
    );
    console.log("\t\tpublic: " + owner_public_key2);
    owner_account2 = web3.eth.accounts.privateKeyToAccount(owner_private_key2);
    console.log("\t\taccount: " + owner_account2.address);

    console.log("\n\towner key 3");
    // private keys should always be prefixed with '0x'
    let owner_private_key3 =
      "0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c";
    console.log("\t\tprivate: " + owner_private_key3);
    owner_public_key3 = utils.addHexPrefix(
      utils.privateToPublic(owner_private_key3).toString("hex")
    );
    console.log("\t\tpublic: " + owner_public_key3);
    owner_account3 = web3.eth.accounts.privateKeyToAccount(owner_private_key3);
    console.log("\t\taccount: " + owner_account3.address);

    console.log("\n\trecovery key");
    // private keys should always be prefixed with '0x'
    let recovery_private_key =
      "0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913";
    console.log("\t\tprivate: " + recovery_private_key);
    recovery_public_key = utils.addHexPrefix(
      utils.privateToPublic(recovery_private_key).toString("hex")
    );
    console.log("\t\tpublic: " + recovery_public_key);

    recovery_account = web3.eth.accounts.privateKeyToAccount(
      recovery_private_key
    );
    console.log("\t\taccount: " + recovery_account.address);

    console.log("\n\tnew recovery key");
    // private keys should always be prefixed with '0x'
    let new_recovery_private_key =
      "0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743";
    console.log("\t\tprivate: " + new_recovery_private_key);
    new_recovery_public_key = utils.addHexPrefix(
      utils.privateToPublic(new_recovery_private_key).toString("hex")
    );
    console.log("\t\tpublic: " + new_recovery_public_key);

    new_recovery_account = web3.eth.accounts.privateKeyToAccount(
      new_recovery_private_key
    );
    console.log("\t\taccount: " + new_recovery_account.address);

    payerkey = accounts[5];

    console.log("\n\tbuild DID: (account must be lower case)");
    var id = "112341" + owner_account1.address.slice(2).toLowerCase();
    console.log("\t\tid       = " + id);
    h = await web3.utils
      .soliditySha3(id)
      .valueOf()
      .slice(2, 6);
    console.log("\t\thash(id) = " + h);

    // generate DID
    // WARNING: DID is NOT base58 encoded
    did = "did:life:" + id + h;
    console.log("\t\tdid      = " + did);
    h = await web3.utils.soliditySha3(did);
    console.log("\n\t\thash(did)= " + h);

    console.log("\n\t\tpayer    = " + payerkey);
  });

  it("Create DID operation", async () => {
    console.log("\n\tCreate DID operation"); // sign hash(did) with user's public key
    var signed_hash = await web3.eth.sign(h, owner_account1.address);
    // sign hash(did) with payer's public key
    var payer_signed_hash = await web3.eth.sign(h, payerkey);

    /*
    r: first 32 bytes
    s: second 32 bytes
    v: last byte in uint8
    var r = `0x${signed_hash.slice(2, 66)}`;
    console.log("\tr = " + r);
    var s = `0x${signed_hash.slice(66, 130)}`;
    console.log("\ts = " + s);
    var v = web3.toDecimal(signed_hash.slice(130, 132)) + 27;
    console.log("\tv = " + v);
    */

    let result = await registry.Create(
      did,
      owner_public_key1,
      signed_hash,
      recovery_public_key,
      payerkey,
      payer_signed_hash
    );

    for (var i = 0; i < result.logs.length; i++) {
      console.log(
        "\t" +
          (result.logs[i].args.msg == null
            ? "status"
            : result.logs[i].args.msg) +
          ": " +
          result.logs[i].args.output
      );
    }
  });

  it("Update DID public key operation", async () => {
    console.log("\n\tUpdate DID public key operation");
    // hash(DID + new key)
    // do not strip out '0x' from the beginning of the public key so that
    // the smart contract doesn't have to deal with stripping it as well.
    var h_new = web3.utils.soliditySha3(did, owner_public_key2);

    var signed_hash = await web3.eth.sign(h_new, owner_account1.address);
    var payer_signed_hash = await web3.eth.sign(h_new, payerkey);

    let result = await registry.Update(
      did,
      owner_public_key2,
      signed_hash,
      payerkey,
      payer_signed_hash
    );

    for (var i = 0; i < result.logs.length; i++) {
      console.log(
        "\t" +
          (result.logs[i].args.msg == null
            ? "status"
            : result.logs[i].args.msg) +
          ": " +
          result.logs[i].args.output
      );
    }
  });

  it("Change DID recovery key operation", async () => {
    console.log("\n\tChange DID recovery key operation");
    // hash(DID + new key)
    var h_newrecovery = web3.utils.soliditySha3(did, new_recovery_public_key);

    var signed_hash = await web3.eth.sign(
      h_newrecovery,
      owner_account2.address
    );
    var payer_signed_hash = await web3.eth.sign(h_newrecovery, payerkey);

    let result = await registry.ChangeRecovery(
      did,
      new_recovery_public_key,
      signed_hash,
      payerkey,
      payer_signed_hash
    );

    for (var i = 0; i < result.logs.length; i++) {
      console.log(
        "\t" +
          (result.logs[i].args.msg == null
            ? "status"
            : result.logs[i].args.msg) +
          ": " +
          result.logs[i].args.output
      );
    }
  });

  it("Recover DID ownership operation", async () => {
    console.log("\n\tRecover DID ownership operation");
    // hash(DID + new public key)
    // do not strip out '0x' from the beginning of the public key so that
    // the smart contract doesn't have to deal with stripping it as well.
    var h_newkey = web3.utils.soliditySha3(did, owner_public_key3);

    var signed_hash = await web3.eth.sign(
      h_newkey,
      new_recovery_account.address
    );
    var payer_signed_hash = await web3.eth.sign(h_newkey, payerkey);

    let result = await registry.Recover(
      did,
      owner_public_key3,
      signed_hash,
      payerkey,
      payer_signed_hash
    );

    for (var i = 0; i < result.logs.length; i++) {
      console.log(
        "\t" +
          (result.logs[i].args.msg == null
            ? "status"
            : result.logs[i].args.msg) +
          ": " +
          result.logs[i].args.output
      );
    }
  });

  it("Delete DID operation", async () => {
    console.log("\n\tDelete DID operation");
    var signed_hash = await web3.eth.sign(h, owner_account3.address);
    var payer_signed_hash = await web3.eth.sign(h, payerkey);

    let result = await registry.Delete(
      did,
      signed_hash,
      payerkey,
      payer_signed_hash
    );

    for (var i = 0; i < result.logs.length; i++) {
      console.log(
        "\t" +
          (result.logs[i].args.msg == null
            ? "status"
            : result.logs[i].args.msg) +
          ": " +
          result.logs[i].args.output
      );
    }
  });
});
