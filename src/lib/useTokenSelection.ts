import { useCallback, useEffect, useState } from 'react';
import { type TokenInfo, type TokenSymbol } from '../types';

export function useTokenSelection(tokens: TokenInfo[], targetToken: TokenSymbol) {
    const [selectedTokens, setSelectedTokens] = useState<TokenInfo[]>([]);

    const toggleToken = useCallback((token: TokenInfo) => {
        setSelectedTokens((prev) =>
            prev.some((t) => t.contractAddress === token.contractAddress)
                ? prev.filter((t) => t.contractAddress !== token.contractAddress)
                : [...prev, token]
        );
    }, []);

    const toggleAll = useCallback(() => {
        setSelectedTokens((prev) =>
            prev.length === tokens.length ? [] : tokens
        ); 
    }, [tokens]);

    const clearSelection = useCallback(() => {
        setSelectedTokens([]);
    }, []);

    // Deselect target token if it is in selectedTokens when targetToken changes
    useEffect(() => {
        setSelectedTokens((prev) => prev.filter((t) => t.symbol !== targetToken));
    }, [targetToken]);

    return {
        selectedTokens,
        toggleToken,
        toggleAll,
        clearSelection,
        isAllSelected: selectedTokens.length === tokens.length,
    };
} 