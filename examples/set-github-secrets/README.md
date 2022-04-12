# Set GitHub Secrets

## Usage

##  Personal Access Token

Require: `read:org, repo`

## Mode

set secret mode with mock mode

```sh
yarn set-github-secrets -f test.config.yml -m
```

Note: This script has issue to do, please use mock mode everytime.

remove secret mode

```sh
yarn set-github-secrets -f test.config.yml -r
```

## Use CSV file as a job

```
yarn set-github-secrets -f prod.config.yml -c prod.jobs.csv -m && ./tmp/run-all.sh 
yarn set-github-secrets -f uat.config.yml -c uat.jobs.csv -m && ./tmp/run-all.sh 
```

## CLI Options

```
Usage: set-github-secrets [options]

An application for copying publish profiles from Azure App Service to GitHub Secret

Options:
  -f, --file <config>       Config file (Default is secret.config.yml
  -c, --csv-file <CSV Job>  Config file for jobs
  -m, --mock                Enable mock mode
  -r, --remove              Remove all Config in Github Secret
  -v, --verbose             Enable verbose mode
  -h, --help                display help for command
```

## Clean all credential on local

```bash
yarn clean
```
