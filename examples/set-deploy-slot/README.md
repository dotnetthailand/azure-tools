# Set Deploy Slot

## Usage

To set all `slotSetting` of App Setting of Azure App Service to be `true`

App Setting

```bash
yarn set-deploy-slot -f prod.set-deploy-slot.yml -m
./tmp/run-all.sh
```

## CLI Options

```
Usage: set-deploy-slot [options]

An application for set deployment slot settings

Options:
  -f, --file <config>  Config file (Default is
                       default.set-deploy-slot.yml
  -m, --mock           Enable mock mode
  -v, --verbose        Enable verbose mode
  -h, --help           display help for command
```

## Clean all credential on local

```bash
yarn clean
```
