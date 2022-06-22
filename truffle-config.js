module.exports = {

  networks: {
    // development: {
    //  host: "127.0.0.1",
    //  port: 8545,
    //  network_id: "*",
    // },

    develop: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
  },

  mocha: {
    timeout: 100000
  },

  compilers: {
    solc: {
      version: "0.8.0",
      // docker: true,
      // settings: {
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    }
  }
}
