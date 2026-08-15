# 1% swap fee via the 0x allowance holder

Every 0x quote appends a fee recipient (`0x78C8...C5`) and a 1% swap fee (`swapFeeBps: 100`), charged in the buy token. This is the app's revenue model: the fee is collected by the fee recipient on each swap rather than charged separately.