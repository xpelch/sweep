import { execSync } from 'child_process';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';
import { mnemonicToAccount } from 'viem/accounts';

// ANSI color codes
const yellow = '\x1b[33m';
const italic = '\x1b[3m';
const reset = '\x1b[0m';

// Load environment variables in specific order
// First load .env for main config
dotenv.config({ path: '.env' });

async function lookupFidByCustodyAddress(custodyAddress, apiKey) {
  if (!apiKey) {
    throw new Error('Neynar API key is required');
  }
  const lowerCasedCustodyAddress = custodyAddress.toLowerCase();

  const response = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${lowerCasedCustodyAddress}&address_types=custody_address`,
    {
      headers: {
        'accept': 'application/json',
        'x-api-key': apiKey
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to lookup FID: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data[lowerCasedCustodyAddress]?.length || !data[lowerCasedCustodyAddress][0].custody_address) {
    throw new Error('No FID found for this custody address');
  }

  return data[lowerCasedCustodyAddress][0].fid;
}

async function loadEnvLocal() {
  try {
    if (fs.existsSync('.env.local')) {
      const { loadLocal } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'loadLocal',
          message: 'Found .env.local, likely created by the install script - would you like to load its values?',
          default: false
        }
      ]);

      if (loadLocal) {
        console.log('Loading values from .env.local...');
        const localEnv = dotenv.parse(fs.readFileSync('.env.local'));
        
        // Copy all values except SEED_PHRASE to .env
        const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') + '\n' : '';
        let newEnvContent = envContent;
        
        for (const [key, value] of Object.entries(localEnv)) {
          if (key !== 'SEED_PHRASE') {
            // Update process.env
            process.env[key] = value;
            // Add to .env content if not already there
            if (!envContent.includes(`${key}=`)) {
              newEnvContent += `${key}="${value}"\n`;
            }
          }
        }
        
        // Write updated content to .env
        fs.writeFileSync('.env', newEnvContent);
        console.log('✅ Values from .env.local have been written to .env');
      }
    }

    // Always try to load SEED_PHRASE from .env.local
    if (fs.existsSync('.env.local')) {
      const localEnv = dotenv.parse(fs.readFileSync('.env.local'));
      if (localEnv.SEED_PHRASE) {
        process.env.SEED_PHRASE = localEnv.SEED_PHRASE;
      }
    }
  } catch (error) {
    // Error reading .env.local, which is fine
    console.log('Note: No .env.local file found');
  }
}



const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

async function validateDomain(domain) {
  const cleanDomain = domain.replace(/^https?:\/\//, '');
  
  if (!cleanDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/)) {
    throw new Error('Invalid domain format');
  }

  return cleanDomain;
}

async function queryNeynarApp(apiKey) {
  if (!apiKey) {
    return null;
  }
  try {
    const response = await fetch(
      `https://api.neynar.com/portal/app_by_api_key`,
      {
        headers: {
          'x-api-key': apiKey
        }
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error querying Neynar app data:', error);
    return null;
  }
}

async function validateSeedPhrase(seedPhrase) {
  try {
    const account = mnemonicToAccount(seedPhrase);
    return account.address;
  } catch (error) {
    throw new Error('Invalid seed phrase');
  }
}

