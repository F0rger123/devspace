const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function zipDirectory(sourceDir, outPath) {
  const zip = new JSZip();

  function addDir(dirPath, zipFolder) {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const subFolder = zipFolder.folder(item);
        addDir(fullPath, subFolder);
      } else {
        const fileData = fs.readFileSync(fullPath);
        zipFolder.file(item, fileData);
      }
    }
  }

  console.log(`Zipping ${sourceDir} -> ${outPath}...`);
  addDir(sourceDir, zip);

  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  fs.writeFileSync(outPath, content);
  console.log(`Successfully generated ${outPath} (${(content.length / (1024 * 1024)).toFixed(2)} MB)`);
}

const source = path.join(__dirname, '../release/win-unpacked');
const dest = path.join(__dirname, '../release/DevSpace-2.5.0-win-x64.zip');

zipDirectory(source, dest).catch((err) => {
  console.error('Zip generation failed:', err);
  process.exit(1);
});
