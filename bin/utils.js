/* eslint-disable max-len */
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');

exports.addRouteToRouteIndex = (route, lang) => {
  const data = fs.readFileSync(`./src/routes/index.${lang}`).toString().split('\n');

  let processComplete = false;
  data.forEach((item, index) => {
    if (item.includes('return router') && processComplete === false) {
      let newRoute = `  router.use('/${route}', ${route}Route);`;
      if (lang === 'ts') {
        newRoute = `  router.use('/${route}', new ${route}Route().getRoutes());`;
      }

      data.splice(index, 0, newRoute);
      const addNewRoute = data.join('\n');

      fs.writeFileSync(`./src/routes/index.${lang}`, addNewRoute);

      processComplete = true;
    }
  });
};

exports.addImportToRouteIndex = (route, lang) => {
  const data = fs.readFileSync(`./src/routes/index.${lang}`).toString().split('\n');

  let processComplete = false;
  data.forEach((item, index) => {
    if (item.includes('import') && processComplete === false && index !== 0) {
      const newImport = `import ${route}Route from './${route}.route';`;

      data.splice(index, 0, newImport);
      const addNewImport = data.join('\n');

      fs.writeFileSync(`./src/routes/index.${lang}`, addNewImport);

      processComplete = true;
    }
  });
};

exports.generateFile = async (dir, fileName, lang, dbDriver) => {
  const FileName = fileName.charAt(0).toUpperCase() + fileName.slice(1);

  let dirExt = `${dir}.${lang}`;

  //conditonal case for sequelize when generating model
  if (dbDriver === 'sequelize' && dir === 'model') {
    dirExt = `${lang}`;
  }

  let srcCopy;
  let destinationCopy;
  //conditonal case for test folder
  let dirs = dir + 's';
  if (dir.includes('test')) {
    dirs = dir;
    dirExt = `test.${lang}`;

    srcCopy = `./../lib/${dbDriver}/${lang}/express/${dirs}/user.${dirExt}`;
    destinationCopy = `./${dirs}/${fileName}.${dirExt}`;
  } else {
    srcCopy = `./../lib/${dbDriver}/${lang}/express/src/${dirs}/user.${dirExt}`;
    destinationCopy = `./src/${dirs}/${fileName}.${dirExt}`;
  }

  await fs.copy(path.resolve(__dirname, srcCopy), destinationCopy);

  const data = fs.readFileSync(destinationCopy).toString();

  let newData = data.replace(/user/g, fileName);
  newData = newData.replace(/User/g, FileName);

  fs.writeFileSync(destinationCopy, newData);
};

exports.checkLangAndDB = async () => {
  let config = {
    lang: 'js',
    dbDriver: 'mongoose'
  };

  let files = fs.readdirSync('./src/');
  const file = files.find((item) => item.includes('.ts'));
  if (file) {
    config.lang = 'ts';
  }

  let db = null;
  try {
    if (config.lang === 'js') {
      db = await fs.readFile('./src/config/database.js');
    } else {
      db = await fs.readFile('./src/config/database.ts');
    }
    db = db.toString();
  } catch (error) {
    console.log(
      chalk.yellow(`
        Database config not detected in src/config.
        express-api-cli shall assume project default database config uses mongoose. Thank you.      
      `)
    );
  }

  if (db && db.includes('mongoose') && db.includes('sequelize')) {
    console.log(
      chalk.yellow(`
      Application contains more than one DB configuration in src/config/database.js.
      Please use one db configuration or remove unused imports to allow express-api-cli function properly. 

      In the meantime Express-api-cli shall use mongoose database configuration  
      Thank you.      
    `)
    );
  } else {
    if (db && db.includes('sequelize')) {
      config.dbDriver = 'sequelize';
    }
  }

  return config;
};

exports.spinner = ora({
  spinner: 'star2'
});

exports.generateValidatorFromModel = async () => {
  const files = fs.readdirSync('./src/models');
  files.forEach((fileName) => {
    const modelContent = fs.readFileSync('./src/models/' + fileName).toString();
    const moduleName = fileName.split('.')[0];
    let modelSchema = modelContent
      .substring(modelContent.indexOf('Schema(') + 8, modelContent.indexOf('timestamps: true'))
      .split('\n');
    modelSchema.pop();
    modelSchema.pop();
    modelSchema = modelSchema.join('\n');
    if (modelSchema.endsWith(',')) {
      modelSchema = modelSchema.substring(0, modelSchema.length - 1);
    }

    modelSchema = modelSchema.replace(/String/g, '"string"');
    modelSchema = modelSchema.replace(/Number/g, '"number"');
    modelSchema = modelSchema.replace(/Boolean/g, '"boolean"');
    modelSchema = modelSchema.replace(/Date/g, '"date"');
    modelSchema = modelSchema.replace(/Array/g, '"array"');
    modelSchema = modelSchema.replace(/Schema.Types.ObjectId/g, '"objectId"');
    modelSchema = modelSchema.replace(/Schema.Types.Mixed/g, '"mixed"');
    modelSchema = modelSchema.replace(/ObjectId/g, '"objectId"');
    modelSchema = modelSchema.replace(/Mixed/g, '"mixed"');

    modelSchema = eval(`(${modelSchema})`);

    modelSchema = iterateObject(modelSchema);
    let a = {};
    jsonToAjvSchema(modelSchema, a);
    const ajvSchemaStringified = JSON.stringify(a, null, 2);
    // modelSchema = modelSchema.replace(/"string"/g, 'Joi.string()');
    // modelSchema = modelSchema.replace(/"number"/g, 'Joi.number()');
    // modelSchema = modelSchema.replace(/"boolean"/g, 'Joi.boolean()');
    // modelSchema = modelSchema.replace(/"date"/g, 'Joi.date()');
    // modelSchema = modelSchema.replace(/"objectId"/g, 'Joi.objectId()');
    // modelSchema = modelSchema.replace(/"mixed"/g, 'Joi.mixed()');
    // modelSchema = modelSchema.replace(/"array"/g, 'Joi.array()');
    // modelSchema = modelSchema.replace(/"object"/g, 'Joi.object()');

    let validatorContent = fs.readFileSync('./src/validators/user.validator.js').toString();

    validatorContent =
      validatorContent.substring(0, validatorContent.indexOf('const bodySchema') + 19) +
      ajvSchemaStringified +
      ';\n' +
      validatorContent.substring(
        validatorContent.indexOf('// query Schema'),
        validatorContent.length
      );

    fs.writeFileSync(`./src/validators/${moduleName}.validator.js`, validatorContent);
  });
};

// function to iterate through nest object and array
function iterateObject(obj, validationObject) {
  if (typeof obj === 'object') {
    if (typeof obj.type === 'string') {
      return obj.type;
    }
  }
  for (let property in obj) {
    if (obj.hasOwnProperty(property)) {
      if (Array.isArray(obj[property])) {
        obj[property] = obj[property].map((item) => {
          return iterateObject(item, validationObject);
        });
      } else if (typeof obj[property] === 'object') {
        obj[property] = iterateObject(obj[property], validationObject);
      }
    }
  }
  return obj;
}

// json to ajv schema
function jsonToAjvSchema(json, schema) {
  if (typeof json === 'object') {
    if (Array.isArray(json)) {
      schema.type = 'array';
      schema.items = {};
      jsonToAjvSchema(json[0], schema.items);
    } else {
      schema.type = 'object';
      schema.properties = {};
      for (var key in json) {
        schema.properties[key] = {};
        jsonToAjvSchema(json[key], schema.properties[key]);
      }
    }
  } else {
    schema.type = json;
  }
}
