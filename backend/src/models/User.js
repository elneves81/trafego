const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    cpf: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true,
      validate: {
        len: [11, 11],
        isNumeric: true
      }
    },
    userType: {
      type: DataTypes.ENUM,
      values: ['admin', 'operator', 'driver', 'supervisor'],
      allowNull: false,
      defaultValue: 'driver'
    },
    status: {
      type: DataTypes.ENUM,
      values: ['active', 'inactive', 'suspended'],
      defaultValue: 'active'
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: true // Obrigatório apenas para motoristas
    },
    licenseExpiry: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    emergencyContact: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fcmToken: {
      type: DataTypes.TEXT,
      allowNull: true // Para notificações push
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Método de instância para verificar senha
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  // Método para retornar dados seguros (sem senha)
  User.prototype.toSafeObject = function() {
    const { password, ...safeUser } = this.toJSON();
    return safeUser;
  };

  // Scopes
  User.addScope('active', {
    where: {
      status: 'active'
    }
  });

  User.addScope('drivers', {
    where: {
      userType: 'driver'
    }
  });

  User.addScope('operators', {
    where: {
      userType: 'operator'
    }
  });

  User.addScope('online', {
    where: {
      isOnline: true
    }
  });

  return User;
};