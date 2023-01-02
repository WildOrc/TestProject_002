import { ISignIn } from '../interfaces/body/auth/signIn.interface';
import { ISignUp } from '../interfaces/body/auth/signUp.interface';

export type TBodyRequest = ISignIn | ISignUp | null | any