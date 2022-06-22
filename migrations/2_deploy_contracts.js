let Roles = artifacts.require("./Roles.sol");
let FarmerRole = artifacts.require("./FarmerRole.sol");
let DistributorRole = artifacts.require("./DistributorRole.sol");
let RetailerRole = artifacts.require("./RetailerRole.sol");
let ConsumerRole = artifacts.require("./ConsumerRole.sol");
let SupplyChain = artifacts.require("./SupplyChain.sol");
var Ownable = artifacts.require('./Ownable.sol');

module.exports = function(deployer) {
  deployer.deploy(Roles);
  deployer.deploy(FarmerRole);
  deployer.deploy(DistributorRole);
  deployer.deploy(RetailerRole);
  deployer.deploy(ConsumerRole);
  deployer.deploy(SupplyChain);
  deployer.deploy(Ownable);
};
