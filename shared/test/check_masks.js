
const masks = {
  "farm": [
    "//8PAAD//w8AAP//DwAA//8PAAD//w8AAP//DwAA//8NAAD//w0AAP//DQAA//8NAAD//w0AAP//CwAA//8DAAD//wMAAP//CwAA+P8KAADgHwgAAIAfAAAAAAwAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    "AADw//8AAPD//wAA8P//AADw//8AAPD//wAA8P//AADw//8AAPD//wAA8P//AADw//8AAPD//wAA8I//AADwB/gAAPAH8AAA8APgAADwAwAAAPADAAAA8AEAAADwAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAEAAADABwAAAOAPAAAA+D8AAAD4/wAAAPj/AAAA/P8AAAD//wAAgP//AADg//8AAPD//wAA+P//AAD4//8AAPj//wAA8P//AADw//8AAPD//wAA8P//AADw//8=",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAAAAAH8AAAAA/wEAAAD/PwAAAP9/AAAA/38AAAD/fwAAAP//AAAA//8DAAD//wMAAP//AwAA//8HAAD//wcAAP//BwAA//8HAAA="
  ]
};

function decodeMask(maskBase64) {
  const binaryString = Buffer.from(maskBase64, 'base64').toString('binary');
  const result = new Array(40 * 40).fill(false);
  for (let i = 0; i < binaryString.length; i++) {
    const byte = binaryString.charCodeAt(i);
    for (let bit = 0; bit < 8; bit++) {
      const index = i * 8 + bit;
      if (index < result.length) {
        result[index] = !!(byte & (1 << bit));
      }
    }
  }
  return result;
}

masks.farm.forEach((m, i) => {
  const decoded = decodeMask(m);
  const count = decoded.filter(b => b).length;
  console.log(`Farm ${i}: ${count} pixels`);
  
  // Check for overlap with other farms
  masks.farm.forEach((m2, j) => {
    if (i === j) return;
    const decoded2 = decodeMask(m2);
    let overlaps = 0;
    for (let k = 0; k < decoded.length; k++) {
      if (decoded[k] && decoded2[k]) overlaps++;
    }
    if (overlaps > 0) console.log(`  Overlaps with Farm ${j}: ${overlaps} pixels`);
  });
});
