import path from 'path';
import fs, { write } from 'fs';
import { promisify } from 'util';
import { stripIndent } from 'common-tags';
import yaml from 'yaml'
import { program } from 'commander';
import { run } from '../libs/utility';
import { ISwapDeploySlotSettings } from '../interfaces/ISwapDeploySlotSettings';
import { IAppSetting } from '../interfaces/IAppSetting';
import chalk from 'chalk';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

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

const generateSwapSlotBashScriptFilename = ({name, slot, target_slot}: ISwapDeploySlotSettings) => `swap_${name}_${slot}_to_${target_slot}.sh`;
const generateGetAppSettingsBashScriptFilename = (name : string, slot: string) => `${name}_${slot}.sh`;
const generateAppSettingsFilename = (name : string, slot: string) => `appsettings_${name}_${slot}.json`;

const generateGetAppSettingsBashScript = (config: ISwapDeploySlotSettings, slot: string) => {
  const setSubscriptionCommand  = config?.subscription ? `--subscription "${config?.subscription}"` : '';
  const azSlotCommand = slot !== "production" && slot !== undefined ? `--slot ${slot}` : '';
  return stripIndent`
    #!/bin/bash
    echo "[Get] App Settings '${config.name}' from resource group ${config?.resourceGroup}"
    az webapp config appsettings list \\
      --name ${config.name} \\
      --resource-group ${config.resourceGroup} \\
      ${azSlotCommand} \\
      ${setSubscriptionCommand} \\
      > ${path.resolve(tmpDir, generateAppSettingsFilename(config.name, slot))}
    `;
}

const generateSwapSlotBashScript = (config: ISwapDeploySlotSettings) => {
  const setSubscriptionCommand  = config?.subscription ? `--subscription "${config?.subscription}"` : '';
  return stripIndent`
    #!/bin/bash
    echo "[Swap] '${config.name}' from resource group ${config?.resourceGroup}"
    az webapp deployment slot swap \\
      --name ${config.name} \\
      --resource-group ${config.resourceGroup} \\
      --slot ${config.slot} \\
      --target-slot  ${config.target_slot} \\
      ${setSubscriptionCommand}
    `;
}

async function _getSlotSetting(config: ISwapDeploySlotSettings, slot: string){
   await writeFile(
    path.resolve(tmpDir, generateGetAppSettingsBashScriptFilename(config.name, slot)),
    generateGetAppSettingsBashScript(config, slot),
    defaultUnicode);
  await run(`chmod a+x ${path.resolve(tmpDir, generateGetAppSettingsBashScriptFilename(config.name, slot))}`, true);
  await run(path.resolve(tmpDir, generateGetAppSettingsBashScriptFilename(config.name, slot)), true);
  let appSettingsJson = JSON.parse(await readFile(
    path.resolve(tmpDir, generateAppSettingsFilename(config.name, slot)),
    defaultUnicode
  )) as IAppSetting[];
  for(const appSetting of appSettingsJson){
    // console.log(typeof appSetting.slotSetting)
    if(appSetting.slotSetting == false)
      console.log(chalk.red(`${config.name}: ${appSetting.name} => slotSetting = ${appSetting.slotSetting}`))
  }
}

async function swapDeploySlot(config: ISwapDeploySlotSettings) {
  // Gen Swapp Slot
  await writeFile(
    path.resolve(tmpDir, generateSwapSlotBashScriptFilename(config)),
    generateSwapSlotBashScript(config),
    defaultUnicode);
  await run(`chmod a+x ${path.resolve(tmpDir, generateSwapSlotBashScriptFilename(config))}`, options.mockMode);

  // Get app setting of slot
  await _getSlotSetting(config, config.slot);
  await _getSlotSetting(config, config.target_slot);

  if (!options.mockMode)
    await run(path.resolve(tmpDir, generateSwapSlotBashScriptFilename(config)));
}

async function main() {
  const configFile = await readFile(path.resolve(options.file), defaultUnicode);
  const configs = yaml.parse(configFile) as ISwapDeploySlotSettings[];
  if (options.verboseMode) console.log(configs);
  await run(`mkdir -p ${tmpDir}`);
  if (options.mockMode) console.log('Enable mock mode')

  for (const config of configs) {
    if (options.verboseMode) console.log(config);
    console.log(chalk.blue(`[Swap] '${config.name}' from resource group ${config?.resourceGroup}`))
    swapDeploySlot(config);
  }

  let commands = "#!/bin/bash\n";
  for (const config of configs) {
    commands += `${path.resolve(tmpDir, generateSwapSlotBashScriptFilename(config))}\n`;
  }

  await writeFile(path.resolve(tmpDir, 'run-all.sh'), commands, defaultUnicode);
  await run(`chmod a+x ${path.resolve(tmpDir, 'run-all.sh')}`, options.mockMode);
}

main();
