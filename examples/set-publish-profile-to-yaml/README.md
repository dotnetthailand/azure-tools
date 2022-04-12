# Set publish profile to yaml

To download publiash profile from App Service and send the setting by particular key to yaml.

**Use Case:** 
1. Use [Mozilla SOPS](https://github.com/mozilla/sops) to encrypt the app service publish profil.
2. Use [GitHub Action Get Secrets from Encrypted SOPS](https://github.com/marketplace/actions/get-secrets-from-encrypted-sops) to manage SOPS encrypted files on pipeline.

## Usage

```bash
yarn set-publish-profile-to-yaml -f example.set-publish-profile-to-yaml.yml -o out.yaml -m
./tmp/run-all.sh
```

the result

```yaml
existing:
  my-key: my-value
scope_a:
  app_service:
    app1: secret
    app2: secret
```

The script will modify yaml file 

## CLI Options

```
Usage: set-publish-profile-to-yaml [options]

An application for set deployment slot settings

Options:
  -f, --file <config>       Config file (Default is default.set-deploy-slot.yml
  -t, --target <yaml file>  target file
  -m, --mock                Enable mock mode
  -v, --verbose             Enable verbose mode
  -h, --help                display help for command
```

## Clean all credential on local

```bash
yarn clean
```
