const mongoose = require('mongoose');

const uri = 'mongodb+srv://chetanmhaske451_db_user:oQy2t61GX4dgH5m8@nexpay-cluster.vzmfozn.mongodb.net/nexpay?appName=nexpay-cluster';

mongoose.connect(uri)
  .then(() => {
    console.log("SUCCESS");
    process.exit(0);
  })
  .catch(err => {
    console.error("FAIL", err.message);
    process.exit(1);
  });
