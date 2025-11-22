/**
 * --- Dominance Ratio Calculation Hook ---
 * * This hook is responsible for performing the core data transformation necessary 
 * to generate the BTC/ETH Dominance Ratio Momentum Chart.
 * * It calculates two main data points for a given array of historical dominance snapshots:
 * * 1. Daily BTC/ETH Dominance Ratio: The ratio of Bitcoin's dominance to Ethereum's dominance.
 * 2. 7-Day Rolling Percentage Change: The velocity (momentum) of the ratio, calculated
 * as the percentage change between the ratio today and the ratio 7 days ago.
 * * This separation ensures that the complex data processing logic is independent of the 
 * charting library used for visualization, making the application easier to maintain and 
 * allowing for chart library swaps without rewriting the core calculations.
 */
// Define the structure of the input data
interface HistoricalDominanceSnapshot {
    date: number; // UNIX timestamp
    btcDominance: number;
    ethDominance: number;
}

// Define the structure of the output data for the chart
interface PercentageChangeChartData {
    labels: string[]; // Empty labels for RnChartKit
    datasets: {
        data: number[];
        color: () => string;
        strokeWidth: number;
        withDots: boolean;
    }[];
}

// Define the shape of the data returned by this hook
interface DominanceCalculationResult {
    // Data processed into a format ready for chart libraries
    chartData: PercentageChangeChartData | null;
    // The most recent calculated change value
    currentChange: number;
    // The raw calculated percentage change array
    rawChangeData: number[];
}

const MOVING_AVERAGE_PERIOD = 7; // The 7-day lookback period

/**
 * Calculates the daily BTC/ETH Dominance Ratio and the 7-day rolling percentage change 
 * of that ratio.
 * * @param historicalData Array of historical dominance snapshots.
 * @returns An object containing the processed data, current change, and raw data.
 */
export function useCalculatePercentageChange(
    historicalData: HistoricalDominanceSnapshot[] | null | undefined,
    // Dependency Injection for Colors/Styling (though typically presentation is separate, we need colors for the datasets array)
    momentumColor: string,
    zeroLineColor: string
): DominanceCalculationResult {

    // Default return state if data is missing or empty
    if (!historicalData || historicalData.length < MOVING_AVERAGE_PERIOD) {
        return { chartData: null, currentChange: 0, rawChangeData: [] };
    }

    // 1. Calculate the daily BTC/ETH Ratio
    const ratios = historicalData.map(item => {
        // Prevent division by zero, use 0 if ETH dominance is zero/missing
        return item.ethDominance > 0
            ? item.btcDominance / item.ethDominance
            : 0;
    });

    // 2. Calculate 7-day Percentage Change
    const percentageChanges: number[] = [];
    for (let i = 0; i < ratios.length; i++) {
        if (i < MOVING_AVERAGE_PERIOD) {
            // Not enough history, use 0 as placeholder for the first 7 days
            percentageChanges.push(0);
        } else {
            const previousRatio = ratios[i - MOVING_AVERAGE_PERIOD];
            const currentRatio = ratios[i];

            let change = 0;
            if (previousRatio > 0) {
                // Formula: ((Current / Previous) - 1) * 100
                change = ((currentRatio / previousRatio) - 1) * 100;
            }
            percentageChanges.push(change);
        }
    }

    // 3. Get the latest change value
    const currentChange = percentageChanges[percentageChanges.length - 1] || 0;

    // 4. Prepare chart data for rendering (structure dictated by the intended chart library, but generated here)
    const dataForChart: PercentageChangeChartData = {
        // Labels are typically dates, but RnChartKit handles date formatting separately or is passed empty labels
        labels: historicalData.map(() => ""),
        datasets: [
            {
                // The 7-Day Change Line (Momentum)
                data: percentageChanges,
                color: () => momentumColor,
                strokeWidth: 2,
                withDots: false,
            },
            {
                // The Zero Line (Baseline)
                data: percentageChanges.map(() => 0),
                color: () => zeroLineColor,
                strokeWidth: 1,
                withDots: false,
            }
        ],
    };

    return {
        chartData: dataForChart,
        currentChange: currentChange,
        rawChangeData: percentageChanges
    };
}

/**
 * Calculates statistics for all 7-day ratio changes across the entire dataset.
 * This function extracts all valid 7-day changes (excluding the first 7 days which are placeholders).
 * 
 * @param historicalData Array of historical dominance snapshots.
 * @returns An object containing statistics about all 7-day changes: min, max, average, count, and all values.
 */
export function calculateAll7DayRatioChanges(
    historicalData: HistoricalDominanceSnapshot[] | null | undefined
): {
    min: number;
    max: number;
    average: number;
    count: number;
    allChanges: number[];
    validChanges: number[]; // Excludes the first 7 placeholder zeros
    minDate: number | null; // Date when min occurred
    maxDate: number | null; // Date when max occurred
} {
    // Default return if data is missing
    if (!historicalData || historicalData.length < MOVING_AVERAGE_PERIOD) {
        return {
            min: 0,
            max: 0,
            average: 0,
            count: 0,
            allChanges: [],
            validChanges: [],
            minDate: null,
            maxDate: null
        };
    }

    // 1. Calculate the daily BTC/ETH Ratio
    const ratios = historicalData.map(item => {
        return item.ethDominance > 0
            ? item.btcDominance / item.ethDominance
            : 0;
    });

    // 2. Calculate all 7-day Percentage Changes with date tracking
    const percentageChanges: number[] = [];
    const changeDates: number[] = []; // Track dates for each change
    for (let i = 0; i < ratios.length; i++) {
        if (i < MOVING_AVERAGE_PERIOD) {
            // Not enough history, use 0 as placeholder for the first 7 days
            percentageChanges.push(0);
            changeDates.push(historicalData[i].date);
        } else {
            const previousRatio = ratios[i - MOVING_AVERAGE_PERIOD];
            const currentRatio = ratios[i];

            let change = 0;
            if (previousRatio > 0) {
                // Formula: ((Current / Previous) - 1) * 100
                change = ((currentRatio / previousRatio) - 1) * 100;
            }
            percentageChanges.push(change);
            changeDates.push(historicalData[i].date);
        }
    }

    // 3. Extract valid changes (skip the first 7 placeholder zeros)
    const validChanges = percentageChanges.slice(MOVING_AVERAGE_PERIOD);
    const validDates = changeDates.slice(MOVING_AVERAGE_PERIOD);

    // 4. Calculate statistics
    if (validChanges.length === 0) {
        return {
            min: 0,
            max: 0,
            average: 0,
            count: 0,
            allChanges: percentageChanges,
            validChanges: [],
            minDate: null,
            maxDate: null
        };
    }

    const min = Math.min(...validChanges);
    const max = Math.max(...validChanges);
    const sum = validChanges.reduce((acc, val) => acc + val, 0);
    const average = sum / validChanges.length;

    // Find dates for min and max
    const minIndex = validChanges.indexOf(min);
    const maxIndex = validChanges.indexOf(max);
    const minDate = minIndex >= 0 ? validDates[minIndex] : null;
    const maxDate = maxIndex >= 0 ? validDates[maxIndex] : null;

    return {
        min,
        max,
        average,
        count: validChanges.length,
        allChanges: percentageChanges,
        validChanges,
        minDate,
        maxDate
    };
}