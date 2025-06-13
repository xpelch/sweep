import { useCallback, useState } from 'react';
import { type TokenInfo } from '../types';

export function useTokenSelection(tokens: TokenInfo[]) {
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

    return {
        selectedTokens,
        toggleToken,
        toggleAll,
        clearSelection,
        isAllSelected: selectedTokens.length === tokens.length,
    };
} 