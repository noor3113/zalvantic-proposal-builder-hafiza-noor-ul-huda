const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('../models/Package');
const AddOn = require('../models/AddOn');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Package.deleteMany({});
  await AddOn.deleteMany({});

  const [webStarter, webBusiness, brandKit, socialPack] = await Package.insertMany([
    { name: 'Web Development - Starter', basePrice: 500, currency: 'USD', includes: ['5 pages', 'Contact form', 'Mobile friendly'] },
    { name: 'Web Development - Business', basePrice: 1200, currency: 'USD', includes: ['10 pages', 'Admin panel', 'Basic analytics'] },
    { name: 'Graphic Design - Brand Kit', basePrice: 400, currency: 'USD', includes: ['Logo', 'Colour palette', 'Fonts guide'] },
    { name: 'Graphic Design - Social Media Pack', basePrice: 250, currency: 'USD', includes: ['10 post templates', 'Profile and cover images'] },
  ]);

  await AddOn.insertMany([
    { name: 'SEO setup', price: 150, appliesTo: [webStarter._id, webBusiness._id] },
    { name: 'Extra revision round', price: 80, appliesTo: [webStarter._id, webBusiness._id, brandKit._id, socialPack._id] },
    { name: 'Logo animation', price: 120, appliesTo: [brandKit._id] },
  ]);

  console.log('Seeded');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});