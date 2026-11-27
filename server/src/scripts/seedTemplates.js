const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template');

const templates = [
  {
    name: 'Web project proposal',
    sections: [
      { key: 'intro', title: 'Introduction', body: 'Thank you for the opportunity. This proposal describes how we will design and build your website.' },
      { key: 'scope', title: 'Scope of work', body: 'We will plan the pages, design the layout, build the site and test it on phones and computers.' },
      { key: 'timeline', title: 'Timeline', body: 'Week 1: planning and design. Weeks 2 to 3: development. Week 4: testing and launch.' },
      { key: 'terms', title: 'Terms', body: 'Payment is split in two parts: half to start and half on delivery. Two rounds of changes are included.' },
      { key: 'pricing', title: 'Pricing', body: 'The price below comes from your quote.' },
    ],
  },
  {
    name: 'Design project proposal',
    sections: [
      { key: 'intro', title: 'Introduction', body: 'Thank you for choosing us. This proposal describes the design work we will do for your brand.' },
      { key: 'scope', title: 'Scope of work', body: 'We will create the designs you chose, share drafts for feedback and deliver the final files.' },
      { key: 'timeline', title: 'Timeline', body: 'Week 1: first drafts. Week 2: feedback and changes. Week 3: final files.' },
      { key: 'terms', title: 'Terms', body: 'Payment is due before the final files are shared. Two rounds of changes are included.' },
      { key: 'pricing', title: 'Pricing', body: 'The price below comes from your quote.' },
    ],
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Template.deleteMany({});
  await Template.insertMany(templates);
  console.log('Templates seeded');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});