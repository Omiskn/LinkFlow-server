export type UserDTO = {
  username: string;
  display_name?: string;
  bio?: string;
  profile_image?: string;
};

export type RegisterUserDTO = {
  username: string;
  email: string;
  password: string;
};
