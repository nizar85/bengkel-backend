import { AppError } from '../utils/app-error.js';

export const notFound = () => {
  throw AppError.tidakDitemukan('Endpoint');
};
