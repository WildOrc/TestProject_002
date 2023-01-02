import { ICommand } from './command.interface';

  export interface IRouter {
  create: ICommand,
  read: ICommand,
  update: ICommand,
  delete: ICommand,
  list: ICommand,
  registration: ICommand,
  login: ICommand,
}


