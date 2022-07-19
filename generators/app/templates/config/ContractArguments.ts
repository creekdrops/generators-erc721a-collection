import CollectionConfig from './CollectionConfig';

// Update the following array if you change the constructor arguments...
const ContractArguments = [
  CollectionConfig.tokenName,
  CollectionConfig.tokenSymbol,
<% if(freeMint==="no" && useWhitelist === "yes"){ -%>
  CollectionConfig.whitelistMint.cost,
<% } -%>
<% if(freeMint==="no" && useWhitelist === "no"){ -%>
  CollectionConfig.publicMint.cost,
<% } -%>
  CollectionConfig.publicMint.maxMintAmount,
<% if(revealable==="yes"){ -%>
  CollectionConfig.hiddenMetadataUri,
<% } -%>
  CollectionConfig.maxSupply,
] as const;

export default ContractArguments;
