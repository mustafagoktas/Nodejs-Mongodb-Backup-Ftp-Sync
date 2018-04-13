var Backup = require("./backup.js");
var CronJob = require('cron').CronJob;
new CronJob('* * * * * *',                  // Run  Time (* * * * * *) every second
function() {
  var testClass1 = new Backup({
    user: '',                          // MongoDB username
    pass: '',                         // MongoDB password
    host: '',                        // MongoDB host
    port: '',                       // MongoDB port
    database: '',                  // MongoDB database name
    backupfolder:'',              // Backup Folder Name
    backuplimit:3,               // Old Backup Limit
    ftpusername: "",            // Ftp username
    ftppassword: "",           // Ftp password
    ftphost: "",              // Ftp host
    ftpport: 21,             // Ftp port
    ftpuploadfolder: ""     // Ftp Backup Folder
  });
}, null, true, 'America/Los_Angeles');
