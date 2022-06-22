// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../coffeeaccesscontrol/ConsumerRole.sol";
import "../coffeeaccesscontrol/DistributorRole.sol";
import "../coffeeaccesscontrol/FarmerRole.sol";
import "../coffeeaccesscontrol/RetailerRole.sol";
import "../coffeecore/Ownable.sol";

contract SupplyChain is
ConsumerRole,
DistributorRole,
FarmerRole,
RetailerRole,
Ownable
{
    uint upc;
    uint sku;

    mapping(uint => Item) items;
    mapping(uint => string[]) itemsHistory;

    enum State {
        Harvested,
        Processed,
        Packed,
        ForSale,
        Sold,
        Shipped,
        Received,
        Purchased
    }

    State constant defaultState = State.Harvested;

    struct Item {
        uint sku;
        uint upc;
        address ownerID;
        address originFarmerID;
        string originFarmName;
        string originFarmInformation;
        string originFarmLatitude;
        string originFarmLongitude;
        uint productID;
        string productNotes;
        uint productPrice;
        State itemState;
        address distributorID;
        address retailerID;
        address consumerID;
    }

    event Harvested(uint upc);
    event Processed(uint upc);
    event Packed(uint upc);
    event ForSale(uint upc);
    event Sold(uint upc);
    event Shipped(uint upc);
    event Received(uint upc);
    event Purchased(uint upc);

    modifier verifyCaller(address _address) {
        require(msg.sender == _address);
        _;
    }

    modifier paidEnough(uint _price) {
        require(msg.value >= _price);
        _;
    }

    modifier checkValue(uint _upc) {
        _;
        uint _price = items[_upc].productPrice;
        uint amountToReturn = msg.value - _price;
        address payable payableDistributorID = payable(
            items[_upc].distributorID
        );
        payableDistributorID.transfer(amountToReturn);
    }

    modifier harvested(uint _upc) {
        require(items[_upc].itemState == State.Harvested);
        _;
    }

    modifier processed(uint _upc) {
        require(items[_upc].itemState == State.Processed);
        _;
    }

    modifier packed(uint _upc) {
        require(items[_upc].itemState == State.Packed);
        _;
    }

    modifier forSale(uint _upc) {
        require(items[_upc].itemState == State.ForSale);
        _;
    }

    modifier sold(uint _upc) {
        require(items[_upc].itemState == State.Sold);
        _;
    }

    modifier shipped(uint _upc) {
        require(items[_upc].itemState == State.Shipped);
        _;
    }

    modifier received(uint _upc) {
        require(items[_upc].itemState == State.Received);
        _;
    }

    modifier purchased(uint _upc) {
        require(items[_upc].itemState == State.Purchased);
        _;
    }

    constructor() payable {
        sku = 1;
        upc = 1;
    }

    function kill() public {
        if (msg.sender == owner()) {
            selfdestruct(payable(owner()));
        }
    }

    function harvestItem(
        uint _upc,
        address _originFarmerID,
        string memory _originFarmName,
        string memory _originFarmInformation,
        string memory _originFarmLatitude,
        string memory _originFarmLongitude,
        string memory _productNotes
    ) public onlyFarmer {
        Item memory newItem;
        newItem.sku = sku;
        newItem.upc = _upc;
        newItem.ownerID = _originFarmerID;
        newItem.originFarmerID = _originFarmerID;
        newItem.originFarmName = _originFarmName;
        newItem.originFarmInformation = _originFarmInformation;
        newItem.originFarmLatitude = _originFarmLatitude;
        newItem.originFarmLongitude = _originFarmLongitude;
        newItem.productNotes = _productNotes;
        newItem.productID = sku + _upc;
        newItem.itemState = State.Harvested;
        items[_upc] = newItem;

        sku = sku + 1;
        emit Harvested(_upc);
    }

    function processItem(uint _upc)
    public
    harvested(_upc)
    verifyCaller(items[_upc].originFarmerID)
    onlyFarmer
    {
        Item storage itemToUpdate = items[_upc];
        itemToUpdate.itemState = State.Processed;
        items[_upc] = itemToUpdate;
        emit Processed(_upc);
    }

    function packItem(uint _upc)
    public
    processed(_upc)
    verifyCaller(items[_upc].originFarmerID)
    onlyFarmer
    {
        Item storage itemToUpdate = items[_upc];
        itemToUpdate.itemState = State.Packed;
        items[_upc] = itemToUpdate;

        emit Packed(_upc);
    }

    function sellItem(uint _upc, uint _price) public
    packed(_upc)
    verifyCaller(items[_upc].originFarmerID)
    onlyFarmer
    {
        Item storage itemToUpdate = items[_upc];
        itemToUpdate.itemState = State.ForSale;
        itemToUpdate.productPrice = _price;
        items[_upc] = itemToUpdate;

        emit ForSale(_upc);
    }

    function buyItem(uint _upc)
    public
    payable
    forSale(_upc)
    paidEnough(items[_upc].productPrice)
    checkValue(_upc)
    onlyDistributor
    {
        Item storage itemToUpdate = items[_upc];
        itemToUpdate.ownerID = msg.sender;
        itemToUpdate.distributorID = msg.sender;
        itemToUpdate.itemState = State.Sold;
        items[_upc] = itemToUpdate;

        address payable payableFarmerAddress = payable(
            itemToUpdate.originFarmerID
        );
        payableFarmerAddress.transfer(itemToUpdate.productPrice);

        emit Sold(_upc);
    }

    function shipItem(uint _upc)
    public
    sold(_upc)
    verifyCaller(items[_upc].ownerID)
    onlyDistributor
    {
        Item storage itemToUpdate = items[_upc];
        itemToUpdate.itemState = State.Shipped;
        items[_upc] = itemToUpdate;

        emit Shipped(_upc);
    }

    function receiveItem(uint _upc)
    public
    shipped(_upc)
    onlyRetailer
    {
        Item storage itemToUpdate = items[_upc];
        itemToUpdate.ownerID = msg.sender;
        itemToUpdate.retailerID = msg.sender;
        itemToUpdate.itemState = State.Received;
        items[_upc] = itemToUpdate;

        emit Received(_upc);
    }

    function purchaseItem(uint _upc)
    public
    received(_upc)
    onlyConsumer
    {
        Item storage itemToUpdate = items[_upc];
        itemToUpdate.ownerID = msg.sender;
        itemToUpdate.consumerID = msg.sender;
        itemToUpdate.itemState = State.Purchased;
        items[_upc] = itemToUpdate;

        emit Purchased(_upc);
    }

    function fetchItemBufferOne(uint _upc)
    public
    view
    returns (
        uint itemSKU,
        uint itemUPC,
        address ownerID,
        address originFarmerID,
        string memory originFarmName,
        string memory originFarmInformation,
        string memory originFarmLatitude,
        string memory originFarmLongitude
    )
    {
        itemSKU = items[_upc].sku;
        itemUPC = items[_upc].upc;
        ownerID = items[_upc].ownerID;
        originFarmerID = items[_upc].originFarmerID;
        originFarmName = items[_upc].originFarmName;
        originFarmInformation = items[_upc].originFarmInformation;
        originFarmLatitude = items[_upc].originFarmLatitude;
        originFarmLongitude = items[_upc].originFarmLongitude;

        return (
        itemSKU,
        itemUPC,
        ownerID,
        originFarmerID,
        originFarmName,
        originFarmInformation,
        originFarmLatitude,
        originFarmLongitude
        );
    }

    function fetchItemBufferTwo(uint _upc)
    public
    view
    returns (
        uint itemSKU,
        uint itemUPC,
        uint productID,
        string memory productNotes,
        uint productPrice,
        uint itemState,
        address distributorID,
        address retailerID,
        address consumerID
    )
    {
        itemSKU = items[_upc].sku;
        itemUPC = items[_upc].upc;
        productID = items[_upc].productID;
        productNotes = items[_upc].productNotes;
        productPrice = items[_upc].productPrice;
        itemState = uint(items[_upc].itemState);
        distributorID = items[_upc].distributorID;
        retailerID = items[_upc].retailerID;
        consumerID = items[_upc].consumerID;

        return (
        itemSKU,
        itemUPC,
        productID,
        productNotes,
        productPrice,
        itemState,
        distributorID,
        retailerID,
        consumerID
        );
    }
}
