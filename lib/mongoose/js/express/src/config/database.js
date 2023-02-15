import mongoose from 'mongoose';
import logger from './logger';
import { getUserContext } from '../middlewares/userContext.middleware';
const mongoosePaginate = require('mongoose-paginate-v2');

mongoose.plugin((schema) => {
  schema.plugin(mongoosePaginate);
});

mongoose.plugin(function (schema) {
  schema.add({
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  });
  schema.pre('save', async function (next) {
    if (getUserContext()?._id) {
      if (this.isNew) {
        this.createdBy = await getUserContext()?._id;
      }
      this.updatedBy = await getUserContext()?._id;
    }
    next();
  });
});

const database = async () => {
  try {
    // Replace database value in the .env file with your database config url
    const DATABASE =
      process.env.NODE_ENV === 'test'
        ? process.env.DATABASE_TEST
        : process.env.DATABASE;

    await mongoose.connect(DATABASE, {
      useFindAndModify: false,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Connected to the database.');
  } catch (error) {
    logger.error('Could not connect to the database.', error);
  }
};
export default database;
