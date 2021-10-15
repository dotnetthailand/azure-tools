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
  name: string;
  resourceGroup: string;
  id: string;
}

