require('dotenv').config();
const db = require('./src/config/database');
const User = require('./src/models/User');

const deleteAdmin = async () => {
  try {
    await db.authenticate();
    console.log('Database connected successfully');

    const deleted = await User.destroy({
      where: { email: 'admin@volunteering.com' }
    });

    if (deleted) {
      console.log('✅ Admin user deleted successfully');
    } else {
      console.log('No admin user found with email: admin@volunteering.com');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

deleteAdmin();
