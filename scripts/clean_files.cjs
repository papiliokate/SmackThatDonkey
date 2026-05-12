const fs = require('fs');
const path = require('path');

function cleanMainJs() {
    let content = fs.readFileSync(path.resolve(__dirname, '../main.js'), 'utf8');
    
    // Replace dynamic definitions with false
    content = content.replace(/const isCaptcha = urlParams\.get\('mode'\) === 'captcha';/g, "const isCaptcha = false;");
    content = content.replace(/const isEmbed = urlParams\.get\('mode'\) === 'embed';/g, "const isEmbed = false;");
    content = content.replace(/const isEmbed = new URLSearchParams\(window\.location\.search\)\.get\('mode'\) === 'embed';/g, "const isEmbed = false;");

    fs.writeFileSync(path.resolve(__dirname, '../main.js'), content);
    console.log("Cleaned main.js");
}

function cleanConversionJs() {
    let content = fs.readFileSync(path.resolve(__dirname, '../conversion.js'), 'utf8');
    
    // In conversion, it's never stream mode or carousel mode
    content = content.replace(/const isStreamMode = urlParams\.get\('stream'\) === 'true';/g, "const isStreamMode = false;");
    content = content.replace(/const isCarousel = new URLSearchParams\(window\.location\.search\)\.get\('carousel'\) === 'true';/g, "const isCarousel = false;");
    
    // Remove PWA and binge logic
    content = content.replace(/const isStandalone = window\.matchMedia.*?\nif \(isStandalone.*?\}\n\}/s, "// Standalone logic removed");

    fs.writeFileSync(path.resolve(__dirname, '../conversion.js'), content);
    console.log("Cleaned conversion.js");
}

cleanMainJs();
cleanConversionJs();
