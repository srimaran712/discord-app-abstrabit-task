const cron = require('node-cron');
const axios = require('axios');


//register a cron job to run every 5 minutes
const job = cron.schedule('*/2 * * * *', async () => {
  
  try {
    const response = await axios.get('https://my-bot-fa1l.onrender.com/');
    console.log('Scheduled task completed successfully');
  } catch (error) {
    console.error('Error occurred while running scheduled task:', error);
  }

});

exports = { job };