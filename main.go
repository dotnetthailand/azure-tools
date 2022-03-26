package main

import (
	"bufio"
	"fmt"
	"log"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	// "github.com/spf13/viper"
)

func main() {
	// repoName := "org/repo-name"
	// token := "GITHUB_ACCESS_TOKEN"

	bashPath, err := findAbsolutePathExecutable("bash")
	if err != nil {
		log.Fatalf("Cannot found bash in $PATH: %v", err)
	}

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

	//pipelines := []string{
	//	"echo test",
	//	//"echo 1>&2 here is error; exit 1",
	//	"echo finish;",
	//}
	ExecProcess(bashPath, "-c", strings.Join(pipelines, " && "))
}

func ExecProcess(name string, arg ...string) {
	cmd := exec.Command(name, arg...)
	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		log.Fatalf("cmd.Start: %v", err)
	}

	fmt.Println("Stdout: ")
	scannerStdout := bufio.NewScanner(stdout)
	for scannerStdout.Scan() {
		fmt.Println(scannerStdout.Text())
	}
	scanner := bufio.NewScanner(stderr)
	for scanner.Scan() {
		fmt.Println(scanner.Text())
	}

	// https://stackoverflow.com/a/10385867
	if err := cmd.Wait(); err != nil {
		if exiterr, ok := err.(*exec.ExitError); ok {
			// The program has exited with an exit code != 0

			// This works on both Unix and Windows. Although package
			// syscall is generally platform dependent, WaitStatus is
			// defined for both Unix and Windows and in both cases has
			// an ExitStatus() method with the same signature.
			if status, ok := exiterr.Sys().(syscall.WaitStatus); ok {
				if status.ExitStatus() != 0 {
					log.Fatalf("Exit Status: %d", status.ExitStatus())
				}
			}
		} else {
			log.Fatalf("cmd.Wait: %v", err)
		}
	}
}

// Ref: https://stackoverflow.com/a/63020458
func findAbsolutePathExecutable(command string) (string, error) {
	path, err := exec.LookPath(command)
	if err == nil {
		path, err = filepath.Abs(path)
	}
	return path, err
}
