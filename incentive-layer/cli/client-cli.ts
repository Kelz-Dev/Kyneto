#!/usr/bin/env node

import { Command } from 'commander';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const program = new Command();

program
    .name('client-cli')
    .description('CLI tool for storage clients')
    .version('0.1.0');

// Upload file and create storage deal
program
    .command('upload')
    .description('Upload file and create storage deal')
    .requiredOption('-f, --file <path>', 'File to upload')
    .requiredOption('-d, --duration <days>', 'Storage duration in days', parseInt)
    .option('-p, --price <price>', 'Price per GB/month in STK', '0.05')
    .action(async (options) => {
        try {
            console.log('📁 Reading file...');
            const fileData = fs.readFileSync(options.file);
            const fileSizeGB = Math.ceil(fileData.length / (1024 * 1024 * 1024 * 10)) / 100; // Round to 2 decimals

            console.log(`   File size: ${fileSizeGB} GB`);
            console.log(`   Duration: ${options.duration} days`);

            // Encrypt file before upload
            console.log('\n🔒 Encrypting file...');
            const { encryptFile } = await import('../services/encryption/kyneto-encrypt');
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!);
            const publicKey = wallet.signingKey.publicKey;

            const encrypted = await encryptFile(fileData, publicKey);
            console.log('   ✅ File encrypted with AES-256-GCM');
            console.log(`   Encrypted size: ${(encrypted.encryptedData.length / (1024 * 1024)).toFixed(2)} MB`);
            console.log(`   Key wrapped with wallet public key`);

            // Calculate cost
            const months = Math.ceil(options.duration / 30);
            const encodedSize = fileSizeGB * 1.5; // 10+5 erasure coding
            const totalCost = encodedSize * parseFloat(options.price) * months;

            console.log(`\n💰 Cost Calculation:`);
            console.log(`   Original size: ${fileSizeGB} GB`);
            console.log(`   Encoded size:  ${encodedSize.toFixed(2)} GB (10+5 erasure coding)`);
            console.log(`   Rate: ${options.price} STK/GB/month`);
            console.log(`   Duration: ${months} month(s)`);
            console.log(`   Total cost: ${totalCost.toFixed(4)} STK`);

            console.log('\n📤 Next steps:');
            console.log('1. Encrypted file will be uploaded to IPFS');
            console.log('2. Erasure coded into 15 encrypted shards');
            console.log('3. Distributed to 15 providers (they see only ciphertext)');
            console.log('4. Payment escrowed until deal completion');
            console.log('5. Encryption key stored — only your wallet can decrypt');

            console.log('\n⚠️  Full implementation requires:');
            console.log('   - IPFS node running');
            console.log('   - Erasure coding service');
            console.log('   - Provider selection algorithm');
            console.log('   - Smart contract integration');

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

// Check deal status
program
    .command('status')
    .description('Check status of a storage deal')
    .requiredOption('-d, --deal-id <id>', 'Deal ID', parseInt)
    .action(async (options) => {
        try {
            const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            const marketplaceAddress = process.env.MARKETPLACE_CONTRACT!;

            const marketplaceABI = [
                "function getDeal(uint256 dealId) view returns (address client, string fileCID, uint256 fileSizeGB, uint256 duration, uint256 totalCost, uint256 startTime, uint256 endTime, uint256 activeShards, uint8 status)"
            ];

            const marketplace = new ethers.Contract(marketplaceAddress, marketplaceABI, provider);

            console.log(`\n🔍 Fetching deal #${options.dealId}...`);
            const deal = await marketplace.getDeal(options.dealId);

            const statusNames = ['Active', 'Completed', 'Failed', 'Cancelled'];

            console.log('\n📋 Deal Details:');
            console.log('─'.repeat(50));
            console.log(`Client:        ${deal[0]}`);
            console.log(`File CID:      ${deal[1]}`);
            console.log(`File Size:     ${deal[2]} GB`);
            console.log(`Duration:      ${deal[3]} days`);
            console.log(`Total Cost:    ${ethers.formatEther(deal[4])} STK`);
            console.log(`Start Time:    ${new Date(Number(deal[5]) * 1000).toLocaleString()}`);
            console.log(`End Time:      ${new Date(Number(deal[6]) * 1000).toLocaleString()}`);
            console.log(`Active Shards: ${deal[7]}/15`);
            console.log(`Status:        ${statusNames[deal[8]]}`);
            console.log('─'.repeat(50));

            // Health check
            if (deal[7] >= 15) {
                console.log('✅ All shards healthy');
            } else if (deal[7] >= 10) {
                console.log('⚠️  Some shards lost, but data can still be reconstructed');
            } else {
                console.log('❌ Critical: Too many shards lost!');
            }

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

// Check balance
program
    .command('balance')
    .description('Check your STK token balance')
    .action(async () => {
        try {
            const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

            const tokenAddress = process.env.TOKEN_CONTRACT!;
            const tokenABI = [
                "function balanceOf(address account) view returns (uint256)",
                "function symbol() view returns (string)"
            ];
            const token = new ethers.Contract(tokenAddress, tokenABI, wallet);

            const balance = await token.balanceOf(wallet.address);
            const symbol = await token.symbol();

            console.log(`\n💰 Your Balance:`);
            console.log(`   ${ethers.formatEther(balance)} ${symbol}`);
            console.log(`   Address: ${wallet.address}`);

        } catch (error) {
            console.error('❌ Error:', error.message);
            process.exit(1);
        }
    });

program.parse();
