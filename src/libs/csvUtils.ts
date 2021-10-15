// https://csv.js.org/parse/recipes/promises/
const parse = require('csv-parse');
const fs = require('fs');
const { finished } = require('stream/promises');

export async function readCsv(path: string){
  const records :any[] = []
  const parser = fs
  .createReadStream(path)
  .pipe(parse({
    // CSV options if any
  }));
  parser.on('readable', function(){
    let record;
    while (record = parser.read()) {
      // Work with each record
      records.push(record)
    }
  });
  await finished(parser);
  return records
}
