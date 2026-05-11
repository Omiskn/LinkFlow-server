import bcrypt from "bcrypt";

const BCRYPT_COST = 12;

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, BCRYPT_COST);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
) => {
  return bcrypt.compare(password, hashedPassword);
};
