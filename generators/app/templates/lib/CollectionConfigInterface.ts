import NetworkConfigInterface from "./NetworkConfigInterface";
import MarketplaceConfigInterface from "./MarketplaceConfigInterface";

interface MintConfig {
  maxMintAmount: number;
<% if(freeMint==="no"){ -%>
  cost: number;
<% } -%>
}

export default interface CollectionConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  tokenName: string;
  tokenSymbol: string;
<% if(revealable==="yes"){ -%>
  hiddenMetadataUri: string;
<% } -%>
  maxSupply: number;
<% if(useWhitelist==="yes"){ -%>
  whitelistMint: MintConfig;
<% } -%>
  publicMint: MintConfig;
  contractAddress: string | null;
  marketplaceIdentifier: string;
  marketplaceConfig: MarketplaceConfigInterface;
  <% if(useWhitelist==="yes"){ -%>
  whitelistAddresses: string[];
  <% } -%>
}
