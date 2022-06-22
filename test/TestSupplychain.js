const SupplyChain = artifacts.require('SupplyChain')
const truffleAssert = require('truffle-assertions');

contract('SupplyChain', accounts => {
    let supplyChain;
    let sku = 1
    let upc = 666
    const ownerID = accounts[0]
    const originFarmerID = accounts[1]
    const originFarmName = "John Doe"
    const originFarmInformation = "Yarray Valley"
    const originFarmLatitude = "-38.239770"
    const originFarmLongitude = "144.341490"
    let productID = sku + upc
    const productNotes = "Best beans for Espresso"
    const productPrice = web3.utils.toWei(".01", "ether")
    const funds = web3.utils.toWei("1", "ether")
    let itemState = 0
    const distributorID = accounts[2]
    const retailerID = accounts[3]
    const consumerID = accounts[4]
    const emptyAddress = '0x00000000000000000000000000000000000000'

    console.log("ganache-cli accounts used here...")
    console.log("Contract Owner: accounts[0] ", accounts[0])
    console.log("Farmer: accounts[1] ", accounts[1])
    console.log("Distributor: accounts[2] ", accounts[2])
    console.log("Retailer: accounts[3] ", accounts[3])
    console.log("Consumer: accounts[4] ", accounts[4])

    beforeEach(async () => {
        supplyChain = await SupplyChain.deployed()
    });

    it("Test adding addresses to roles groups", async () => {
        let owner = await supplyChain.owner();
        assert.equal(owner, ownerID, 'Error: Invalid contract owner address')

        let farmerAddedEvent = await supplyChain.addFarmer(originFarmerID);
        truffleAssert.eventEmitted(farmerAddedEvent, 'FarmerAdded');

        let distributorAddedEvent = await supplyChain.addDistributor(distributorID);
        truffleAssert.eventEmitted(distributorAddedEvent, 'DistributorAdded');

        let retailerAddedEvent = await supplyChain.addRetailer(retailerID);
        truffleAssert.eventEmitted(retailerAddedEvent, 'RetailerAdded');

        let consumerAddedEvent = await supplyChain.addConsumer(consumerID);
        truffleAssert.eventEmitted(consumerAddedEvent, 'ConsumerAdded');
    })

    it("Testing smart contract function harvestItem() that allows a farmer to harvest coffee", async () => {
        const tx = await supplyChain.harvestItem(upc, originFarmerID, originFarmName, originFarmInformation, originFarmLatitude, originFarmLongitude, productNotes)
        const resultBufferOne = await supplyChain.fetchItemBufferOne.call(upc)
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc)

        assert.equal(resultBufferOne[0], sku, 'Error: Invalid item SKU')
        assert.equal(resultBufferOne[1], upc, 'Error: Invalid item UPC')
        assert.equal(resultBufferOne[2], originFarmerID, 'Error: Missing or Invalid ownerID')
        assert.equal(resultBufferOne[3], originFarmerID, 'Error: Missing or Invalid originFarmerID')
        assert.equal(resultBufferOne[4], originFarmName, 'Error: Missing or Invalid originFarmName')
        assert.equal(resultBufferOne[5], originFarmInformation, 'Error: Missing or Invalid originFarmInformation')
        assert.equal(resultBufferOne[6], originFarmLatitude, 'Error: Missing or Invalid originFarmLatitude')
        assert.equal(resultBufferOne[7], originFarmLongitude, 'Error: Missing or Invalid originFarmLongitude')
        assert.equal(resultBufferTwo[5], 0, 'Error: Invalid item State')
        truffleAssert.eventEmitted(tx, 'Harvested');
    })

    it("Testing smart contract function processItem() that allows a farmer to process coffee", async () => {
        const tx = await supplyChain.processItem(upc, {from: originFarmerID})
        const resultBufferOne = await supplyChain.fetchItemBufferOne.call(upc)
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc)

        assert.equal(resultBufferOne[1], upc, 'Error: Invalid item UPC')
        assert.equal(resultBufferOne[2], originFarmerID, 'Error: Missing or Invalid ownerID')
        assert.equal(resultBufferTwo[5], 1, 'Error: Invalid item State')
        truffleAssert.eventEmitted(tx, 'Processed');
    })

    it("Testing smart contract function packItem() that allows a farmer to pack coffee", async () => {
        const tx = await supplyChain.packItem(upc, {from: originFarmerID})
        const resultBufferOne = await supplyChain.fetchItemBufferOne.call(upc)
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc)

        assert.equal(resultBufferOne[1], upc, 'Error: Invalid item UPC')
        assert.equal(resultBufferOne[2], originFarmerID, 'Error: Missing or Invalid ownerID')
        assert.equal(resultBufferTwo[5], 2, 'Error: Invalid item State')
        truffleAssert.eventEmitted(tx, 'Packed');
    })

    it("Testing smart contract function sellItem() that allows a farmer to sell coffee", async () => {
        const tx = await supplyChain.sellItem(upc, productPrice, {from: originFarmerID})
        const resultBufferOne = await supplyChain.fetchItemBufferOne.call(upc)
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc)

        assert.equal(resultBufferOne[1], upc, 'Error: Invalid item UPC')
        assert.equal(resultBufferOne[2], originFarmerID, 'Error: Missing or Invalid ownerID')
        assert.equal(resultBufferTwo[4], productPrice, 'Error: Missing or Invalid product price')
        assert.equal(resultBufferTwo[5], 3, 'Error: Invalid item State')
        truffleAssert.eventEmitted(tx, 'ForSale');
    })

    it("Testing smart contract function buyItem() that allows a distributor to buy coffee", async () => {
        const tx = await supplyChain.buyItem(upc, {from: distributorID, value: funds })
        const resultBufferOne = await supplyChain.fetchItemBufferOne.call(upc)
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc)

        assert.equal(resultBufferOne[1], upc, 'Error: Invalid item UPC')
        assert.equal(resultBufferOne[2], distributorID, 'Error: Missing or Invalid ownerID')
        assert.equal(resultBufferOne[3], originFarmerID, 'Error: Missing or Invalid ownerID')
        assert.equal(resultBufferTwo[6], distributorID, 'Error: Missing or Invalid distributorID')
        assert.equal(resultBufferTwo[5], 4, 'Error: Invalid item State')
        truffleAssert.eventEmitted(tx, 'Sold');
    })

    it("Testing smart contract function shipItem() that allows a distributor to ship coffee", async () => {
        const tx = await supplyChain.shipItem(upc, {from: distributorID})
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc)

        assert.equal(resultBufferTwo[1], upc, 'Error: Invalid item UPC')
        assert.equal(resultBufferTwo[5], 5, 'Error: Invalid item State')
        assert.equal(resultBufferTwo[6], distributorID, 'Error: Missing or Invalid distributorID')
        truffleAssert.eventEmitted(tx, 'Shipped');
    })

    it("Testing smart contract function receiveItem() that allows a retailer to mark coffee received", async () => {
        const tx = await supplyChain.receiveItem(upc, {from: retailerID})
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc)

        assert.equal(resultBufferTwo[1], upc, 'Error: Invalid item UPC')
        assert.equal(resultBufferTwo[5], 6, 'Error: Invalid item State')
        assert.equal(resultBufferTwo[6], distributorID, 'Error: Missing or Invalid distributorID')
        assert.equal(resultBufferTwo[7], retailerID, 'Error: Missing or Invalid retailerID')
        truffleAssert.eventEmitted(tx, 'Received');
    })

    it("Testing smart contract function purchaseItem() that allows a consumer to purchase coffee", async () => {
        const tx = await supplyChain.purchaseItem(upc, {from: consumerID})
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc)

        assert.equal(resultBufferTwo[1], upc, 'Error: Invalid item UPC')
        assert.equal(resultBufferTwo[5], 7, 'Error: Invalid item State')
        assert.equal(resultBufferTwo[6], distributorID, 'Error: Missing or Invalid distributorID')
        assert.equal(resultBufferTwo[7], retailerID, 'Error: Missing or Invalid retailerID')
        assert.equal(resultBufferTwo[8], consumerID, 'Error: Missing or Invalid consumerID')
        truffleAssert.eventEmitted(tx, 'Purchased');
    })

    it("Testing smart contract function fetchItemBufferOne() that allows anyone to fetch item details from blockchain", async () => {
        const resultBufferOne = await supplyChain.fetchItemBufferOne.call(upc)

        assert.equal(resultBufferOne[0], sku, 'Error: Invalid item SKU')
        assert.equal(resultBufferOne[1], upc, 'Error: Invalid item UPC')
        assert.equal(resultBufferOne[2], consumerID, 'Error: Missing or Invalid ownerID')
        assert.equal(resultBufferOne[3], originFarmerID, 'Error: Missing or Invalid originFarmerID')
        assert.equal(resultBufferOne[4], originFarmName, 'Error: Missing or Invalid originFarmName')
        assert.equal(resultBufferOne[5], originFarmInformation, 'Error: Missing or Invalid originFarmInformation')
        assert.equal(resultBufferOne[6], originFarmLatitude, 'Error: Missing or Invalid originFarmLatitude')
        assert.equal(resultBufferOne[7], originFarmLongitude, 'Error: Missing or Invalid originFarmLongitude')
    })

    it("Testing smart contract function fetchItemBufferTwo() that allows anyone to fetch item details from blockchain", async () => {
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc)

        assert.equal(resultBufferTwo[0], sku, "Error: Invalid SKU")
        assert.equal(resultBufferTwo[1], upc, "Error: Invalid UPC")
        assert.equal(resultBufferTwo[2], productID, "Error: Invalid productID")
        assert.equal(resultBufferTwo[3], productNotes, "Error: Invalid productNotes")
        assert.equal(resultBufferTwo[4], productPrice, "Error: Invalid productPrice")
        assert.equal(resultBufferTwo[5], 7, "Error: Invalid itemState")
        assert.equal(resultBufferTwo[6], distributorID, "Error: Invalid distributorID")
        assert.equal(resultBufferTwo[7], retailerID, "Error: Invalid retailerID")
        assert.equal(resultBufferTwo[8], consumerID, "Error: Invalid consumerID")
    })

});

