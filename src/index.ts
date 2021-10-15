import path from 'path';
import fs, { write } from 'fs';
import { promisify } from 'util';
import { stripIndent } from 'common-tags';
import yaml from 'yaml'
import { program } from 'commander';
import { run } from './libs/utility';
import ISettings, { IJob } from './interfaces/ISettings';
import { readCsv } from "./libs/csvUtils";
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const ACTION = {
  REMOVE: 'REMOVE',
  SET: 'SET'
}

const defaultUnicode = 'utf8';
const tmpDir = 'tmp';

program
  .description('An application for copying publish profiles from Azure App Service to GitHub Secret')
  .option('-f, --file <config>', 'Config file (Default is secret.config.yml')
  .option('-c, --csv-file <CSV Job>', 'Config file for jobs')
  .option('-m, --mock', 'Enable mock mode')
  .option('-r, --remove', 'Remove all Config in Github Secret')
  .option('-v, --verbose', 'Enable verbose mode');

program.parse();

const opts = program.opts();
const options = {
  mockMode: opts.mock ? true : false,
  verboseMode: opts.verbose ? true : false,
  file: opts.file ? opts.file : 'secret.config.yml',
  csvFile: opts.csvFile ? opts.csvFile : 'NO_IMPORT_CSV',
  action: opts.remove ? ACTION.REMOVE : ACTION.SET,
}

console.log('Options: ', program.opts());

interface IBashScriptParams {
  repoName: string;
  secretName: string;
  appService?: IJob;
}

// Mock mode is not affect with remote repo.

// There are two mode: set secret and remove secret
const generateSetSecretBashScriptFilename = (secretID: string) => `${secretID}.sh`;
const generateSetSecretBashScript = ({
  secretName, appService, repoName
}: IBashScriptParams) => {
  const setSubscriptionCommand = appService?.subscription ? `az account set --subscription "${appService?.subscription}"` : 'echo "Using default subscription"';
  const azSlotCommand = appService?.slot ? `--slot ${appService?.slot}` : '';
  return stripIndent`
    #!/usr/bin/bash
    echo "[Set] '${secretName}' from ${appService?.resourceGroup}/${appService?.name}"
    ${setSubscriptionCommand} && az webapp deployment list-publishing-profiles \\
      --name ${appService?.name} \\
      ${azSlotCommand} \\
      --resource-group ${appService?.resourceGroup} \\
      --xml > ${path.resolve(tmpDir, `${appService?.id}.xml`)}
    gh auth login --with-token < ${path.resolve(tmpDir, 'github-token.txt')}
    gh secret set ${secretName} --repo="${repoName}" < ${path.resolve(tmpDir, `${appService?.id}.xml`)}
    `;
};

async function setSecretMode(secretName: string, job: IJob, config: ISettings) {
  await writeFile(
    path.resolve(tmpDir, generateSetSecretBashScriptFilename(job.id)),
    generateSetSecretBashScript({
      repoName: config.github.repoName,
      secretName,
      appService: job
    }),
    defaultUnicode);
  await run(`chmod a+x ${path.resolve(tmpDir, generateSetSecretBashScriptFilename(job.id))}`, options.mockMode);
  if (!options.mockMode)
    await run(path.resolve(tmpDir, generateSetSecretBashScriptFilename(job.id)));
}

async function removeSecretMode(secretName: string, job: IJob, config: ISettings) {
  const generateBashScriptFilename = (secretID: string) => `${secretID}.sh`;
  const generateBashScript = ({
    secretName, repoName
  }: IBashScriptParams) => (
    stripIndent`
      #!/usr/bin/bash
      gh auth login --with-token < ${path.resolve(tmpDir, 'github-token.txt')}
      gh secret remove ${secretName} --repo="${repoName}"
    `
  );

  await writeFile(
    path.resolve(tmpDir, generateBashScriptFilename(job.id)),
    generateBashScript({
      repoName: config.github.repoName,
      secretName
    }),
    defaultUnicode);
  await run(`chmod a+x ${path.resolve(tmpDir, generateBashScriptFilename(job.id))}`, options.mockMode);
  if (!options.mockMode)
    await run(path.resolve(tmpDir, generateBashScriptFilename(job.id)));
}

async function main() {
  const configFile = await readFile(path.resolve(options.file), defaultUnicode);
  const config = yaml.parse(configFile) as ISettings;
  if (options.verboseMode) console.log(config);
  const { jobs = [], prefixSecretName, environment } = config.appServices;
  const { github } = config;
  await run(`mkdir -p ${tmpDir}`);
  await writeFile(path.resolve(tmpDir, 'github-token.txt'),
    github.token, defaultUnicode);
  if (options.mockMode) console.log('Enable mock mode')
  if (options.action === ACTION.SET) {
    console.log(`Start set secret mode at target repo "${config.github.repoName}"`)
  } else {
    console.log(`Start remove secret mode at target repo "${config.github.repoName}"`)
  }

  // Import CSV as a job
  if (options.csvFile !== 'NO_IMPORT_CSV') {
    const records = await readCsv(options.csvFile);
    records.shift();
    if (options.verboseMode) console.log(records);
    records.forEach((rawRecord: string[]) => {
      const job: IJob = {
        id: rawRecord[0],
        name: rawRecord[1],
        resourceGroup: rawRecord[2],
        subscription: rawRecord[3],
        slot: rawRecord[4],
      };
      jobs.push(job);
    });
  }

  for (const job of jobs) {
    if (options.verboseMode) console.log(job);
    const envName = environment && environment !== '' ? `${environment}_` : '';
    const secretName = `${prefixSecretName}_${envName}${job.id}`;
    if (options.action === ACTION.SET) {
      console.log(`[Set] '${secretName}' from ${job.resourceGroup} / ${job.name}`);
      setSecretMode(secretName, job, config);
    } else {
      // Remove Mode
      console.log(`[Remove] '${secretName}' from ${job.resourceGroup} / ${job.name}`);
      removeSecretMode(secretName, job, config);
    }
  }

  let commands = "#!/usr/bin/bash\n";
  for (const job of jobs) {
    commands += `${path.resolve(tmpDir, generateSetSecretBashScriptFilename(job.id))}\n`;
  }

  await writeFile(path.resolve(tmpDir, 'run-all.sh'), commands, defaultUnicode);
  await run(`chmod a+x ${path.resolve(tmpDir, 'run-all.sh')}`, options.mockMode);
}

console.log('Please make sure you run: `az login` Before run script')

main();


