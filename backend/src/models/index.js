const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'trafego',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? 
      (msg) => logger.info(msg) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '-03:00' // Horário de Brasília
  }
);

// Importar modelos
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Vehicle = require('./Vehicle')(sequelize, Sequelize.DataTypes);
const Ride = require('./Ride')(sequelize, Sequelize.DataTypes);
const Location = require('./Location')(sequelize, Sequelize.DataTypes);
const Notification = require('./Notification')(sequelize, Sequelize.DataTypes);
const Message = require('./Message')(sequelize, Sequelize.DataTypes);

// Definir associações
const db = {
  sequelize,
  Sequelize,
  User,
  Vehicle,
  Ride,
  Location,
  Notification,
  Message
};

// Associações User
User.hasMany(Ride, { as: 'driverRides', foreignKey: 'driverId' });
User.hasMany(Ride, { as: 'operatorRides', foreignKey: 'operatorId' });
User.hasMany(Vehicle, { foreignKey: 'driverId' });
User.hasMany(Location, { foreignKey: 'userId' });
User.hasMany(Notification, { foreignKey: 'userId' });
User.hasMany(Message, { as: 'sentMessages', foreignKey: 'senderId' });
User.hasMany(Message, { as: 'receivedMessages', foreignKey: 'recipientId' });

// Associações Vehicle
Vehicle.belongsTo(User, { as: 'driver', foreignKey: 'driverId' });
Vehicle.hasMany(Ride, { foreignKey: 'vehicleId' });

// Associações Ride
Ride.belongsTo(User, { as: 'driver', foreignKey: 'driverId' });
Ride.belongsTo(User, { as: 'operator', foreignKey: 'operatorId' });
Ride.belongsTo(Vehicle, { foreignKey: 'vehicleId' });
Ride.hasMany(Location, { foreignKey: 'rideId' });
Ride.hasMany(Message, { foreignKey: 'rideId' });

// Associações Location
Location.belongsTo(User, { foreignKey: 'userId' });
Location.belongsTo(Ride, { foreignKey: 'rideId' });

// Associações Notification
Notification.belongsTo(User, { foreignKey: 'userId' });

// Associações Message
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId' });
Message.belongsTo(Ride, { foreignKey: 'rideId' });

module.exports = db;