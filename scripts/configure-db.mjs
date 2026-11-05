import fs from 'node:fs';
const id=process.argv[2];
if(!id||!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))throw Error('Masukkan database_id dari hasil npm run create-db: npm run configure-db -- UUID');
const file=new URL('../wrangler.json',import.meta.url);const c=JSON.parse(fs.readFileSync(file,'utf8'));c.d1_databases[0].database_id=id;fs.writeFileSync(file,JSON.stringify(c,null,2)+'\n');console.log('Database ID disimpan. Tidak ada paket berbayar yang diaktifkan.');
