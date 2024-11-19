import { z } from "zod";

const Genders = ["Male", "Female"] as const;

export const userRegisterData = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3),
  birthDate: z.string(),
  gender: z.enum(Genders),
  preferredGenders: z.array(z.enum(Genders)),
  interests: z.array(z.string()),
});

export type userRegisterDataType = z.infer<typeof userRegisterData>;
