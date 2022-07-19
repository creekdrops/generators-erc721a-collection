// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

<% if(queryable==="yes"){ -%>
import "erc721a/contracts/extensions/ERC721AQueryable.sol";
<% } else { -%>
import "erc721a/contracts/ERC721A.sol";
<% } -%>
<% if(burnable==="yes"){ -%>
import "erc721a/contracts/extensions/ERC721ABurnable.sol";
<% } -%>
import "@openzeppelin/contracts/access/Ownable.sol";
<% if(useWhitelist==="yes"){ -%>
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
<% } -%>
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
<% if(pausable==="yes"){ -%>
import "@openzeppelin/contracts/security/Pausable.sol";
<% } -%>

contract <%=contractName%> is
<% if(queryable==="no"){ -%>
  ERC721A,
<% } -%>
<% if(queryable==="yes"){ -%>
  ERC721AQueryable,
<% } -%>
<% if(burnable==="yes"){ -%>
  ERC721ABurnable,
<% } -%>
  Ownable,
<% if(pausable==="yes"){ -%>
  Pausable,
<% } -%>
  ReentrancyGuard {
    using Strings for uint256;
<% if(useWhitelist==="yes"){ -%>
    bytes32 public merkleRoot;
    mapping(address => bool) public whitelistClaimed;
<% } -%>
    string public uriPrefix = "";
    string public uriSuffix = ".json";
<% if(revealable==="yes"){ -%>
    string public hiddenMetadataUri;
<% } -%>
<% if(freeMint==="no"){ -%>
    uint256 public cost;
<% }-%>
    uint256 public maxSupply;
    uint256 public maxMintAmountPerTx;

<% if(useWhitelist==="yes"){ -%>
    bool public whitelistMintEnabled = false;
<% } -%>
<% if(revealable==="yes"){ -%>
    bool public revealed = false;
<% } -%>
    constructor(
        string memory _tokenName,
        string memory _tokenSymbol,
<% if(freeMint==="no"){ -%>
        uint256 _cost,
<% } -%>
        uint256 _maxSupply,
<% if(revealable==="yes"){ -%>
        string memory _hiddenMetadataUri,
<% } -%>
        uint256 _maxMintAmountPerTx
    ) ERC721A(_tokenName, _tokenSymbol) {
<% if(freeMint==="no"){ -%>
        setCost(_cost);
<% } -%>
        maxSupply = _maxSupply;
        setMaxMintAmountPerTx(_maxMintAmountPerTx);
<% if(revealable==="yes"){ -%>
        setHiddenMetadataUri(_hiddenMetadataUri);
<% } -%>
<% if(pausable==="yes"){ -%>
        _pause(); /// Pause contract on deploy
<% } -%>
    }

    modifier mintCompliance(uint256 _mintAmount) {
        require(
            _mintAmount > 0 && _mintAmount <= maxMintAmountPerTx,
            "Invalid mint amount!"
        );
        require(
            totalSupply() + _mintAmount <= maxSupply,
            "Max supply exceeded!"
        );
        _;
    }

<% if(freeMint==="no"){ -%>
    modifier mintPriceCompliance(uint256 _mintAmount) {
      require(msg.value >= cost * _mintAmount, "Insufficient funds!");
      _;
    }
<% } -%>

<% if(useWhitelist==="yes"){ -%>
    function whitelistMint(uint256 _mintAmount, bytes32[] calldata _merkleProof)
        public
<% if(pausable==="yes"){ -%>
        whenNotPaused
<% } -%>
<% if(freeMint==="no"){ -%>
        payable
<% } -%>
        mintCompliance(_mintAmount)
        mintPriceCompliance(_mintAmount)
    {
        // Verify whitelist requirements
        require(whitelistMintEnabled, "The whitelist sale is not enabled!");
        require(!whitelistClaimed[_msgSender()], "Address already claimed!");
        bytes32 leaf = keccak256(abi.encodePacked(_msgSender()));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid proof!"
        );

        whitelistClaimed[_msgSender()] = true;
        _safeMint(_msgSender(), _mintAmount);
    }
<% } %>
    function mint(uint256 _mintAmount)
        public
<% if(pausable==="yes"){ -%>
        whenNotPaused
<% } -%>
<% if(freeMint==="no"){ -%>
        payable
<% } -%>
        mintCompliance(_mintAmount)
<% if(freeMint==="no"){ -%>
        mintPriceCompliance(_mintAmount)
<% } -%>
    {
        _safeMint(_msgSender(), _mintAmount);
    }

    function mintForAddress(uint256 _mintAmount, address _receiver)
        public
        mintCompliance(_mintAmount)
        onlyOwner
    {
        _safeMint(_receiver, _mintAmount);
    }

    /// @dev If you would like to have a zero mint, you can remove
    /// this function.
    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
<% if(revealable==="yes"){ -%>
        if (revealed == false) {
            return hiddenMetadataUri;
        }
<% } -%>

        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        _tokenId.toString(),
                        uriSuffix
                    )
                )
                : "";
    }

<% if(revealable==="yes"){ -%>
    function setRevealed(bool _state) public onlyOwner {
        revealed = _state;
    }
<% } -%>

<% if(freeMint==="no"){ -%>
    function setCost(uint256 _cost) public onlyOwner {
        cost = _cost;
    }
<% } -%>
    function setMaxMintAmountPerTx(uint256 _maxMintAmountPerTx)
        public
        onlyOwner
    {
        maxMintAmountPerTx = _maxMintAmountPerTx;
    }

<% if(revealable==="yes"){ -%>
    function setHiddenMetadataUri(string memory _hiddenMetadataUri)
        public
        onlyOwner
    {
        hiddenMetadataUri = _hiddenMetadataUri;
    }
<% } -%>

    function setUriPrefix(string memory _uriPrefix) public onlyOwner {
        uriPrefix = _uriPrefix;
    }

    function setUriSuffix(string memory _uriSuffix) public onlyOwner {
        uriSuffix = _uriSuffix;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

<% if(useWhitelist==="yes"){ -%>
    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function setWhitelistMintEnabled(bool _state) public onlyOwner {
        whitelistMintEnabled = _state;
    }
<% } -%>

    function _baseURI() internal view virtual override returns (string memory) {
        return uriPrefix;
    }

    /// @dev DO NOT REMOVE THIS OR FUNDS WILL BE LOCKED IN CONTRACT
    function withdraw() public onlyOwner nonReentrant {
        (bool os, ) = payable(owner()).call{value: address(this).balance}("");
        require(os);
    }
}
