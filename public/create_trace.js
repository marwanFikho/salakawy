const fs = require('fs');
let svg = fs.readFileSync('/home/fikho/Desktop/Salakawy/public/salakawy-logo.svg', 'utf8');

// Inject CSS animation
const style = `
<style>
    path {
        fill: none !important;
        stroke: #ffffff;
        stroke-width: 30;
        stroke-dasharray: 200 400; /* This creates the "strip" effect */
        stroke-linecap: round;
        animation: trace 3s linear infinite;
    }
    @keyframes trace {
        100% {
            stroke-dashoffset: -600;
        }
    }
</style>
`;

// Insert style right after <svg ... >
svg = svg.replace(/(<svg[^>]*>)/i, '$1\n' + style);

// Ensure no fills override our CSS (they are presentation attributes, CSS !important handles it, but let's be safe)
svg = svg.replace(/fill="[^"]*"/g, 'fill="none"');

fs.writeFileSync('/home/fikho/Desktop/Salakawy/public/salakawy-logo-trace.svg', svg);
console.log('Trace SVG created!');
