import fs from 'fs';

const deleteNonWebp = async () => {
  await Promise.all(
    fs.readdirSync('./uploads').map(async (file) => {
      if (file.endsWith('.webp') || !file.includes('.')) return;
      console.log(`Deleting ${file}`);
      fs.unlinkSync(`./uploads/${file}`);
    }),
  );
  await Promise.all(
    fs.readdirSync('./uploads/serverAvatars').map(async (file) => {
      if (file.endsWith('.webp') || !file.includes('.')) return;
      console.log(`Deleting ${file}`);
      fs.unlinkSync(`./uploads/serverAvatars/${file}`);
    }),
  );
  await Promise.all(
    fs.readdirSync('./uploads/userAvatars').map(async (file) => {
      if (file.endsWith('.webp') || !file.includes('.')) return;
      console.log(`Deleting ${file}`);
      fs.unlinkSync(`./uploads/userAvatars/${file}`);
    }),
  );
  console.log('Deleted all non-webp images');
};

deleteNonWebp();