async function generateFarcasterMetadata(domain, fid, accountAddress, seedPhrase, webhookUrl) {
  const header = {
    type: 'custody',
    key: accountAddress,
    fid,
  };
  const encodedHeader = Buffer.from(JSON.stringify(header), 'utf-8').toString('base64');

  const payload = {
    domain
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');

  const account = mnemonicToAccount(seedPhrase);
  const signature = await account.signMessage({ 
    message: `${encodedHeader}.${encodedPayload}`
  });
  const encodedSignature = Buffer.from(signature, 'utf-8').toString('base64url');

  const tags = process.env.NEXT_PUBLIC_FRAME_TAGS?.split(',');

  return {
    accountAssociation: {
      header: encodedHeader,
      payload: encodedPayload,
      signature: encodedSignature
    },
    frame: {
      version: "1",
      name: process.env.NEXT_PUBLIC_FRAME_NAME,
      iconUrl: `https://${domain}/icon.png`,
      homeUrl: `https://${domain}`,
      imageUrl: `https://${domain}/api/opengraph-image`,
      buttonTitle: process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT,
      splashImageUrl: `https://${domain}/splash.png`,
      splashBackgroundColor: "#18122B",
      webhookUrl,
      description: process.env.NEXT_PUBLIC_FRAME_DESCRIPTION,
      primaryCategory: process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY,
      tags,
    },
  };
}

async function main() {
  try {
    console.log('\n📝 Checking environment variables...');
    console.log('Loading values from .env...');
    
    await loadEnvLocal();

    const { domain } = await inquirer.prompt([
      {
        type: 'input',
        name: 'domain',
        message: 'Enter the domain where your mini app will be deployed (e.g., example.com):',
        validate: async (input) => {
          try {
            await validateDomain(input);
            return true;
          } catch (error) {
            return error.message;
          }
        }
      }
    ]);

    const { frameName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'frameName',
        message: 'Enter the name for your mini app (e.g., My Cool Mini App):',
        default: process.env.NEXT_PUBLIC_FRAME_NAME,
        validate: (input) => {
          if (input.trim() === '') {
            return 'Mini app name cannot be empty';
          }
          return true;
        }
      }
    ]);

    const { buttonText } = await inquirer.prompt([
      {
        type: 'input',
        name: 'buttonText',
        message: 'Enter the text for your mini app button:',
        default: process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT || 'Launch Mini App',
        validate: (input) => {
          if (input.trim() === '') {
            return 'Button text cannot be empty';
          }
          return true;
        }
      }
    ]);

    let neynarApiKey = process.env.NEYNAR_API_KEY;
    let neynarClientId = process.env.NEYNAR_CLIENT_ID;
    let useNeynar = true;

    while (useNeynar) {
      if (!neynarApiKey) {
        const { neynarApiKey: inputNeynarApiKey } = await inquirer.prompt([
          {
            type: 'password',
            name: 'neynarApiKey',
            message: 'Enter your Neynar API key (optional - leave blank to skip):',
            default: null
          }
        ]);
        neynarApiKey = inputNeynarApiKey;
      } else {
        console.log('Using existing Neynar API key from .env');
      }

      if (!neynarApiKey) {
        useNeynar = false;
        break;
      }

      const appInfo = await queryNeynarApp(neynarApiKey);
      if (appInfo) {
        neynarClientId = appInfo.app_uuid;
        console.log('Fetched Neynar app client ID');
        break;
      }

      console.log('\n Could not find Neynar app information. The API key may be incorrect.');
      const { retry } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'retry',
          message: 'Would you like to try a different API key?',
          default: true
        }
      ]);

      neynarApiKey = null;
      neynarClientId = null;

      if (!retry) {
        useNeynar = false;
        break;
      }
    }

    let seedPhrase = process.env.SEED_PHRASE;
    if (!seedPhrase) {
      const { seedPhrase: inputSeedPhrase } = await inquirer.prompt([
        {
          type: 'password',
          name: 'seedPhrase',
          message: 'Your farcaster custody account seed phrase is required to create a signature proving this app was created by you.\n' +
          `⚠️ ${yellow}${italic}seed phrase is only used to sign the mini app manifest, then discarded${reset} ⚠️\n` +
          'Seed phrase:',
          validate: async (input) => {
            try {
              await validateSeedPhrase(input);
              return true;
            } catch (error) {
              return error.message;
            }
          }
        }
      ]);
      seedPhrase = inputSeedPhrase;
    } else {
      console.log('Using existing seed phrase from .env');
    }

    const accountAddress = await validateSeedPhrase(seedPhrase);
    console.log('✅ Generated account address from seed phrase');

    const fid = await lookupFidByCustodyAddress(accountAddress, neynarApiKey ?? 'FARCASTER_V2_FRAMES_DEMO');

    console.log('\n🔨 Generating mini app manifest...');
    
    const webhookUrl = neynarApiKey && neynarClientId 
      ? `https://api.neynar.com/f/app/${neynarClientId}/event`
      : `${domain}/api/webhook`;

    const metadata = await generateFarcasterMetadata(domain, fid, accountAddress, seedPhrase, webhookUrl);
    console.log('\nMini app manifest generated' + (seedPhrase ? ' and signed' : ''));

    const envPath = path.join(projectRoot, '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    const newEnvVars = [
      `NEXT_PUBLIC_URL=https://${domain}`,
      `NEXT_PUBLIC_FRAME_NAME="${frameName}"`,
      `NEXT_PUBLIC_FRAME_DESCRIPTION="${process.env.NEXT_PUBLIC_FRAME_DESCRIPTION || ''}"`,
      `NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY="${process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY || ''}"`,
      `NEXT_PUBLIC_FRAME_TAGS="${process.env.NEXT_PUBLIC_FRAME_TAGS || ''}"`,
      `NEXT_PUBLIC_FRAME_BUTTON_TEXT="${buttonText}"`,

      `NEXT_PUBLIC_ANALYTICS_ENABLED="${process.env.NEXT_PUBLIC_ANALYTICS_ENABLED || 'false'}"`,

      ...(process.env.NEYNAR_API_KEY ? 
        [`NEYNAR_API_KEY="${process.env.NEYNAR_API_KEY}"`] : []),
      ...(neynarClientId ? 
        [`NEYNAR_CLIENT_ID="${neynarClientId}"`] : []),

      ...(process.env.FID ? [`FID="${process.env.FID}"`] : []),

      `NEXTAUTH_SECRET="${process.env.NEXTAUTH_SECRET || crypto.randomBytes(32).toString('hex')}"`,
      `NEXTAUTH_URL="https://${domain}"`,

      `FRAME_METADATA=${JSON.stringify(metadata)}`,
    ];

    const validEnvVars = newEnvVars.filter(line => {
      const [, value] = line.split('=');
      return value && value !== '""';
    });

    validEnvVars.forEach(varLine => {
      const [key] = varLine.split('=');
      if (envContent.includes(`${key}=`)) {
        envContent = envContent.replace(new RegExp(`${key}=.*`), varLine);
      } else {
        envContent += `\n${varLine}`;
      }
    });

    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Environment variables updated');

    console.log('\nBuilding Next.js application...');
    const nextBin = path.normalize(path.join(projectRoot, 'node_modules', '.bin', 'next'));
    execSync(`"${nextBin}" build`, { 
      cwd: projectRoot, 
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    console.log('\n✨ Build complete! Your mini app is ready for deployment. 🪐');
    console.log('📝 Make sure to configure the environment variables from .env in your hosting provider');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
