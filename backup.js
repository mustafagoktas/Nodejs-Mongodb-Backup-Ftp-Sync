var fs = require('fs');
var exec = require('exec-then')
var mongoose = require('mongoose');
const { join } = require('path');
var ftp = require("basic-ftp");

function Backup(dbOptions ) {
    this.dbOptions=dbOptions;
    console.log("-".repeat(100)); 
    console.log("Backup DB : "+dbOptions.database);
    console.log("-".repeat(100));        
    this.run();    
}

Backup.prototype.backupControl = function () {
  const isDirectory = source => fs.lstatSync(source).isDirectory()
  const getDirectories = source => fs.readdirSync(source)
  .map(name => join(source, name))
  .filter(isDirectory)
  .map(function(v) { return { name:v, time:fs.statSync( v).mtime.getTime() };})
  .sort(function(a, b) { return a.time - b.time; })
  .map(function(v) { return v.name; })
  var directories = getDirectories(this.dbOptions.backupfolder);
  if (directories.length>this.dbOptions.backuplimit) {
    for (let index = 0; index < directories.length; index++) {
        if (index< directories.length-this.dbOptions.backuplimit) {
          console.log(directories[index]+" ←");          
          exec('rm -Rf '+directories[index]);
          this.deleteftp(directories[index]);
        }        
    }
  }
}

Backup.prototype.uploadftp = async function (backuppatch) {
  console.log("Uploading Ftp");
  const client = new ftp.Client()
  try {
      await client.connect(this.dbOptions.ftphost, this.dbOptions.ftpport)      
      await client.login(this.dbOptions.ftpusername, this.dbOptions.ftppassword)
      await client.useDefaultSettings();      
      await client.ensureDir(this.dbOptions.ftpuploadfolder+"/"+backuppatch);      
      await client.uploadDir(backuppatch),
      console.log("Ftp Backup Completed √");            
  }
  catch(err) { console.log(err) }
  client.close()
}
Backup.prototype.deleteftp = async function (backuppatch) {
  console.log("Deleting Old Backups");
  const client = new ftp.Client()
  try {
    await client.connect(this.dbOptions.ftphost, this.dbOptions.ftpport)      
    await client.login(this.dbOptions.ftpusername, this.dbOptions.ftppassword)
    await client.useDefaultSettings()            
    await client.removeDir(this.dbOptions.ftpuploadfolder+"/"+backuppatch);      
    console.log("Ftp Delete Completed √");            
  }
  catch(err) { console.log(err) }
  client.close()
}

Backup.prototype.exportdb = async function (backuppatch) {
  db=this.dbOptions;
  var conn = await mongoose.createConnection('mongodb://'+db.user+':'+db.pass+'@'+db.host+':'+db.port+'/'+db.database+'');
  var names= await conn.db.listCollections().toArray();   
  console.log("Get List Collections");  
  for (let index = 0; index < names.length; index++) {
    const element = names[index];
    await exec(" mongoexport -h "+db.host+":"+db.port+" -d "+db.database+" -c "+element.name+"  -u "+db.user+" -p "+db.pass+" -o "+backuppatch+"/"+element.name+".json ", function (error, stdout, stderr) {})
    .then(()=> {
      console.log(element.name+" √"); 
      if (index==names.length-1) {
        console.log("Local Backup Completed √");          
        this.uploadftp(backuppatch);
      }        
    });          
  } 
}
Backup.prototype.run = async function (callback) {
  var date = new Date();
  var backuppatch=  this.dbOptions.backupfolder+"/"+date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()+'-' + date.getHours()+'-' + date.getMinutes();
  if (!fs.existsSync(backuppatch)){ fs.mkdirSync(backuppatch); }
  await this.exportdb(backuppatch)
  this.backupControl();    
};

module.exports = Backup;