import { useCallback, useState } from 'react';
import { encodeAbiParameters, encodeFunctionData, keccak256 } from 'viem';
import { getCode } from 'viem/actions';
import { usePublicClient, useWalletClient } from 'wagmi';
import { CoinbaseSmartWalletABI } from '../abis/CoinbaseSmartWallet';
import { EIP7702ProxyABI } from '../abis/EIP7702Proxy';
import { NonceTrackerABI } from '../abis/NonceTracker';
import { logError, logInfo } from './logger';

// EIP-7702 Proxy implementation set typehash
const IMPLEMENTATION_SET_TYPEHASH = '0x0000000000000000000000000000000000000000000000000000000000000001';

export function useEIP7702() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const upgradeAccount = useCallback(async () => {
        if (!walletClient || !publicClient) {
            setError('Wallet not connected');
            return false;
        }

        // Check if the wallet supports EIP-7702
        // if (walletClient.type !== 'local') {
        //     setError('Your wallet does not support EIP-7702 upgrades. Please use a compatible wallet.');
        //     return false;
        // }

        try {
            setIsLoading(true);
            setError(null);

            // Check if account is already upgraded
            const code = await getCode(publicClient, {
                address: walletClient.account.address,
            });
            if (code && code !== '0x') {
                logInfo('Account is already upgraded');
                return true;
            }

            // Configuration
            const config = {
                proxyAddress: '0x87f9f1E37d305D1a78Ce449Aae65d944CC4baB5c' as `0x${string}`,
                implementationAddress: '0x136Cc38e42353c0f8AA6AbB59E7e900eaCA586e9' as `0x${string}`,
                validatorAddress: '0xd2150F79D57D85c8429c4db69d78AD669E7aeAA9' as `0x${string}`,
                expiry: BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now
            };

            // 1. Sign EIP-7702 authorization (delegation to proxy)
            const authorization = await walletClient.signAuthorization({
                contractAddress: config.proxyAddress,
            });

            // 2. Get current nonceTracker from the proxy
            const nonceTracker = await publicClient.readContract({
                address: config.proxyAddress,
                abi: EIP7702ProxyABI,
                functionName: 'nonceTracker'
            });

            // Takes an address as an argument and returns the nonce for that address
            const nonces = await publicClient.readContract({
                address: nonceTracker,
                abi: NonceTrackerABI,
                functionName: 'nonces',
                args: [walletClient.account.address]
            }) as bigint;

            // 3. Prepare initialization calldata
            const initCalldata = encodeFunctionData({
                abi: CoinbaseSmartWalletABI,
                functionName: 'initialize',
                args: [[walletClient.account.address], 1n] // Single owner with threshold 1
            });

            // 4. Calculate hash to sign for setImplementation
            const hash = keccak256(
                encodeAbiParameters(
                    [
                        { name: 'typehash', type: 'bytes32' },
                        { name: 'chainId', type: 'uint256' },
                        { name: 'proxy', type: 'address' },
                        { name: 'nonce', type: 'uint256' },
                        { name: 'currentImplementation', type: 'address' },
                        { name: 'newImplementation', type: 'address' },
                        { name: 'callData', type: 'bytes32' },
                        { name: 'validator', type: 'address' },
                        { name: 'expiry', type: 'uint256' }
                    ],
                    [
                        IMPLEMENTATION_SET_TYPEHASH,
                        BigInt(publicClient.chain.id),
                        config.proxyAddress,
                        nonces,
                        '0x0000000000000000000000000000000000000000', // current implementation (0 for first time)
                        config.implementationAddress,
                        keccak256(initCalldata),
                        config.validatorAddress,
                        config.expiry
                    ]
                )
            );

            // 5. Sign the hash for setImplementation
            const signature = await walletClient.signMessage({
                message: { raw: hash }
            });

            // 6. Call setImplementation on the proxy
            const txHash = await walletClient.writeContract({
                address: config.proxyAddress,
                abi: EIP7702ProxyABI,
                functionName: 'setImplementation',
                args: [
                    config.implementationAddress,
                    initCalldata,
                    config.validatorAddress,
                    config.expiry,
                    signature,
                    false // allowCrossChainReplay
                ],
                authorizationList: [authorization],
            });

            await publicClient.waitForTransactionReceipt({ hash: txHash });
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            logError('Upgrade error:', err);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [publicClient, walletClient]);

    return {
        upgradeAccount,
        isLoading,
        error,
    };
} 