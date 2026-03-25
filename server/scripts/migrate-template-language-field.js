require('dotenv').config();
const mongoose = require('mongoose');

const FALLBACK_LANGUAGE = 'en_US';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const collection = mongoose.connection.db.collection('templates');

  const result = await collection.updateMany(
    { language: { $exists: true } },
    [
      {
        $set: {
          localeCode: {
            $cond: [
              {
                $and: [
                  { $ne: ['$localeCode', null] },
                  { $ne: ['$localeCode', ''] },
                ],
              },
              '$localeCode',
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$language', null] },
                      { $ne: ['$language', ''] },
                    ],
                  },
                  '$language',
                  FALLBACK_LANGUAGE,
                ],
              },
            ],
          },
        },
      },
      {
        $unset: 'language',
      },
    ]
  );

  console.log(`Matched ${result.matchedCount} template(s), modified ${result.modifiedCount} template(s).`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Template language migration failed:', error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
