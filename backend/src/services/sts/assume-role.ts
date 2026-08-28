import { fromTemporaryCredentials } from "@aws-sdk/credential-providers";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { logInfo } from "../../utils/logger.js";

/**
 * Obtains temporary credentials via STS AssumeRole when CROSS_ACCOUNT_ROLE_ARN is set.
 * Credentials are never persisted and never returned to the browser.
 */
export class AssumeRoleService {
  private readonly roleArn = process.env.CROSS_ACCOUNT_ROLE_ARN?.trim();
  private readonly externalId = process.env.CROSS_ACCOUNT_EXTERNAL_ID?.trim();
  private readonly sts = new STSClient({});

  isEnabled(): boolean {
    return Boolean(this.roleArn);
  }

  async getCredentials(): Promise<
    | ReturnType<typeof fromTemporaryCredentials>
    | undefined
  > {
    if (!this.roleArn) {
      return undefined;
    }

    logInfo("Assuming cross-account role", { roleArn: this.roleArn });

    return fromTemporaryCredentials({
      params: {
        RoleArn: this.roleArn,
        RoleSessionName: `resourcelens-${Date.now()}`,
        DurationSeconds: 900,
        ...(this.externalId ? { ExternalId: this.externalId } : {}),
      },
      client: this.sts,
    });
  }

  async assumeOnce(): Promise<{
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
  }> {
    if (!this.roleArn) {
      throw new Error("Cross-account role is not configured.");
    }
    const result = await this.sts.send(
      new AssumeRoleCommand({
        RoleArn: this.roleArn,
        RoleSessionName: `resourcelens-${Date.now()}`,
        DurationSeconds: 900,
        ...(this.externalId ? { ExternalId: this.externalId } : {}),
      }),
    );
    const creds = result.Credentials;
    if (!creds?.AccessKeyId || !creds.SecretAccessKey || !creds.SessionToken) {
      throw new Error("AssumeRole did not return temporary credentials.");
    }
    return {
      accessKeyId: creds.AccessKeyId,
      secretAccessKey: creds.SecretAccessKey,
      sessionToken: creds.SessionToken,
    };
  }
}

export const assumeRoleService = new AssumeRoleService();
