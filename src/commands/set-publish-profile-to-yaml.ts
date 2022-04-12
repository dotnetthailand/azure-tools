import path from 'path';
import fs, { write } from 'fs';
import { promisify } from 'util';
import { stripIndent } from 'common-tags';
import yaml from 'yaml'
import { program } from 'commander';
import { run } from '../libs/utility';
import { ISetPublishProfileYaml } from '../interfaces/ISetPublishProfileYaml';
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
  .option('-t, --target <yaml file>', 'target file')
  .option('-m, --mock', 'Enable mock mode')
  .option('-v, --verbose', 'Enable verbose mode');

program.parse();

const opts = program.opts();
const options = {
  mockMode: opts.mock ? true : false,
  verboseMode: opts.verbose ? true : false,
  file: opts.file ? opts.file : 'default.set-deploy-slot.yml',
  target: opts.target ? opts.target : 'target.yml',
}

console.log('Options: ', program.opts());

const generateBashScriptFilename = ({name, slot = ''}: ISetPublishProfileYaml) => `${name}_${slot}.sh`;
const generatePublishProfileFilename = ({name, slot = ''}: ISetPublishProfileYaml) => `appsettings_${name}_${slot}.xml`;

const generateBashScript = (config: ISetPublishProfileYaml) => {
  const setSubscriptionCommand = config?.subscription ? `az account set --subscription "${config?.subscription}"` : 'echo "Using default subscription"';
  const azSlotCommand = config?.slot !== "production" && config?.slot !== undefined ? `--slot ${config?.slot}` : '';
  return stripIndent`
    #!/bin/bash
    echo "[Get] PublishProfile '${config.name}' from resource group ${config.resource_group}"
    ${setSubscriptionCommand} && az webapp deployment list-publishing-profiles \\
      --name ${config.name} \\
      ${azSlotCommand} \\
      --resource-group ${config.resource_group} \\
      --xml > ${path.resolve(tmpDir, generatePublishProfileFilename(config))}
    secret=$(cat ${path.resolve(tmpDir, generatePublishProfileFilename(config))})
    s=$secret yq -i '${config.property_path} = strenv(s)' ${path.resolve(options.target)}
    `;
}


// echo "super secrets" > ${path.resolve(tmpDir, generatePublishProfileFilename(config))}


async function setDeploySlot(config: ISetPublishProfileYaml) {
  await writeFile(
    path.resolve(tmpDir, generateBashScriptFilename(config)),
    generateBashScript(config),
    defaultUnicode);
  await run(`chmod a+x ${path.resolve(tmpDir, generateBashScriptFilename(config))}`, options.mockMode);
  // if (!options.mockMode)
  // await run(path.resolve(tmpDir, generateBashScriptFilename(config)));
}

async function main() {
  const configFile = await readFile(path.resolve(options.file), defaultUnicode);
  const configs = yaml.parse(configFile) as ISetPublishProfileYaml[];
  if (options.verboseMode) console.log(configs);
  await run(`mkdir -p ${tmpDir}`);
  if (options.mockMode) console.log('Enable mock mode')

  for (const config of configs) {
    if (options.verboseMode) console.log(config);
    console.log(`[Set] '${config.name}' from resource group ${config?.resource_group}`)
    setDeploySlot(config);
  }

  let commands = "#!/bin/bash\n";
  for (const config of configs) {
    commands += `${path.resolve(tmpDir, generateBashScriptFilename(config))}\n`;
  }

  await writeFile(path.resolve(tmpDir, 'run-all.sh'), commands, defaultUnicode);
  await run(`chmod a+x ${path.resolve(tmpDir, 'run-all.sh')}`, options.mockMode);
}

main();
