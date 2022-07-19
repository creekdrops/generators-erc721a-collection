//@ts-check

const Generator = require("yeoman-generator");

module.exports = class extends Generator {
  initializing() {
    this.log("Generating an ERC-721a collection");
    this.props = {};
  }
  async prompting() {
    const props = await this.prompt([
      {
        type: "input",
        name: "projectName",
        message: "What would you like to name your project?",
        default: "my-smart-contract",
      },
      {
        type: "input",
        name: "license",
        message: "Specify license for contract.",
        default: "MIT",
      },
      {
        type: "input",
        name: "license",
        message: "Specify Solidity compiler version.",
        default: "^0.8.9",
      },
      {
        type: "input",
        name: "projectName",
        message:
          "What would you like to name your project? (ex... my-smart-contract)",
      },
      {
        type: "input",
        name: "contractName",
        message: "What would you like to name your smart contract?",
        default: "MyContract",
      },
      {
        type: "input",
        name: "tokenName",
        message: "What would you like your token name to be?",
        default: "My Token",
      },
      {
        type: "input",
        name: "tokenSymbol",
        message: "What would you like your token id to be? (ex... MYTOKEN)",
        default: "MYTOKEN",
      },
      {
        type: "input",
        name: "maxSupply",
        message: "What is the max supply?",
        default: 1000,
      },
      {
        type: "input",
        name: "maxMintAmount",
        message: "How many tokens are users allowed to mint?",
        default: 1,
      },
      {
        type: "list",
        name: "freeMint",
        message: "Will this be a free mint?",
        choices: ["yes", "no"],
        default: "no",
      },
      {
        type: "list",
        name: "pausable",
        message: "Should the contract be pausable? (recommended)",
        choices: ["yes", "no"],
        default: "yes",
      },
      {
        type: "list",
        name: "queryable",
        message: "Should tokens to be queryable? (recommended)",
        choices: ["yes", "no"],
        default: "yes",
      },
      {
        type: "list",
        name: "burnable",
        message: "Should tokens to be burnable?",
        choices: ["yes", "no"],
        default: "no",
      },
      {
        type: "list",
        name: "useWhitelist",
        message: "Would you like to have whitelisting?",
        choices: ["yes", "no"],
        default: "no",
      },
      {
        type: "list",
        name: "revealable",
        message: "Will the art be revealed post mint?",
        choices: ["yes", "no"],
        default: "no",
      },
    ]);
    this.props = { ...props };
  }
  async configuration() {
    this.log("Copying files to project...");
    this.fs.copyTpl(this.templatePath(), this.destinationPath(), {
      ...this.props,
    });
    if (this.props.useWhitelist === "no") {
      this.fs.delete(this.destinationPath("config/whitelist.json"));
    }
    this.log("Project files created");
  }
  async writing() {
    this.log("Setting up configuration files...");
    const pkgJson = {
      name: this.props.projectName,
      version: "0.1.0",
      description: "An ERC721A Collection generated with yeoman.",
      keywords: ["solidity", "blockchain", "nft"],
      scripts: {
        accounts: "hardhat accounts",
        "rename-contract": "hardhat rename-contract",
        compile: "hardhat compile --force",
        test: "hardhat test",
        "test-extended": "EXTENDED_TESTS=1 hardhat test",
        "test-coverage": "EXTENDED_TESTS=1 hardhat coverage",
        "test-gas": "REPORT_GAS=1 hardhat test",
        "local-node": "hardhat node",
        "root-hash": "hardhat generate-root-hash",
        prettier: 'prettier --write contracts/**/*.sol && prettier --write .',
        proof: "hardhat generate-proof",
        deploy: "hardhat run scripts/1_deploy.ts --network truffle",
        verify:
          "hardhat verify --constructor-args config/ContractArguments.ts --network truffle",
        "allowlist-open": "hardhat run scripts/2_allowlist_open.ts",
        "allowlist-close": "hardhat run scripts/3_allowlist_close.ts",
        "presale-open": "hardhat run scripts/4_presale_open.ts",
        "presale-close": "hardhat run scripts/5_presale_close.ts",
        "public-sale-open": "hardhat run scripts/6_public_sale_open.ts",
        "public-sale-close": "hardhat run scripts/7_public_sale_close.ts",
        reveal: "hardhat run scripts/8_reveal.ts",
      },
    };
    this.fs.writeJSON(this.destinationPath("package.json"), pkgJson);
    this.addDevDependencies({
      "@nomiclabs/hardhat-ethers": "^2.0.4",
      "@nomiclabs/hardhat-etherscan": "^3.0.3",
      "@nomiclabs/hardhat-waffle": "^2.0.1",
      "@openzeppelin/contracts": "^4.4.2",
      "@typechain/ethers-v5": "^7.2.0",
      "@typechain/hardhat": "^2.3.1",
      "@types/chai": "^4.3.0",
      "@types/chai-as-promised": "^7.1.5",
      "@types/mocha": "^9.0.0",
      "@types/node": "^12.20.41",
      "@typescript-eslint/eslint-plugin": "^4.33.0",
      "@typescript-eslint/parser": "^4.33.0",
      chai: "^4.3.4",
      "chai-as-promised": "^7.1.1",
      dotenv: "^10.0.0",
      erc721a: "^3.0.0",
      eslint: "^7.32.0",
      "eslint-config-prettier": "^8.3.0",
      "eslint-config-standard": "^16.0.3",
      "eslint-plugin-import": "^2.25.4",
      "eslint-plugin-node": "^11.1.0",
      "eslint-plugin-prettier": "^3.4.1",
      "eslint-plugin-promise": "^5.2.0",
      "ethereum-waffle": "^3.4.0",
      ethers: "^5.5.3",
      hardhat: "^2.8.2",
      "hardhat-gas-reporter": "^1.0.7",
      keccak256: "^1.0.6",
      merkletreejs: "^0.2.27",
      prettier: "^2.5.1",
      "prettier-plugin-solidity": "^1.0.0-beta.19",
      solhint: "^3.3.6",
      "solidity-coverage": "^0.7.17",
      "ts-node": "^10.4.0",
      typechain: "^5.2.0",
      typescript: "^4.5.4",
    });
    this.log("Finished creating package.json");
  }
  end() {
    this.log("Cleaning up project files...")
    this.spawnCommand("npm", ["run", "prettier"])
    this.log("Project has been created successfully!");

  }
};
