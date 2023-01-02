import { argv } from 'node:process';
import axios from 'axios';
import { TBodyRequest } from './types/body.request.type';
import config from './config';
import { IRouter } from './interfaces/api/router.interface';
import { ICommand } from './interfaces/api/command.interface';

const router: IRouter = {
  create: {
    priority: null,
    method: 'POST',
    endpoint: `cars`,
    requiredFields: [
      { brand: 'string' },
      { model: 'string' },
      { year: 'number' },
      { price: 'number' },
    ],
    optionalFields: null,
  },
  read: {
    priority: null,
    method: 'GET',
    endpoint: `cars/:id`,
    requiredFields: [{ id: 'string' }],
    optionalFields: null,
  },
  update: {
    priority: null,
    method: 'PATCH',
    endpoint: `cars/:id`,
    requiredFields: [{ id: 'string' }],
    optionalFields: [
      { brand: 'string' },
      { model: 'string' },
      { year: 'number' },
      { price: 'number' },
    ],
  },
  delete: {
    priority: null,
    method: 'DELETE',
    endpoint: `cars/:id`,
    requiredFields: [{ id: 'string' }],
    optionalFields: null,
  },
  list: {
    priority: null,
    method: 'GET',
    endpoint: `cars`,
    requiredFields: null,
    optionalFields: null,
  },
  registration: {
    priority: 0,
    method: 'POST',
    endpoint: `auth/registration`,
    requiredFields: [
      { firstName: 'string' },
      { lastName: 'string' },
      { email: 'string' },
      { phoneNumber: 'string' },
      { login: 'string' },
      { password: 'string' },
    ],
    optionalFields: null,
  },
  login: {
    priority: 1,
    method: 'POST',
    endpoint: `auth/login`,
    requiredFields: [
      { login: 'string' },
      { password: 'string' },
    ],
    optionalFields: null,
  },
};
const actions: Array<String> = Object.keys(router);
const requiredKeys: Array<String> = [
  'action',
];
let accessToken: String | null = null;

(async () => main())();

async function main (): Promise<void> {
  try {
    const commands = parseArgs();

    if (!Object.keys(commands).length) {
      console.info('Application finished');
      return;
    }

    let result = await commandProcessing(commands);

    printResult(result);

  } catch (e: any) {
    console.log(e.message);

    throw new Error(e.message);
  }
}

async function commandProcessing (commands) {
  let result;

  for (const priority of Object.keys(commands)) {
    const { requiredFields, body, ...requestData } = commands[`${ priority }`];
    const options: any = {};


    options[`method`] = requestData.method;

    if (accessToken) {
      options['headers'] = { 'Authorization': `bearer: ${ accessToken }` };
    }

    try {
      const { data } = await request(body, options, requestData.endpoint);

      if (Number(priority) === 1) {
        accessToken = data;
        continue;
      }

      result = data;

      if (Number(priority) === 0) {
        console.log('Registration successful');
        break;
      }

    } catch (e: any) {
      console.error(e);

      throw new Error('Error!');
    }
  }

  return result;
}

function parseArgs (): Array<object> {
  const availableKeys: Array<string> = [];
  let keyList = {};

  if (argv.length >= 3) {
    argv.splice(0, 2);

    argv.forEach(elem => {
      const parsedArr = elem.split(':');
      if (parsedArr.length === 2) {
        availableKeys.push(parsedArr[0]);

        let parsedKey = parsedArr[0];

        if (parsedKey === 'action') {
          parsedKey = parsedArr[1];

          if (!actions.includes(parsedKey)) {
            throw new Error(`Action '${ parsedKey }' not available`);
          }
        }

        if (Object.hasOwn(keyList, parsedKey)) {
          throw new Error(`Duplicate key detected: '${ parsedKey }'`);
        }
        keyList[parsedKey] = parsedArr[1];
      }
    });
  }

  const missingRequiredFields: Array<String> = checkRequiredKeys(availableKeys, requiredKeys);

  if (missingRequiredFields?.length) {
    throw new Error(`Required fields not found: ${ missingRequiredFields.join(', ') }`);
  }

  return buildConsoleCommands(keyList);
}

function checkRequiredKeys (keyList: Array<String>, requiredKeys: Array<String>): Array<String> {
  return requiredKeys.filter(key => !keyList.includes(key));
}

async function request (data: TBodyRequest, opt: any, endpoint: String = ''): Promise<any> {
  const { id, ...body } = data;
  const url = buildUrlRequest(id, endpoint);
  const options = {
    url,
    ...opt,
  };

  if (body) {
    options['data'] = { ...body };
  }

  try {
    return axios(options);
  } catch (e) {
    // console.error(e);

    throw new Error('Ooops, something happened');
  }
}

function buildConsoleCommands (keyList: any) {
  const consoleCommands: any = {};
  let availablePriority: number = 2;

  for (const key of Object.keys(keyList)) {
    if (actions.includes(key)) {
      const routeDetails: ICommand = router[key];
      const { method, endpoint, requiredFields, optionalFields } = routeDetails;
      let { priority } = routeDetails;

      if (!priority) {
        priority = availablePriority;
      }

      if (Object.hasOwn(consoleCommands, priority)) {
        priority++;
        availablePriority++;
      }

      consoleCommands[priority] = {
        body: {},
      };
      consoleCommands[priority].requiredFields = null;
      consoleCommands[priority].optionalFields = null;

      if (requiredFields?.length) {
        const bodyWithRequiredFields = buildBodyForCommand(requiredFields, keyList);
        consoleCommands[priority].optionalFields = Object.keys(bodyWithRequiredFields);

        consoleCommands[priority].body = {
          ...consoleCommands[priority].body,
          ...bodyWithRequiredFields,
        };
      }

      if (optionalFields?.length) {
        const bodyWithOptionalFields = buildBodyForCommand(optionalFields, keyList);
        consoleCommands[priority].optionalFields = Object.keys(bodyWithOptionalFields);

        consoleCommands[priority].body = {
          ...consoleCommands[priority].body,
          ...bodyWithOptionalFields,
        };
      }

      consoleCommands[priority].method = method;
      consoleCommands[priority].endpoint = endpoint;
      // consoleCommands[priority][key] = parsedValue;
    }
  }

  return consoleCommands;
}

function buildBodyForCommand (fields: Array<any>, keyList: any) {
  const body = {};

  fields.forEach(obj => {
    const field = Object.keys(obj)[0];

    if (!!keyList[field]) {
      switch (obj[field]) {
        case 'number':
          body[field] = +keyList[field];
          break;

        default:
          body[field] = keyList[field];
      }
    }
  });
  return body;
}

function buildUrlRequest (id: String, endpoint: String): String {
  const { SERVER_URL, PORT } = config.app;
  const urlTailWithId = ':id';

  if (endpoint.endsWith(urlTailWithId) && !!id) {
    endpoint = endpoint.replace(urlTailWithId, id.toString());
  }

  const url = `http://${ SERVER_URL }:${ PORT }/v1/${ endpoint }`;

  return url;
}

function printResult (result): void {
  console.log(`--------------------------- RESPONSE ---------------------------`);
  console.log(JSON.stringify({ ...result }, null, 2));
  console.log(`--------------------------- THE  END ---------------------------`);
}