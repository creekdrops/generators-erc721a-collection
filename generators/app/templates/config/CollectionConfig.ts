import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketplaces from "../lib/Marketplaces";
<% if(useWhitelist==="yes"){ -%>
import whitelistAddresses from "./whitelist.json";
<% } -%>

const CollectionConfig: CollectionConfigInterface = {
  testnet: Networks.ethereumTestnet,
  mainnet: Networks.ethereumMainnet,
  // The contract name can be updated using the following command:
  // yarn rename-contract NEW_CONTRACT_NAME
  // Please DO NOT change it manually!
  contractName: "<%=contractName%>",
  tokenName: "<%=tokenName%>",
  tokenSymbol: "<%=tokenSymbol%>",
<% if(revealable==="yes"){ -%>
  // Update with hidden metadata URI
  hiddenMetadataUri:"ipfs://___CID___/hidden.json",
<% } -%>
  maxSupply: <%=maxSupply%>,
<% if(useWhitelist==="yes"){ -%>
  whitelistMint: {
    maxMintAmount: <%=maxMintAmount%>,
<% if(freeMint==="no"){ -%>
    cost: 1,
<% } -%>
  },
<% } -%>
  publicMint: {
    maxMintAmount: <%=maxMintAmount%>,
<% if(freeMint==="no"){ -%>
    cost: 1,
<% } -%>
  },
  contractAddress: "", /// Update after deloyment for verification
  marketplaceIdentifier: "<%=projectName%>",
  marketplaceConfig: Marketplaces.openSea,
<% if(useWhitelist==="yes"){ -%>
  whitelistAddresses
<% } -%>
};

export default CollectionConfig;
