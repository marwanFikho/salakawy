const fs = require('fs');
let svg = fs.readFileSync('/home/fikho/Desktop/Salakawy/public/salakawy-logo.svg', 'utf8');

// Match all <path ... />
const paths = svg.match(/<path[^>]*>/g);
console.log(`Found ${paths.length} paths.`);
console.log(`First path length: ${paths[0].length} characters.`);
console.log(`Second path length: ${paths[1].length} characters.`);
