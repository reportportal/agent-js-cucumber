const fs = require('fs');
const path = require('path');
const { When } = require('cucumber');

When('I report attachment with type {string} and {string}', function(type, filePath, callback) {
  fs.readFile(path.resolve(__dirname, '../files', filePath), (err, data) => {
    if (err) {
      throw err;
    }
    this.attach(
      JSON.stringify({
        message: `Attachment with ${type}`,
        level: 'INFO',
        data: data.toString('base64'),
      }),
      type,
    );
    callback();
  });
});
