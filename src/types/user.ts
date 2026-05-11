export type UserDTO = {
  user_id?: number;
  username: string;
  email: string;
  password: string;
  provider?: string;
  google_id?: string;
  display_name?: string;
  bio?: string;
  profile_image?: string;
  is_verified?: boolean;
  last_login_at?: Date;
  created_at?: Date;
  updated_at?: Date;
};

export type RegisterUserDTO = {
  username: string;
  email: string;
  password: string;
};
