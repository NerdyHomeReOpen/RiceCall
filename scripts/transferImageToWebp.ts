import sharp from 'sharp';
import fs from 'fs';

const transferImageToWebp = async () => {
  await Promise.all(
    fs.readdirSync('./uploads').map(async (file) => {
      if (file.endsWith('.webp') || !file.includes('.')) return;
      console.log(`Transferring ${file} to webp`);
      await sharp(`./uploads/${file}`)
        .webp({ quality: 80 })
        .toFile(`./uploads/${file.split('.')[0]}.webp`);
    }),
  );
  await Promise.all(
    fs.readdirSync('./uploads/serverAvatars').map(async (file) => {
      if (file.endsWith('.webp') || !file.includes('.')) return;
      console.log(`Transferring ${file} to webp`);
      await sharp(`./uploads/serverAvatars/${file}`)
        .webp({ quality: 80 })
        .toFile(`./uploads/serverAvatars/${file.split('.')[0]}.webp`);
    }),
  );
  await Promise.all(
    fs.readdirSync('./uploads/userAvatars').map(async (file) => {
      if (file.endsWith('.webp') || !file.includes('.')) return;
      console.log(`Transferring ${file} to webp`);
      await sharp(`./uploads/userAvatars/${file}`)
        .webp({ quality: 80 })
        .toFile(`./uploads/userAvatars/${file.split('.')[0]}.webp`);
    }),
  );
  console.log('Transferred all images to webp');
};

transferImageToWebp();
