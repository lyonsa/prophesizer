#!/usr/bin/env node
const util = require('util');
const fs = require('fs');
const path = require('path');
const exec = util.promisify(require('child_process').exec);

async function execWithOutput(command) {
	const { stdout, stderr } = await exec(command);
	
	if (stdout.trim().length > 0) console.log(stdout);
  
	if (stderr.trim().length > 0) {
	  console.error(stderr);
  
	  return false;
	}
  
	return true;
  }

(async () => {
	const args = process.argv.slice(2);

	if(args.length < 1)
	{
		console.error('Please run "node schema.js <command> <username (default)> <databasename>"');
		console.error('\tValid commands are "dump" to dump the DB\'s current schema to files, and "load" to load the file schemas into the DB');
		console.error('\tIf <username> is not specified, it defaults to "postgres"');
		console.error('\tIf <database> is not specified, it defaults to "blaseball"');
		process.exit(1);
	}

	const command = args[0];
	const username = (args.length > 1) ? args[1] : 'postgres';
	const database = (args.length > 2) ? args[2] : 'blaseball';

	if(command === 'dump')
	{
		// Dump schema (no data) for all public/raw/xref tables
		if(!await execWithOutput(`pg_dump -U ${username} -d ${database} -c --if-exists -O -s -n "(public|raw|xref)" > schema_clean.sql`)) process.exit(1);
		// Dump schema and data for taxa tables
		if(!await execWithOutput(`pg_dump -U ${username} -d ${database} -c --if-exists -O -n "taxa" > schema_data.sql`)) process.exit(1);
		console.log(`DB schema dumped to schema_clean.sql and schema_data.sql`);
	}
	else if(command === 'load')
	{
		// Load schema from schema_clean first
		if(!await execWithOutput(`psql -U ${username} -d ${database} -f schema_clean.sql`)) process.exit(1);
		// Then load schema from schema_data
		if(!await execWithOutput(`psql -U ${username} -d ${database} -f schema_data.sql`)) process.exit(1);
	}

	process.exit(0);
})();