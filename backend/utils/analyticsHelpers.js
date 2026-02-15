// Helper functions for analyzing Excel data and generating intelligent insights

// Detect if a value looks like a date
const isDateLike = (value) => {
    if (!value) return false;
    const str = value.toString().trim();

    // Common date patterns
    const datePatterns = [
        /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,  // MM/DD/YYYY or DD/MM/YYYY
        /^\d{4}-\d{1,2}-\d{1,2}$/,      // YYYY-MM-DD
        /^\d{1,2}-\d{1,2}-\d{2,4}$/,    // MM-DD-YYYY
        /^\w{3}\s+\d{1,2},?\s+\d{4}$/   // Jan 1, 2024
    ];

    return datePatterns.some(pattern => pattern.test(str)) || !isNaN(Date.parse(str));
};

// Detect column type based on sample values
const detectColumnType = (values) => {
    if (!values || values.length === 0) return 'unknown';

    // Sample first 100 rows for analysis
    const samples = values.slice(0, Math.min(100, values.length)).filter(v => v !== null && v !== undefined && v !== '');

    if (samples.length === 0) return 'unknown';

    let numericCount = 0;
    let dateCount = 0;
    const uniqueValues = new Set();

    for (const val of samples) {
        uniqueValues.add(val);

        // Check if numeric
        const num = parseFloat(val);
        if (!isNaN(num) && isFinite(num)) {
            numericCount++;
        }

        // Check if date
        if (isDateLike(val)) {
            dateCount++;
        }
    }

    const numericRatio = numericCount / samples.length;
    const dateRatio = dateCount / samples.length;
    const uniqueRatio = uniqueValues.size / samples.length;

    // Type detection logic
    if (numericRatio > 0.8) return 'numeric';
    if (dateRatio > 0.8) return 'date';
    if (uniqueValues.size <= 20 || uniqueRatio < 0.5) return 'categorical';
    return 'text';
};

// Analyze all columns in a dataset
const analyzeColumns = (rows) => {
    if (!rows || rows.length === 0) return {};

    const columnAnalysis = {};
    const firstRow = rows[0].data;
    const columnNames = Object.keys(firstRow);

    for (const col of columnNames) {
        const values = rows.map(r => r.data[col]).filter(v => v !== null && v !== undefined);
        columnAnalysis[col] = {
            type: detectColumnType(values),
            sampleCount: values.length,
            uniqueCount: new Set(values).size
        };
    }

    return columnAnalysis;
};

// Suggest charts based on column types
const suggestCharts = (columnAnalysis) => {
    const charts = [];

    const numeric = Object.keys(columnAnalysis).filter(k => columnAnalysis[k].type === 'numeric');
    const categorical = Object.keys(columnAnalysis).filter(k => columnAnalysis[k].type === 'categorical');
    const dates = Object.keys(columnAnalysis).filter(k => columnAnalysis[k].type === 'date');
    const text = Object.keys(columnAnalysis).filter(k => columnAnalysis[k].type === 'text');

    // All numeric columns → Bar chart comparison
    if (numeric.length > 0) {
        charts.push({
            type: 'bar',
            title: 'Numeric Column Comparison',
            description: 'Summary statistics for numeric columns',
            columns: numeric.slice(0, 5), // Limit to 5 for readability
            aggregation: 'sum'
        });
    }

    // 1 categorical/text + 1+ numeric → Top-N bar chart
    if ((categorical.length > 0 || text.length > 0) && numeric.length > 0) {
        const categoryCol = categorical[0] || text[0];
        charts.push({
            type: 'topN',
            title: `Top 10 ${categoryCol} by ${numeric[0]}`,
            description: 'Most significant categories ranked by value',
            xAxis: categoryCol,
            yAxis: numeric[0],
            limit: 10
        });
    }

    // 1 date + 1+ numeric → Time series line chart
    if (dates.length > 0 && numeric.length > 0) {
        charts.push({
            type: 'timeSeries',
            title: `${numeric[0]} Trend Over Time`,
            description: 'Historical pattern analysis',
            xAxis: dates[0],
            yAxis: numeric[0]
        });
    }
    // 1 categorical + 1 numeric → Pie chart
    if (categorical.length > 0 && numeric.length > 0) {
        const categoryCol = categorical[0];
        charts.push({
            type: 'pie',
            title: `Distribution of ${categoryCol}`,
            description: `Composition analysis based on ${numeric[0]}`,
            category: categoryCol,
            value: numeric[0]
        });
    }

    // 1 date + 1+ numeric → Area chart (in addition to line)
    if (dates.length > 0 && numeric.length > 0) {
        charts.push({
            type: 'area',
            title: `${numeric[0]} Volume Trend`,
            description: 'Accumulated value over time period',
            xAxis: dates[0],
            yAxis: numeric[0]
        });
    }

    return charts;
};

// Calculate aggregations for numeric columns
const calculateNumericAggregations = (rows, numericColumns) => {
    const aggregations = {};

    for (const col of numericColumns) {
        const values = rows.map(r => parseFloat(r.data[col])).filter(v => !isNaN(v) && isFinite(v));

        if (values.length === 0) continue;

        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        aggregations[col] = { sum, avg, min, max, count: values.length };
    }

    return aggregations;
};

// Calculate Top-N for categorical columns
const calculateTopN = (rows, categoryColumn, valueColumn, limit = 10) => {
    const grouped = {};

    for (const row of rows) {
        const category = row.data[categoryColumn];
        const value = parseFloat(row.data[valueColumn]);

        if (!category || isNaN(value)) continue;

        if (!grouped[category]) {
            grouped[category] = { category, total: 0, count: 0 };
        }
        grouped[category].total += value;
        grouped[category].count += 1;
    }

    return Object.values(grouped)
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
};

// Calculate time series data
const calculateTimeSeries = (rows, dateColumn, valueColumn) => {
    const series = {};

    for (const row of rows) {
        const dateStr = row.data[dateColumn];
        const value = parseFloat(row.data[valueColumn]);

        if (!dateStr || isNaN(value)) continue;

        // Try to parse and normalize date
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) continue;

        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!series[dateKey]) {
            series[dateKey] = { date: dateKey, total: 0, count: 0 };
        }
        series[dateKey].total += value;
        series[dateKey].count += 1;
    }

    return Object.values(series)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(s => ({ date: s.date, value: s.total, avg: s.total / s.count }));
};

module.exports = {
    detectColumnType,
    analyzeColumns,
    suggestCharts,
    calculateNumericAggregations,
    calculateTopN,
    calculateTimeSeries
};
