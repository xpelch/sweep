# Sweep

A Farcaster Mini App that lets users consolidate their token holdings into a single target token through sequential 0x Protocol swaps on Base.

## Language

**Sweep**:
The action of converting a user's selected holdings into a single target token.
_Avoid_: swap, consolidate

**Target Token**:
The token a sweep converts holdings into; one of ETH, USDC, or PRO.
_Avoid_: destination token, output token

**Holdings**:
The ERC-20 balances a connected wallet holds on Base.
_Avoid_: balances, tokens

**Portfolio**:
A user's holdings together with their total value.
_Avoid_: wallet, account

**Sweep Percentage**:
The fraction of each selected holding a sweep converts, expressed as a percentage (0-100).
_Avoid_: amount, ratio

**Blacklist**:
Tokens excluded from a user's holdings because they have no 0x liquidity.
_Avoid_: hidden tokens, ignored tokens