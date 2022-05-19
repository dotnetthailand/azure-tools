import path from 'path';
import fs, { write } from 'fs';
import { promisify } from 'util';
import { stripIndent } from 'common-tags';
import yaml from 'yaml'
import { program } from 'commander';
import { run } from '../libs/utility';
import { ISwapDeploySlotSettings } from '../interfaces/ISwapDeploySlotSettings';
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

const generateSetAppSettingBashScriptFilename = ({name, slot, target_slot}: ISwapDeploySlotSettings) => `swap_${name}_${slot}_to_${target_slot}.sh`;
// const generateAppSettingsFilename = ({name, source_slot, target_slot}: ISwapDeploySlotSettings) => `appsettings_${name}_${slot}.json`;

const generateSetAppSettingBashScript = (config: ISwapDeploySlotSettings) => {
  const setSubscriptionCommand  = config?.subscription ? `--subscription "${config?.subscription}"` : '';
  // const azSlotCommand = config?.slot !== "production" && config?.slot !== undefined ? `--slot ${config?.slot}` : '';
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

async function swapDeploySlot(config: ISwapDeploySlotSettings) {
  // Set App Setting
  await writeFile(
    path.resolve(tmpDir, generateSetAppSettingBashScriptFilename(config)),
    generateSetAppSettingBashScript(config),
    defaultUnicode);
  await run(`chmod a+x ${path.resolve(tmpDir, generateSetAppSettingBashScriptFilename(config))}`, options.mockMode);
  if (!options.mockMode)
    await run(path.resolve(tmpDir, generateSetAppSettingBashScriptFilename(config)));
}

async function main() {
  const configFile = await readFile(path.resolve(options.file), defaultUnicode);
  const configs = yaml.parse(configFile) as ISwapDeploySlotSettings[];
  if (options.verboseMode) console.log(configs);
  await run(`mkdir -p ${tmpDir}`);
  if (options.mockMode) console.log('Enable mock mode')

  for (const config of configs) {
    if (options.verboseMode) console.log(config);
    console.log(`[Swap] '${config.name}' from resource group ${config?.resourceGroup}`)
    swapDeploySlot(config);
  }

  let commands = "#!/bin/bash\n";
  for (const config of configs) {
    commands += `${path.resolve(tmpDir, generateSetAppSettingBashScriptFilename(config))}\n`;
  }

  await writeFile(path.resolve(tmpDir, 'run-all.sh'), commands, defaultUnicode);
  await run(`chmod a+x ${path.resolve(tmpDir, 'run-all.sh')}`, options.mockMode);
}

main();
