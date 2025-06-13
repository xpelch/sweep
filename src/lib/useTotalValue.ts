import { useCallback, useState } from 'react';
import { type TokenInfo } from '../types';
import { calculateTotalValue } from '../utils/tokenUtils';

export function useTotalValue() {
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [pricesLoaded, setPricesLoaded] = useState(false);

    const handlePricesUpdate = useCallback((newPrices: Record<string, number>) => {
        setPrices(newPrices);
        setPricesLoaded(true);
    }, []);

    const getTotalValue = useCallback((tokens: TokenInfo[]) => {
        return calculateTotalValue(tokens, prices);
    }, [prices]);

    return {
        prices,
        pricesLoaded,
        handlePricesUpdate,
        getTotalValue,
    };
} 