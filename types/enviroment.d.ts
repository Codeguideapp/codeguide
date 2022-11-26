declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AWS_APP_REGION: string;
      AWS_APP_ACCESS_KEY: string;
      AWS_APP_SECRET_KEY: string;
      CODEGUIDE_DYNAMODB_TABLE: string;
      GITHUB_ID: string;
      GITHUB_SECRET: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
