export const TARGET_TOKENS = [
    {
        symbol: 'ETH',
        name: 'Ethereum',
        logo: '/eth.svg',
        address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    },
    {
        symbol: 'USDC',
        name: 'USD Coin',
        logo: '/usdc.svg',
        address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    },
    {
        symbol: 'PRO',
        name: 'Procoin',
        logo: '/pro.svg',
        address: '0xf65c3c30dd36b508e29a538b79b21e9b9e504e6c',
    },
] as const;

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

export const ERC20_ABI = [
    { 
        name: 'approve',   
        type: 'function', 
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' }, 
            { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }] 
    },
    { 
        name: 'allowance', 
        type: 'function', 
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' }, 
            { name: 'spender', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }] 
    },
    { 
        name: 'decimals',  
        type: 'function', 
        stateMutability: 'view',
        inputs: [], 
        outputs: [{ name: '', type: 'uint8' }] 
    },
    { 
        name: 'balanceOf', 
        type: 'function', 
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }] 
    },
] as const; 