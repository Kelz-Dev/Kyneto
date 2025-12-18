#!/usr/bin/env node

import { Command } from 'commander';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
    .name('provider-cli')
    .description('CLI tool for storage providers')
    .version('0.1.0');

// Register as provider
program
    .command('register')
    .description('Register as a storage provider')
    .requiredOption('-p, --peer-id <peerId>', 'IPFS peer ID')
    .requiredOption('-e, --endpoint <endpoint>', 'Provider API endpoint')
    .requiredOption('-r, --region <region>', 'Geographic region')
    .action(async (options) => {
        try {
            const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

            // Load contract
            const registryAddress = process.env.REGISTRY_CONTRACT!;
            const registryABI = [
                "function registerProvider(string peerId, string endpoint, string region) external"
            ];
            const registry = new ethers.Contract(registryAddress, registryABI, wallet);

            console.log('🔄 Registering as provider...');
            const tx = await registry.registerProvider(options.peerId, options.endpoint, options.region);
            console.log(`📝 Transaction: ${tx.hash}`);

            await tx.wait();
            console.log('✅ Successfully registered!');
            console.log(`   Peer ID: ${options.peerId}`);
            console.log(`   Endpoint: ${options.endpoint}`);
            console.log(`   Region: ${options.region}`);

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

// Create capacity pledge
program
    .command('pledge')
    .description('Pledge storage capacity')
    .requiredOption('-c, --capacity <GB>', 'Capacity in GB', parseInt)
    .requiredOption('-d, --duration <days>', 'Duration (30, 90, 180, or 365 days)', parseInt)
    .requiredOption('-a, --collateral <amount>', 'Collateral amount in STK tokens')
    .action(async (options) => {
        try {
            const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

            // Approve tokens first
            const tokenAddress = process.env.TOKEN_CONTRACT!;
            const tokenABI = ["function approve(address spender, uint256 amount) returns (bool)"];
            const token = new ethers.Contract(tokenAddress, tokenABI, wallet);

            const pledgesAddress = process.env.PLEDGES_CONTRACT!;
            const collateralWei = ethers.parseEther(options.collateral);

            console.log('🔄 Approving tokens...');
            let tx = await token.approve(pledgesAddress, collateralWei);
            await tx.wait();
            console.log('✅ Tokens approved');

            // Create pledge
            const pledgesABI = [
                "function createPledge(uint256 capacityGB, uint256 duration, uint256 collateralAmount) external"
            ];
            const pledges = new ethers.Contract(pledgesAddress, pledgesABI, wallet);

            const durationSeconds = options.duration * 24 * 60 * 60;

            console.log('🔄 Creating pledge...');
            tx = await pledges.createPledge(options.capacity, durationSeconds, collateralWei);
            console.log(`📝 Transaction: ${tx.hash}`);

            await tx.wait();
            console.log('✅ Pledge created successfully!');
            console.log(`   Capacity: ${options.capacity} GB`);
            console.log(`   Duration: ${options.duration} days`);
            console.log(`   Collateral: ${options.collateral} STK`);

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

// View earnings
program
    .command('earnings')
    .description('View your earnings')
    .action(async () => {
        try {
            const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

            const paymentsAddress = process.env.PAYMENTS_CONTRACT!;
            const paymentsABI = [
                "function getEarningsBreakdown(address provider) view returns (uint256 capacityRewards, uint256 usageRewards, uint256 proofBonuses, uint256 totalEarned, uint256 totalWithdrawn, uint256 available)"
            ];
            const payments = new ethers.Contract(paymentsAddress, paymentsABI, wallet);

            const earnings = await payments.getEarningsBreakdown(wallet.address);

            console.log('\n💰 Your Earnings:');
            console.log('─'.repeat(50));
            console.log(`Capacity Rewards: ${ethers.formatEther(earnings[0])} STK`);
            console.log(`Usage Rewards:    ${ethers.formatEther(earnings[1])} STK`);
            console.log(`Proof Bonuses:    ${ethers.formatEther(earnings[2])} STK`);
            console.log('─'.repeat(50));
            console.log(`Total Earned:     ${ethers.formatEther(earnings[3])} STK`);
            console.log(`Total Withdrawn:  ${ethers.formatEther(earnings[4])} STK`);
            console.log(`Available:        ${ethers.formatEther(earnings[5])} STK`);
            console.log('─'.repeat(50));

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

// Withdraw earnings
program
    .command('withdraw')
    .description('Withdraw available earnings')
    .action(async () => {
        try {
            const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

            const paymentsAddress = process.env.PAYMENTS_CONTRACT!;
            const paymentsABI = [
                "function withdrawEarnings() external",
                "function getAvailableEarnings(address provider) view returns (uint256)"
            ];
            const payments = new ethers.Contract(paymentsAddress, paymentsABI, wallet);

            // Check available
            const available = await payments.getAvailableEarnings(wallet.address);

            if (available === 0n) {
                console.log('ℹ️  No earnings available to withdraw');
                return;
            }

            console.log(`💰 Withdrawing ${ethers.formatEther(available)} STK...`);

            const tx = await payments.withdrawEarnings();
            console.log(`📝 Transaction: ${tx.hash}`);

            await tx.wait();
            console.log('✅ Withdrawal successful!');

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

program.parse();
