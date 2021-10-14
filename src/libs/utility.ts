const { spawn } = require('promisify-child-process');

export async function run(command: string, slient = false) {
  // try {
    const commandSplits = command.split(' ');
    const spawnCommand = commandSplits[0];
    const spawnArgs = commandSplits.slice(1);
    if(!slient) console.debug(`Executing... ${command}`);
    const childProcess = spawn(spawnCommand , spawnArgs, {encoding: 'utf8', maxBuffer: 200 * 1024} );

    childProcess.stdout.on('data', function (data: any) {
      console.log('stdout: ' + data.toString());
    });

    childProcess.stderr.on('data', function (data: any) {
      console.log('stderr: ' + data.toString());
    });

    childProcess.on('exit', function (code: any) {
      if(!slient) console.log('child process exited with code ' + code);
    });

    const { stdout, stderr, code } = await childProcess;

  // } catch (err) {
  //   console.error(err);
  // };
}
