// Environment variable validation
export function validateEnv() {
  const requiredEnvVars = [
    'MONGODB_URI',
    'MONGODB_DB_NAME',
    'NEXT_PUBLIC_PRIVY_APP_ID',
    'PRIVY_APP_SECRET',
    'NEXT_PUBLIC_SOLANA_RPC_URL',
    'NEXTAUTH_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }
}

// Call validation on import
validateEnv();