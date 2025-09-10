// index.js (the main code you provided)
const fs = require('fs');
const path = require('path');

// Large prime modulus for Shamir's Secret Sharing (must be > any y)
const primeP = BigInt(
  "208351617316091241234326746312124448251235562226470491514186331217050270460481"
);

// Convert string 'value' in base 'base' to BigInt decimal
function baseToDecimal(value, base) {
  const b = BigInt(base);
  let result = 0n;
  for (const ch of value) {
    const digit = BigInt(parseInt(ch, 36)); // supports 0-9 + a-z
    if (digit >= b) {
      throw new Error(`Invalid digit '${ch}' for base ${base} in value ${value}`);
    }
    result = result * b + digit;
  }
  return result;
}

// Modular inverse using Extended Euclidean Algorithm
function modInv(a, m) {
  let m0 = m;
  let x0 = 0n, x1 = 1n;
  let aa = a % m;

  if (m === 1n) return 0n;

  while (aa > 1n) {
    let q = aa / m;
    let t = m;

    m = aa % m;
    aa = t;
    t = x0;

    x0 = x1 - q * x0;
    x1 = t;
  }

  if (x1 < 0n) x1 += m0;
  return x1;
}

// Lagrange Interpolation at x=0, modulo p
// shares = array of [x, y], x and y are BigInt
function lagrangeInterpolation(shares, p) {
  const k = shares.length;
  let secret = 0n;

  for (let j = 0; j < k; j++) {
    const [xj, yj] = shares[j];
    let numerator = 1n;
    let denominator = 1n;

    for (let m = 0; m < k; m++) {
      if (m === j) continue;
      const [xm] = shares[m];

      numerator = (numerator * (-xm + p)) % p;
      denominator = (denominator * (xj - xm + p)) % p;
    }

    const invDenominator = modInv(denominator, p);
    const term = (yj * numerator * invDenominator) % p;
    secret = (secret + term) % p;
  }

  return secret;
}

// Extract first k shares from JSON input, convert all to BigInt
function getSharesFromInput(input) {
  const k = input.keys.k;
  const shares = [];

  for (let i = 1; i <= k; i++) {
    const shareObj = input[i.toString()];
    if (!shareObj) throw new Error(`Missing share number ${i} in input`);

    const base = parseInt(shareObj.base, 10);
    const value = shareObj.value;

    const y = baseToDecimal(value, base); // Always BigInt
    shares.push([BigInt(i), y]);
  }

  return shares;
}

// Process one JSON file, print the reconstructed secret
function processFile(filename) {
  console.log(`\nProcessing file: ${filename}`);

  try {
    const rawData = fs.readFileSync(filename, 'utf8');
    const input = JSON.parse(rawData);

    const shares = getSharesFromInput(input);
    const secret = lagrangeInterpolation(shares, primeP);

    console.log(`Reconstructed secret c = ${secret.toString()}`);
  } catch (e) {
    console.error(`Error processing ${filename}: ${e.message}`);
  }
}

// List your JSON files here:
const filesToProcess = [
  'input1.json',
  'input2.json',  
];

filesToProcess.forEach(processFile);
