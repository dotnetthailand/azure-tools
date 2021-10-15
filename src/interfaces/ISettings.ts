export default interface ISettings {
  debug?: boolean;
  github: IGithubSettings;
  appServices: {
    prefixSecretName?: string;
    environment?: string;
    jobs: IJob[];
  }
}

export interface IGithubSettings {
  repoName: string;
  token: string;
}

export interface IJob {
  id: string;
  name: string;
  resourceGroup: string;
  // empty mean use default subscription
  subscription?: string;
  // empty mean use default deployment slot
  slot?: string;
}

