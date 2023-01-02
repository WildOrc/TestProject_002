import { IField } from './field.interface';

export interface ICommand {
  priority: number | null;
  method: String,
  endpoint: String,
  requiredFields: Array<IField> | null,
  optionalFields: Array<IField> | null,
}