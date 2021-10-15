# Azure to GitHub

## Usage

```
Usage: index [options]

An application for copying publish profiles from Azure App Service to GitHub Secret

Options:
  -f, --file <config>       Config file (Default is secret.config.yml
  -c, --csv-file <CSV Job>  Config file for jobs
  -m, --mock                Enable mock mode
  -r, --remove              Remove all Config in Github Secret
  -v, --verbose             Enable verbose mode
  -h, --help                display help for command
```

## Mode

set secret mode

```sh
yarn dev -f test.config.yml
```

remove secret mode

```sh
yarn dev -f test.config.yml -r
```

## Use CSV file as a job

```
yarn dev -f prod.config.yml -c prod-jobs.csv -m && ./tmp/run-all.sh 
yarn dev -f uat.config.yml -c uat-jobs.csv && ./tmp/run-all.sh 
```

# Bug

- `No support space files`
- az set subscription fail in nodejs subprocess
