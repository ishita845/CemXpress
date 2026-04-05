export const uploadImage = async (file: File) => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "cemxpress_upload"); // your preset name

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dz0tujmyz/image/upload",
    {
      method: "POST",
      body: data,
    }
  );

  const result = await res.json();
  return result.secure_url;
};