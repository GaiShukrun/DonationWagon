const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gridFSBucket;

// Initialize GridFS bucket
const initGridFS = (db) => {
  gridFSBucket = new GridFSBucket(db, {
    bucketName: 'profileImages'
  });
  return gridFSBucket;
};

// Get the GridFS bucket instance
const getGridFSBucket = () => {
  if (!gridFSBucket) {
    const db = mongoose.connection.db;
    return initGridFS(db);
  }
  return gridFSBucket;
};

module.exports = {
  initGridFS,
  getGridFSBucket
};
