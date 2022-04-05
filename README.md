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

##  Personal Access Token

Require: `read:org, repo`


## Mode

set secret mode

```sh
yarn set-github-secrets -f test.config.yml
```

remove secret mode

```sh
yarn set-github-secrets -f test.config.yml -r
```

## Use CSV file as a job

```
yarn set-github-secrets -f prod.config.yml -c prod.jobs.csv -m && ./tmp/run-all.sh 
yarn set-github-secrets -f uat.config.yml -c uat.jobs.csv -m && ./tmp/run-all.sh 
```

## Convert from JSON to CSV and Yaml

```
dasel -r json -w yaml < deploy.json > jobs.yml
```

# Bug

- `No support space files`
- az set subscription fail in nodejs subprocess

# Todo

- [X] change deployment slot from Blank string to `production`
- [ ] Migrate to Go Lang (v2 in `develop` branch)
- [ ] Add Test
