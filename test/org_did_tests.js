const Web3Latest = require("web3");
const web3 = new Web3Latest("ws://localhost:9545");
const utils = require("ethereumjs-util");

var publickeyrevocation = artifacts.require("./DIDKeyRevocation.sol");
var userdidregistry = artifacts.require("./UserDIDRegistry.sol");
var orgdidregistry = artifacts.require("./OrgDIDRegistry.sol");

contract("Organization DID Registry", async accounts => {
  let revocation;
  let user_registry;
  let org_registry;
  let org_did;
  let trustee1_did;
  let payerkey = accounts[5];

  before(async () => {
    console.log(web3.version);
    revocation = await publickeyrevocation.deployed();
    user_registry = await userdidregistry.deployed();
    org_registry = await orgdidregistry.deployed();

    // configure address of User DID Registry smart contract
    let result = await org_registry.SetUserRegistryAddress(
      user_registry.address
    );
    for (var i = 0; i < result.logs.length; i++) {
      console.log(
        "\t" + result.logs[i].args.msg + ": " + result.logs[i].args.output
      );
    }

    // configure address of DID Public Key Revocation smart contract
    result = await org_registry.SetDidKeyRevocationAddress(revocation.address);
    for (var i = 0; i < result.logs.length; i++) {
      console.log(
        "\t" + result.logs[i].args.msg + ": " + result.logs[i].args.output
      );
    }

    console.log("\n\t\tpayer    = " + payerkey);

    console.log("\n\ttrustee 1");
    // private keys should always be prefixed with '0x'
    let trustee1_private_key =
      "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
    console.log("\t\tprivate: " + trustee1_private_key);
    trustee1_public_key = utils.addHexPrefix(
      utils.privateToPublic(trustee1_private_key).toString("hex")
    );
    console.log("\t\tpublic: " + trustee1_public_key);
    trustee1_account = web3.eth.accounts.privateKeyToAccount(
      trustee1_private_key
    );
    console.log("\t\taccount: " + trustee1_account.address);

    console.log("\n\ttrustee 2");
    // private keys should always be prefixed with '0x'
    let trustee2_private_key =
      "0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1";
    console.log("\t\tprivate: " + trustee2_private_key);
    trustee2_public_key = utils.addHexPrefix(
      utils.privateToPublic(trustee2_private_key).toString("hex")
    );
    console.log("\t\tpublic: " + trustee2_public_key);
    trustee2_account = web3.eth.accounts.privateKeyToAccount(
      trustee2_private_key
    );
    console.log("\t\taccount: " + trustee2_account.address);

    console.log("\n\ttrustee 3");
    // private keys should always be prefixed with '0x'
    let trustee3_private_key =
      "0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c";
    console.log("\t\tprivate: " + trustee3_private_key);
    trustee3_public_key = utils.addHexPrefix(
      utils.privateToPublic(trustee3_private_key).toString("hex")
    );
    console.log("\t\tpublic: " + trustee3_public_key);
    trustee3_account = web3.eth.accounts.privateKeyToAccount(
      trustee3_private_key
    );
    console.log("\t\taccount: " + trustee3_account.address);

    console.log("\n\tservice endpoint A");
    // private keys should always be prefixed with '0x'
    let service_endpointA_private_key =
      "0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913";
    console.log("\t\tprivate: " + service_endpointA_private_key);
    service_endpointA_public_key = utils.addHexPrefix(
      utils.privateToPublic(service_endpointA_private_key).toString("hex")
    );
    console.log("\t\tpublic: " + service_endpointA_public_key);
    service_endpointA_account = web3.eth.accounts.privateKeyToAccount(
      service_endpointA_private_key
    );
    console.log("\t\taccount: " + service_endpointA_account.address);

    // trustee1 DID:
    var id = "112341" + trustee1_account.address.slice(2).toLowerCase();
    var h = await web3.utils
      .soliditySha3(id)
      .valueOf()
      .slice(2, 6);
    // WARNING: DID is NOT base58 encoded
    trustee1_did = "did:life:" + id + h;
    console.log("\n\ttrustee1 DID:      " + trustee1_did);
    // hash trustee1 did
    h = await web3.utils.soliditySha3(trustee1_did);
    // sign hash of trustee1 did
    var signed_hash = await web3.eth.sign(h, trustee1_account.address);

    // sign hash(did) with payer's public key
    var payer_signed_hash = await web3.eth.sign(h, payerkey);

    // create trustee1 did on blockchain
    result = await user_registry.Create(
      trustee1_did,
      trustee1_public_key,
      signed_hash,
      trustee1_public_key,
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

    // Org DID:
    id =
      "112341" +
      "0x1df62f291b2e969fb0849d99d9ce41e2f137006e".slice(2).toLowerCase();
    h = await web3.utils
      .soliditySha3(id)
      .valueOf()
      .slice(2, 6);
    // WARNING: DID is NOT base58 encoded
    org_did = "did:life:" + id + h;
    console.log("\n\torganization DID:  " + org_did);
  });

  it("Create Operation", async () => {
    console.log("\n\tCreate DID operation:");
    var name = "lifeID";
    console.log("\tname: " + name);

    // hash(name, DID, parent_did, trustee_did)
    var h = await web3.utils.soliditySha3(name, org_did, org_did, trustee1_did);
    // signed hash
    var signed_hash = await web3.eth.sign(h, trustee1_account.address);

    let result = await org_registry.Create(
      name,
      org_did,
      org_did, // parent did
      trustee1_did,
      signed_hash
    );

    for (var i = 0; i < result.logs.length; i++) {
      console.log(
        "\t" + result.logs[i].args.msg + ": " + result.logs[i].args.output
      );
    }

    console.log("\n\tAdd data operation:");
    var data = "hash to IPFS data file";

    // hash(DID, data)
    var h = await web3.utils.soliditySha3(org_did, data);
    // signed hash
    var signed_hash = await web3.eth.sign(h, trustee1_account.address);

    result = await org_registry.AddData(
      org_did,
      data,
      trustee1_did,
      signed_hash
    );

    console.log("\tdid: " + result.logs[0].args.did);
    console.log("\tdata: " + result.logs[0].args.data);

    console.log("\n\tLookup by DID operation:");
    result = await org_registry.LookupByDID(org_did);

    console.log("\t" + result.logs[0].args.did);
    console.log("\tname: " + web3.utils.toAscii(result.logs[0].args.name));
    console.log("\tcreated: " + result.logs[0].args.created);
    console.log("\tupdated: " + result.logs[0].args.updated);
    console.log("\tdata: " + web3.utils.toAscii(result.logs[0].args.data));

    console.log("\n\tLookup by Name operation:");

    result = await org_registry.LookupByName(name);

    console.log("\t" + result.logs[0].args.did);
    console.log("\tname: " + web3.utils.toAscii(result.logs[0].args.name));
    console.log("\tcreated: " + result.logs[0].args.created);
    console.log("\tupdated: " + result.logs[0].args.updated);
    console.log("\tdata: " + web3.utils.toAscii(result.logs[0].args.data));
  });
});
