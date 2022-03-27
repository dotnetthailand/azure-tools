package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
)

func ExecBatchProcess(pipelines []string) {
	bashPath, err := findAbsolutePathExecutable("bash")
	if err != nil {
		log.Fatalf("Cannot found bash in $PATH: %v", err)
	}
	ExecProcess(bashPath, "-c", strings.Join(pipelines, " && "))
}

func ExecProcess(name string, arg ...string) {
	cmd := exec.Command(name, arg...)

	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		log.Fatalf("cmd.Start: %v", err)
	}

	scannerStdout := bufio.NewScanner(stdout)
	for scannerStdout.Scan() {
		fmt.Fprintln(os.Stdout, scannerStdout.Text())
		//fmt.Println(scannerStdout.Text())
	}
	scanner := bufio.NewScanner(stderr)
	for scanner.Scan() {
		fmt.Fprintln(os.Stderr, scanner.Text())
		//fmt.Println(scanner.Text())
	}

	//merged := io.MultiReader(stderr, stdout)
	//scanner := bufio.NewScanner(merged)
	//for scanner.Scan() {
	//  fmt.Println(scanner.Text())
	//}

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
