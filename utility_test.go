package main

import (
	"github.com/stretchr/testify/assert"
	// read more: http://craigwickesser.com/2015/01/capture-stdout-in-go/
	// https://rodaine.com/2015/04/async-split-io-reader-in-golang/
	"github.com/zenizh/go-capturer"
	"testing"
)

// Test with Single command Stderr or Stdout

func TestExecBatchProcess_CanPrint_SingleStderr(t *testing.T) {
	// Arrange
	assert := assert.New(t)
	pipelines := []string{
		"echo 1>&2 \"Print Stderr\"",
	}
	// Act
	actual := capturer.CaptureStderr(func() {
		ExecBatchProcess(pipelines)
	})
	// Assert
	assert.Equal("Print Stderr\n", actual)
}

func TestExecBatchProcess_CanPrint_SingleStdout(t *testing.T) {
	// Arrange
	assert := assert.New(t)
	pipelines := []string{
		"echo \"Print Stdout\"",
	}
	// Act
	actual := capturer.CaptureStdout(func() {
		ExecBatchProcess(pipelines)
	})
	// Assert
	assert.Equal("Print Stdout\n", actual)
}

// Test with Two commands of Stderr or Stdout

func TestExecBatchProcess_CanPrint_ManyStderr(t *testing.T) {
	// Arrange
	assert := assert.New(t)
	pipelines := []string{
		"echo 1>&2 \"Print Stderr 1\"",
		"echo 1>&2 \"Print Stderr 2\"",
	}
	// Act
	actual := capturer.CaptureStderr(func() {
		ExecBatchProcess(pipelines)
	})
	// Assert
	assert.Equal("Print Stderr 1\nPrint Stderr 2\n", actual)
}

func TestExecBatchProcess_CanPrint_ManyStdout(t *testing.T) {
	// Arrange
	assert := assert.New(t)
	pipelines := []string{
		"echo \"Print Stdout 1\"",
		"echo \"Print Stdout 2\"",
	}
	// Act
	actual := capturer.CaptureStdout(func() {
		ExecBatchProcess(pipelines)
	})
	// Assert
	assert.Equal("Print Stdout 1\nPrint Stdout 2\n", actual)
}

// Test with mix stdout & stderr

/*
This case (`TestExecBatchProcess_CanPrint_StdoutStderr`) will error,
because
1. `ExecBatchProcess` print the stdout and stderr synchronously
2. `capturer.CaptureOutput` also capture output synchronously

TODO: Both function should operate in asynchronous way, and the output of the command lines should be in same order of execution order.

Remaining Testcase:

pipelines := []string{
  "echo 1>&2 \"Print Stderr 1\"",
  "echo \"Print Stdout 2\"",
  "echo 1>&2 \"Print Stderr 3 and Exit\"; exit 5",
  "echo finish;",
}
ExecBatchProcess(pipelines)

The output:
-------------
Print Stdout 2
Print Stderr 1
Print Stderr 3 and Exit
2022/03/27 20:12:24 Exit Status: 5

The expected output:
----------------------
Print Stderr 1
Print Stdout 2
Print Stderr 3 and Exit
2022/03/27 20:12:24 Exit Status: 5

Explanation: The output of the command lines should be in same order of execution order.
*/

func TestExecBatchProcess_CanPrint_StdoutStderr(t *testing.T) {
	// Arrange
	assert := assert.New(t)
	pipelines := []string{
		"echo 1>&2 \"Print Stderr\"",
		"echo \"Print Stdout\"",
	}
	// Act
	actual := capturer.CaptureOutput(func() {
		ExecBatchProcess(pipelines)
	})
	// Assert
	assert.Equal("Print Stderr\nPrint Stdout\n", actual)
}
