const sharp = require('sharp');
const path = require('node:path');
// Rasterize the existing app logo for iOS launch screens, without new artwork.
const sizes = [[640,1136],[750,1334],[828,1792],[1125,2436],[1170,2532],[1179,2556],[1206,2622],[1242,2688],[1284,2778],[1290,2796],[1320,2868],[1536,2048],[1620,2160],[1640,2360],[1668,2388],[2048,2732]];
(async () => {
  await sharp(path.join(__dirname,'../public/icon.svg')).resize(180,180).png().toFile(path.join(__dirname,'../public/apple-touch-icon.png'));
  for (const [width,height] of sizes) for (const [w,h] of [[width,height],[height,width]]) {
    const size = Math.round(Math.min(w,h)*.22);
    const logo = await sharp(path.join(__dirname,'../public/icon.svg')).resize(size,size).png().toBuffer();
    await sharp({create:{width:w,height:h,channels:4,background:'#eef3f7'}}).composite([{input:logo,gravity:'centre'}]).png().toFile(path.join(__dirname,`../public/splash-${w}x${h}.png`));
  }
  console.log('Generated portrait and landscape iOS launch screens.');
})().catch(error=>{console.error(error);process.exitCode=1;});
