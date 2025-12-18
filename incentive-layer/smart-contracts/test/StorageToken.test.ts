import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { ethers } from 'ethers';

describe('StorageToken Contract', () => {
    let token: any;
    let owner: any;
    let addr1: any;

    beforeAll(async () => {
        // Setup test environment
        const [ownerSigner, addr1Signer] = await ethers.getSigners();
        owner = ownerSigner;
        addr1 = addr1Signer;

        const StorageToken = await ethers.getContractFactory('StorageToken');
        token = await StorageToken.deploy();
        await token.deployed();
    });

    it('Should have correct initial supply (500M)', async () => {
        const totalSupply = await token.totalSupply();
        expect(totalSupply).toBe(ethers.parseEther('500000000'));
    });

    it('Should allow owner to authorize minters', async () => {
        await token.authorizeMinter(addr1.address);
        const isAuthorized = await token.authorizedMinters(addr1.address);
        expect(isAuthorized).toBe(true);
    });

    it('Should allow batch transfers', async () => {
        const recipients = [addr1.address, owner.address];
        const amounts = [ethers.parseEther('100'), ethers.parseEther('200')];

        await token.batchTransfer(recipients, amounts);

        const balance1 = await token.balanceOf(addr1.address);
        expect(balance1).toBe(amounts[0]);
    });

    it('Should track inflation rate correctly', async () => {
        const rate = await token.annualInflationRate();
        expect(rate).toBe(500); // 5.00%
    });
});
