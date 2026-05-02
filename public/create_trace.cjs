const fs = require('fs');
let svg = fs.readFileSync('/home/fikho/Desktop/Salakawy/public/salakawy-logo.svg', 'utf8');

// Inject CSS animation
const style = `
<style>
    path {
        fill: none !important;
        stroke: none; /* Hide all by default */
    }
    path:first-of-type {
        stroke: #ffffff;
        stroke-width: 40; /* Increased width as requested */
        stroke-linecap: round;
        stroke-dasharray: 20 100; /* 20% line, 100% gap */
        stroke-dashoffset: 120;
        animation: trace 4.5s linear infinite; /* Slower speed */
    }
    @keyframes trace {
        100% {
            stroke-dashoffset: 20;
        }
    }
</style>
`;

// Insert style right after <svg ... >
svg = svg.replace(/(<svg[^>]*>)/i, '$1\n' + style);

// Ensure no fills override our CSS
svg = svg.replace(/fill="[^"]*"/g, 'fill="none"');

// Add pathLength="100" to the FIRST path only
let firstPathModified = false;
svg = svg.replace(/<path\s/i, (match) => {
    if (!firstPathModified) {
        firstPathModified = true;
        return '<path pathLength="100" ';
    }
    return match;
});

fs.writeFileSync('/home/fikho/Desktop/Salakawy/public/salakawy-logo-trace.svg', svg);
console.log('Trace SVG updated!');
