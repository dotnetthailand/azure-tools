import path from 'path';
import fs, { write } from 'fs';
import { promisify } from 'util';
import { stripIndent } from 'common-tags';
import yaml from 'yaml'
import { program } from 'commander';
import { run } from '../libs/utility';
import { ISetDeploySlotSetting } from '../interfaces/ISetDeploySlotSettings';
import { readCsv } from "../libs/csvUtils";
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

interface IAppSetting {
  name: string;
  slotSetting: boolean;
  value: string;
}

const defaultUnicode = 'utf8';
const tmpDir = 'tmp';

program
  .description('An application for set deployment slot settings')
  .option('-f, --file <config>', 'Config file (Default is default.set-deploy-slot.yml')
  .option('-m, --mock', 'Enable mock mode')
  .option('-v, --verbose', 'Enable verbose mode');

program.parse();

const opts = program.opts();
const options = {
  mockMode: opts.mock ? true : false,
  verboseMode: opts.verbose ? true : false,
  file: opts.file ? opts.file : 'default.set-deploy-slot.yml',
}

console.log('Options: ', program.opts());

const generateBashScriptFilename = (name: string) => `${name}.sh`;
const generateSetAppSettingBashScriptFilename = (name: string) => `set_${name}.sh`;
const generateAppSettingsFilename = (name: string) => `appsettings_${name}.json`;

const generateBashScript = (config: ISetDeploySlotSetting) => {
  const setSubscriptionCommand = config?.subscription ? `az account set --subscription "${config?.subscription}"` : 'echo "Using default subscription"';
  const azSlotCommand = config?.slot !== "production" && config?.slot !== undefined ? `--slot ${config?.slot}` : '';
  return stripIndent`
    #!/bin/bash
    echo "[Get] App Settings '${config.name}' from resource group ${config?.resourceGroup}"
    ${setSubscriptionCommand} && az webapp config appsettings list \\
      --name ${config.name} \\
      --resource-group ${config.resourceGroup} \\
      ${azSlotCommand} \\
      > ${path.resolve(tmpDir, generateAppSettingsFilename(config.name))}
    `;
}
  // az webapp config appsettings set -g MyResourceGroup -n MyUniqueApp --settings mySetting=value @moreSettings.json

const generateSetAppSettingBashScript = (config: ISetDeploySlotSetting) => {
  const setSubscriptionCommand = config?.subscription ? `az account set --subscription "${config?.subscription}"` : 'echo "Using default subscription"';
  const azSlotCommand = config?.slot !== "production" && config?.slot !== undefined ? `--slot ${config?.slot}` : '';
  return stripIndent`
    #!/bin/bash
    echo "[Set] '${config.name}' from resource group ${config?.resourceGroup}"
    ${setSubscriptionCommand} && az webapp config appsettings set \\
      --name ${config.name} \\
      --resource-group ${config.resourceGroup} \\
      ${azSlotCommand} \\
      --settings @${path.resolve(tmpDir, generateAppSettingsFilename(config.name))}
    `;
}

async function setDeploySlot(config: ISetDeploySlotSetting) {
  await writeFile(
    path.resolve(tmpDir, generateBashScriptFilename(config.name)),
    generateBashScript(config),
    defaultUnicode);
  await run(`chmod a+x ${path.resolve(tmpDir, generateBashScriptFilename(config.name))}`, options.mockMode);
  // if (!options.mockMode)
  await run(path.resolve(tmpDir, generateBashScriptFilename(config.name)));

  // Replace slotSetting
  let appSettingsJson = JSON.parse(await readFile(
    path.resolve(tmpDir, generateAppSettingsFilename(config.name)),
    defaultUnicode
  )) as IAppSetting[];
  appSettingsJson = appSettingsJson.map( appSetting => ({
    ...appSetting,
    slotSetting: true,
  }));

  await writeFile(
    path.resolve(tmpDir, generateAppSettingsFilename(config.name)),
    JSON.stringify(appSettingsJson, null, 4),
    defaultUnicode
  );

  // Set App Setting
  await writeFile(
    path.resolve(tmpDir, generateSetAppSettingBashScriptFilename(config.name)),
    generateSetAppSettingBashScript(config),
    defaultUnicode);
  await run(`chmod a+x ${path.resolve(tmpDir, generateSetAppSettingBashScriptFilename(config.name))}`, options.mockMode);
  if (!options.mockMode)
    await run(path.resolve(tmpDir, generateSetAppSettingBashScriptFilename(config.name)));
}

async function main() {
  const configFile = await readFile(path.resolve(options.file), defaultUnicode);
  const configs = yaml.parse(configFile) as ISetDeploySlotSetting[];
  if (options.verboseMode) console.log(configs);
  await run(`mkdir -p ${tmpDir}`);
  if (options.mockMode) console.log('Enable mock mode')

  for (const config of configs) {
    if (options.verboseMode) console.log(config);
    console.log(`[Set] '${config.name}' from resource group ${config?.resourceGroup}`)
    setDeploySlot(config);
  }

  let commands = "#!/bin/bash\n";
  for (const config of configs) {
    commands += `${path.resolve(tmpDir, generateSetAppSettingBashScriptFilename(config.name))}\n`;
  }

  await writeFile(path.resolve(tmpDir, 'run-all.sh'), commands, defaultUnicode);
  await run(`chmod a+x ${path.resolve(tmpDir, 'run-all.sh')}`, options.mockMode);
}

main();
