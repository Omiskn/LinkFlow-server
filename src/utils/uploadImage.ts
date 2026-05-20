import sharp from "sharp";
import crypto from "crypto";
import { supabase } from "../config/supabase";

export async function uploadImage(file: Express.Multer.File): Promise<string> {
  const fileName = `${crypto.randomUUID()}.webp`;

  const compressedImage = await sharp(file.buffer)
    .resize(500, 500)
    .webp({
      quality: 80,
    })
    .toBuffer();

  const { error } = await supabase.storage
    .from("profile-images")
    .upload(fileName, compressedImage, {
      contentType: "image/webp",
    });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-images").getPublicUrl(fileName);

  return publicUrl;
}
