import path from 'path';
import fs, { write } from 'fs';
import { promisify } from 'util';
import { stripIndent } from 'common-tags';
import yaml from 'yaml'
import { program } from 'commander';
import { run } from './libs/utility';
import ISettings, { IJob } from './interfaces/ISettings';
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const defaultUnicode = 'utf8';
const tmpDir = 'tmp';

program
  .description('An application for copying publish profiles from Azure App Service to GitHub Secret')
  .option('-f, --file <directory>', 'Config file (Default is secret.config.yml')
  .option('-m, --mock', 'Enable mock mode')
  .option('-v, --verbose', 'Enable verbose mode');

program.parse();

const opts = program.opts();
const options = {
  mockMode: opts.mock ? true: false,
  verboseMode: opts.verbose ? true: false,
  file: opts.file ? opts.file: 'secret.config.yml',
}

console.log('Options: ', program.opts());

interface IBashScriptParams {
  secretName: string;
  appService: IJob;
}

const generateBashScriptFilename = (secretID: string) => `${secretID}.sh`;
const generateBashScript = ({
  secretName, appService
}: IBashScriptParams) => (
  stripIndent`
    #!/usr/bin/bash
    az webapp deployment list-publishing-profiles \\
      --name ${appService.name} \\
      --resource-group ${appService.resourceGroup} \\
      --xml > ${appService.id}.xml
    gh auth login --with-token < ${path.resolve(tmpDir, 'github-token.txt' )}
    gh auth status
    gh secret set ${secretName} < ${appService.id}.xml
  `
)

// Mock mode is not affect with remote repo.

async function main(){
  const configFile = await readFile(path.resolve(options.file), defaultUnicode);
  const config = yaml.parse(configFile) as ISettings;
  console.log(config)
  const { jobs, prefixSecretName } = config.appServices;
  const { github } = config;
  await run(`mkdir -p ${tmpDir}`);
  await writeFile(path.resolve(tmpDir, 'github-token.txt'),
    github.token, defaultUnicode);

  for (const job of jobs) {
    console.log(job);
    await writeFile(
      path.resolve(tmpDir, generateBashScriptFilename(job.id)),
      generateBashScript({
        secretName: `${prefixSecretName}${job.id}`,
        appService: job
      }),
      defaultUnicode);
      await run(`chmod a+x ${path.resolve(tmpDir, generateBashScriptFilename(job.id))}`, options.mockMode);
      if(!options.mockMode)
        await run(path.resolve(tmpDir, generateBashScriptFilename(job.id)));
  }
}

main();


