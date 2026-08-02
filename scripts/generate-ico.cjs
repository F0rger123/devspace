const { Resvg } = require('@resvg/resvg-js');
const pngToIco = require('png-to-ico').default || require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function generateIco() {
  const svgPath = path.join(__dirname, '../public/favicon.svg');
  const icoPath = path.join(__dirname, '../public/favicon.ico');

  if (!fs.existsSync(svgPath)) {
    throw new Error(`SVG file not found at ${svgPath}`);
  }

  const svg = fs.readFileSync(svgPath, 'utf8');
  const sizes = [16, 24, 32, 48, 64, 128, 256];

  console.log(`Generating PNG buffers for sizes: ${sizes.join(', ')}...`);
  const pngBuffers = sizes.map(size => {
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: size }
    });
    return resvg.render().asPng();
  });

  console.log('Encoding multi-resolution ICO file...');
  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(icoPath, icoBuffer);

  console.log(`Successfully generated genuine Windows ICO at ${icoPath} (${icoBuffer.length} bytes).`);
}

generateIco().catch(err => {
  console.error('Failed to generate ICO:', err);
  process.exit(1);
});
