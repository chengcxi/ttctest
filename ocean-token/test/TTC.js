const { expect } = require("chai");
const hre = require("hardhat");

describe("TTC contract", function() {
  // global vars
  let Token;
  let ttc;
  let owner;
  let addr1;
  let addr2;
  let tokenCap = 100;
  let tokenBlockReward = 1;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    Token = await ethers.getContractFactory("TTC");
    [owner, addr1, addr2] = await hre.ethers.getSigners();

    ttc = await Token.deploy(tokenCap, tokenBlockReward);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await ttc.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await ttc.balanceOf(owner.address);
      expect(await ttc.totalSupply()).to.equal(ownerBalance);
    });

    it("Should set the max capped supply to the argument provided during deployment", async function () {
      const cap = await ttc.cap();
      expect(Number(hre.ethers.utils.formatEther(cap))).to.equal(tokenCap);
    });

    it("Should set the blockReward to the argument provided during deployment", async function () {
      const blockReward = await ttc.blockReward();
      expect(Number(hre.ethers.utils.formatEther(blockReward))).to.equal(tokenBlockReward);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      await ttc.transfer(addr1.address, 1);
      const addr1Balance = await ttc.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(1);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await ttc.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await ttc.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(1);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await ttc.balanceOf(owner.address);
      // Try to send 1 token from addr1 (0 tokens) to owner (100 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        ttc.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      // Owner balance shouldn't have changed.
      expect(await ttc.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await ttc.balanceOf(owner.address);

      // Transfer 10 tokens from owner to addr1.
      await ttc.transfer(addr1.address, 10);

      // Transfer another 1 token from owner to addr2.
      await ttc.transfer(addr2.address, 1);

      // Check balances.
      const finalOwnerBalance = await ttc.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));

      const addr1Balance = await ttc.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(10);

      const addr2Balance = await ttc.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(1);
    });
  });
  
});
