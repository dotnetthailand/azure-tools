package main

import (
  "fmt"
  "log"
)

func main() {
  // repoName := "org/repo-name"
  // token := "GITHUB_ACCESS_TOKEN"

  azureCliPath, err := findAbsolutePathExecutable("az")
  if err != nil {
    log.Fatalf("Cannot found az CLI in $PATH: %v", err)
  }

  subscription := ""
  pipelines := []string{
    fmt.Sprintf("%s login", azureCliPath),
    fmt.Sprintf("%s account set --subscription '%s'", azureCliPath, subscription),
    fmt.Sprintf("%s account show", azureCliPath),
  }

  ExecBatchProcess(pipelines)
}
