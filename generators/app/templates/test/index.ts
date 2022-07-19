import chai, { expect } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import CollectionConfig from "./../config/CollectionConfig";
import ContractArguments from "../config/ContractArguments";
import { NftContractType } from "../lib/NftContractProvider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { Membership } from "../typechain/Membership";
import type { <%=contractName%> } from "../typechain/<%=contractName%>";

chai.use(ChaiAsPromised);

describe(CollectionConfig.contractName, () => {
  let owner!: SignerWithAddress;
  let holder!: SignerWithAddress;
  let user!: SignerWithAddress;
  let premiumMember!: SignerWithAddress;
  let vipMember!: SignerWithAddress;
  let externalUser!: SignerWithAddress;
  let signers!: SignerWithAddress[];

  let contract!: NftContractType;
  let membership!: Membership;
  let blendContract!: MooniePunk3D;

  before(async () => {
    [owner, holder, user, externalUser, premiumMember, vipMember, ...signers] =
      await ethers.getSigners();
  });

  describe("Deployment", () => {
    it("Should deploy the membership contract for testing", async () => {
      const Membership = await ethers.getContractFactory("Membership");
      membership = (await Membership.deploy(100, 10)) as Membership;
      await membership.deployed();
      // Initialise Members
      for (let i = 0; i < 10; i++) {
        await membership.mintStandard(await signers[i].getAddress());
      }
      for (let i = 11; i <= 13; i++) {
        await membership.mintVip(await signers[i].getAddress());
      }
    });

    it("Should deploy the contract", async () => {
      const Contract = await ethers.getContractFactory(
        CollectionConfig.contractName
      );
      contract = (await Contract.deploy(
        ...ContractArguments.slice(0, 7),
        membership.address
      )) as NftContractType;
      await contract.deployed();
    });

    it("Should deploy the blend contract for testing", async () => {
      const BlendContract = await ethers.getContractFactory("MooniePunk3D");
      blendContract = (await BlendContract.deploy(
        contract.address
      )) as MooniePunk3D;
      await blendContract.deployed();
      expect(await blendContract.contractAddress()).to.be.equal(
        contract.address
      );
    });

    it("Should deploy with the correct name and symbol", async () => {
      expect(await contract.name()).to.equal(CollectionConfig.tokenName);
      expect(await contract.symbol()).to.equal(CollectionConfig.tokenSymbol);
    });

    it("Should deploy with the correct owner", async () => {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should deploy with the correct supply counts", async () => {
      expect(await contract.maxSupply()).to.equal(CollectionConfig.maxSupply);
      expect(await contract.maxMintAmount()).to.equal(
        CollectionConfig.publicMint.maxMintAmount
      );
    });

    it("Should deploy with the correct mint states", async () => {
      expect(await contract.paused()).to.equal(true);
    });

    it("Should deploy with the correct membership contract", async () => {
      expect(await contract.membershipContract()).to.equal(membership.address);
    });

    it("Should deploy with correct URI Prefix", async () => {
      expect(await contract.uriPrefix()).to.equal(
        CollectionConfig.hiddenMetadataUri
      );
    });

    it("Should deploy with correct max mint", async () => {
      expect(await contract.maxMintAmount()).to.equal(
        CollectionConfig.publicMint.maxMintAmount
      );
    });

    it("Should deploy with zero tokens", async () => {
      await expect(contract.tokenURI(1)).to.be.revertedWith(
        "URI query for nonexistent token"
      );
    });
  });

  describe("Owner Functions", () => {
    it("Should only allow owner to pause or unpause", async () => {
      await expect(
        contract.connect(externalUser).setPaused(false)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await contract.connect(owner).setPaused(false);
      await contract.connect(owner).setPaused(true);
    });

    it("Should only allow the owner to set the max mint", async () => {
      await expect(
        contract.connect(externalUser).setMaxMintAmount(99999)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await contract
        .connect(owner)
        .setMaxMintAmount(CollectionConfig.publicMint.maxMintAmount);
    });

    it("Should only allow the owner to set the URI prefix", async () => {
      await expect(
        contract.connect(externalUser).setUriPrefix("INVALID_PREFIX")
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await contract
        .connect(owner)
        .setUriPrefix(CollectionConfig.hiddenMetadataUri);
    });

    it("Should only allow the owner to set the URI suffix", async () => {
      await expect(
        contract.connect(externalUser).setUriSuffix("INVALID_SUFFIX")
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await contract.connect(owner).setUriSuffix(".json");
    });

    it("Should only allow owner to call withdraw", async () => {
      await expect(
        contract.connect(externalUser).withdraw()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow the owner change the membership contract", async () => {
      await expect(
        contract
          .connect(externalUser)
          .setMembershipContract("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow the owner to call mintForAddress", async () => {
      await expect(
        contract
          .connect(externalUser)
          .mintForAddress(1, await externalUser.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await contract
        .connect(owner)
        .mintForAddress(1, await premiumMember.getAddress());
    });
  });

  describe("While paused", () => {
    it("Should prevent anyone from public minting", async () => {
      await expect(contract.connect(holder).mint(1)).to.be.revertedWith(
        "The contract is paused!"
      );
      await expect(contract.connect(owner).mint(1)).to.be.revertedWith(
        "The contract is paused!"
      );
    });

    it("Should prevent vip minting", async () => {
      await expect(
        contract.connect(vipMember).vipMint(2, 101)
      ).to.be.revertedWith("The contract is paused!");
    });

    it("Should prevent premium minting", async () => {
      await expect(
        contract.connect(vipMember).premiumMint(1, 1)
      ).to.be.revertedWith("The contract is paused!");
      await contract.setPaused(false);
    });
  });

  describe("Public Minting", () => {
    it("Should fail user tries to mint too many across multiple mints", async () => {
      await contract.connect(holder).mint(2);
      await expect(contract.connect(holder).mint(2)).to.be.revertedWith(
        "Exceeds max mint amount"
      );
    });

    it("Should allow users to mint", async () => {
      await contract.connect(user).mint(1);
      await contract.connect(user).mint(2);
    });
  });

  describe("VIP Minting", () => {
    it("Should fail if user tries to mint too many", async () => {
      await expect(
        contract.connect(signers[11]).vipMint(11, 101)
      ).to.be.revertedWith("Invalid mint amount!");
    });

    it("Should fail if user tries to mint with token they don't own", async () => {
      await expect(
        contract.connect(signers[11]).vipMint(2, 102)
      ).to.be.revertedWith("Membership not verified");
    });
    it("Should allow VIP members to mint", async () => {
      await contract.connect(signers[11]).vipMint(5, 101);
    });
    it("Should allow VIP members to mint multiple times", async () => {
      await contract.connect(signers[11]).vipMint(3, 101);
      await contract.connect(signers[11]).vipMint(2, 101);
    });
    it("Should fail if VIP tries to mint too many", async () => {
      await expect(
        contract.connect(signers[11]).vipMint(1, 101)
      ).to.be.revertedWith("Exceeds max mint amount");
    });
  });

  describe("Premium Minting", () => {
    it("Should fail if user tries to mint too many", async () => {
      await expect(
        contract.connect(signers[0]).premiumMint(4, 1)
      ).to.be.revertedWith("Invalid mint amount!");
    });

    it("Should fail if user tries to mint with token they don't own", async () => {
      await expect(
        contract.connect(signers[0]).premiumMint(1, 2)
      ).to.be.revertedWith("Membership not verified");
    });

    it("Should allow premium members to mint", async () => {
      await contract.connect(signers[0]).premiumMint(1, 1);
    });

    it("Should allow premium members to mint multiple times", async () => {
      await contract.connect(signers[0]).premiumMint(2, 1);
    });

    it("Should fail if premium user tries to mint too many", async () => {
      await expect(
        contract.connect(signers[0]).premiumMint(1, 1)
      ).to.be.revertedWith("Exceeds max mint amount");
    });
  });

  describe("Additional Functions", () => {
    it("Should allow users to check if VIP token can mint", async () => {
      expect(
        await contract.connect(externalUser).checkMembershipToken(100)
      ).to.be.equal(true);
    });
    it("Should allow users to check if VIP token can mint", async () => {
      expect(
        await contract.connect(externalUser).checkMembershipToken(101)
      ).to.be.equal(false);
      expect(
        await contract.connect(externalUser).checkMembershipToken(102)
      ).to.be.equal(true);
    });
    it("Should allow anyone to check token URI", async () => {
      expect(await contract.connect(externalUser).tokenURI(1)).to.be.equal(
        CollectionConfig.hiddenMetadataUri + "1.json"
      );
    });
    it("Wallet of owner", async () => {
      expect(await contract.walletOfOwner(await owner.getAddress())).to.be
        .empty;
      expect(
        await contract.walletOfOwner(await holder.getAddress())
      ).deep.equal([BigNumber.from(2), BigNumber.from(3)]);
    });
  });

  describe("Supply tracking", () => {
    it("Should not allow membership mints to exceed supply", async () => {
      await contract.connect(owner).disableRedemptions();
      await expect(
        contract.connect(signers[3]).premiumMint(1, 4)
      ).to.be.revertedWith("Exceeds membership supply");
    });

    it("Supply checks (long)", async function () {
      if (process.env.EXTENDED_TESTS === undefined) {
        this.skip();
      }

      await contract.setMaxMintAmount(100);

      let alreadyMinted = (await contract.totalSupply()).toNumber();
      let maxSupply = (await contract.maxSupply()).toNumber();
      let maxMintAmount = (await contract.maxMintAmount()).toNumber();
      const reservedSupply = (
        await contract.remainingReservedSupply()
      ).toNumber();

      const iterations = Math.floor(
        (maxSupply - alreadyMinted - reservedSupply) / maxMintAmount
      );

      const expectedPublicSupply = iterations * maxMintAmount + alreadyMinted;

      const lastMintAmount = maxSupply - expectedPublicSupply - reservedSupply;

      for (let i = 0; i < iterations; i++) {
        await contract.connect(signers[i + 10]).mint(maxMintAmount);
      }

      alreadyMinted = (await contract.totalSupply()).toNumber();

      expect(await contract.totalSupply()).to.be.equal(alreadyMinted);

      // Try to mint over max supply (before sold-out)
      await expect(
        contract.connect(holder).mint(lastMintAmount + 1)
      ).to.be.revertedWith("Max supply exceeded!");

      await expect(
        contract.connect(holder).mint(lastMintAmount + 2)
      ).to.be.revertedWith("Max supply exceeded!");

      expect(await contract.totalSupply()).to.equal(expectedPublicSupply);

      // Mint last tokens with owner address
      await contract.connect(owner).mint(lastMintAmount);
      const expectedWalletOfOwner = [BigNumber.from(1)];

      for (const i of [...Array(lastMintAmount).keys()].reverse()) {
        expectedWalletOfOwner.push(
          BigNumber.from(CollectionConfig.maxSupply - i)
        );
      }

      // Try to mint over max supply (after sold-out)
      await expect(
        contract.connect(user).mint(lastMintAmount + 1)
      ).to.be.revertedWith("Max supply exceeded!");

      const remainingPromoMints = (
        await contract.remainingPromoMints()
      ).toNumber();

      await contract.setMaxMintAmount(remainingPromoMints);

      contract
        .connect(owner)
        .mintForAddress(remainingPromoMints, await user.getAddress());

      await expect(
        contract.connect(owner).mintForAddress(1, await user.getAddress())
      ).to.be.revertedWith("Max supply exceeded!");

      expect(await contract.totalSupply()).to.be.equal(
        CollectionConfig.maxSupply
      );

      //  Blend tokens
      await expect(
        contract.connect(owner).blend([1, 2, 3, 4, 5])
      ).to.be.revertedWith("Blend is not enabled");
      alreadyMinted = (await contract.totalSupply()).toNumber();
    });
  });

  describe("Blending", () => {
    it("Should fail if blend is not enabled", async () => {
      await expect(
        contract.connect(signers[11]).blend([7, 8, 9])
      ).to.be.revertedWith("Blend is not enabled");
      await contract.setBlendEnabled(true);
    });

    it("Should fail if blend amount is not set", async () => {
      await expect(
        contract.connect(signers[11]).blend([7, 8, 9])
      ).to.be.revertedWith("Blend requirement not set");
      await contract.setRequiredToBlend(3);
    });

    it("Should fail if user does not send the required amount", async () => {
      await expect(contract.connect(user).blend([1, 2])).to.be.revertedWith(
        "Blend must equal the required amount"
      );
    });

    it("Should fail if user tries blending tokens they don't own", async () => {
      await expect(contract.connect(user).blend([1, 2, 3])).to.be.revertedWith(
        "Membership tokens must be verified"
      );
    });

    it("Should allow user to blend", async () => {
      await contract.mintForAddress(3, signers[11].address);
      expect(await contract.blended(signers[11].address)).to.be.equal(0);
      await contract.connect(signers[11]).blend([7, 8, 9]);
      await contract.connect(signers[11]).blend([10, 11, 12]);
      await contract.connect(signers[11]).blend([13, 14, 15]);
      expect(await contract.blended(signers[11].address)).to.be.equal(3);
    });

    it("Should fail if claimBlend() is not called from blend contract", async () => {
      await expect(
        contract.connect(signers[11]).claimBlend(signers[11].address)
      ).to.be.revertedWith("Only the blend contract can claim blends");
      await contract.setBlendContract(blendContract.address);
    });

    it("Should fail if blend contract is paused", async () => {
      await expect(
        blendContract.connect(signers[12]).claimBlends()
      ).to.be.revertedWith("Pausable: paused");
      await blendContract.unpause();
    });

    it("Should fail if zero mint has not been minted", async () => {
      await expect(
        blendContract.connect(signers[12]).claimBlends()
      ).to.be.revertedWith("Zero Mint has not been minted.");
    });

    it("Should allow owner to mint zero mint", async () => {
      expect(await blendContract.totalSupply()).to.be.equal(0);
      await blendContract.zeroMint(owner.address);
      expect(await blendContract.totalSupply()).to.be.equal(1);
    });

    it("Should fail if zero mint is called again", async () => {
      await expect(blendContract.zeroMint(owner.address)).to.be.revertedWith(
        "Zero mint has been minted."
      );
    });

    it("Should fail if user has no blends to claim", async () => {
      await expect(
        blendContract.connect(signers[12]).claimBlends()
      ).to.be.revertedWith("No blends to claim");
    });

    it("Should allow user to claim blends", async () => {
      await (await blendContract.connect(signers[11]).claimBlends()).wait();
      expect(await contract.blended(signers[11].address)).to.be.equal(0);
      expect(
        (await blendContract.tokensOfOwner(signers[11].address)).length
      ).to.be.equal(3);
    });
    it("Should allow user to claim single blend", async () => {
      await contract.connect(signers[11]).blend([20, 21, 22]);
      expect(await contract.blended(signers[11].address)).to.be.equal(1);
      await blendContract.connect(signers[11]).claimBlends();
      expect(await contract.blended(signers[11].address)).to.be.equal(0);
      expect(
        (await blendContract.tokensOfOwner(signers[11].address)).length
      ).to.be.equal(4);
      expect(await blendContract.totalSupply()).to.be.equal(5);
    });
  });

  describe("Withdrawing", () => {
    it("Should allow the owner to withdraw funds", async () => {
      await contract.connect(owner).withdraw();
    });
  });
});
