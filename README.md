# Azure to GitHub

## Available Commands

- [set-github-secrets](examples/set-github-secrets) - An application for copying publish profiles from Azure App Service to GitHub Secret
- [set-deploy-slot](examples/set-deploy-slot) - To set all `slotSetting` of App Setting of Azure App Service to be `true`
- [set-publish-profile-to-yaml](examples/set-publish-profile-to-yaml) - To download publiash profile from App Service and send the setting by particular key to yaml file.

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
