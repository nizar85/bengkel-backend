import bcrypt from 'bcryptjs';

const COST = 10;

export const hashPassword = (password) => bcrypt.hash(password, COST);

export const cocokPassword = (password, hash) => bcrypt.compare(password, hash);
