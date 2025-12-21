const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create enum type
        await queryInterface.sequelize.query('CREATE TYPE "enum_charities_verification_status" AS ENUM(\'pending\', \'approved\', \'rejected\');');

        await queryInterface.createTable('charities', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            organization_name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            registration_number: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            mission_statement: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            areas_of_focus: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: [],
                comment: 'e.g., Education, Environment, Healthcare'
            },
            website_url: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    isUrl: true
                }
            },
            logo: {
                type: DataTypes.STRING,
                allowNull: true
            },
            banner_image: {
                type: DataTypes.STRING,
                allowNull: true
            },
            address: {
                type: DataTypes.STRING,
                allowNull: true
            },
            city: {
                type: DataTypes.STRING,
                allowNull: true
            },
            state: {
                type: DataTypes.STRING,
                allowNull: true
            },
            postal_code: {
                type: DataTypes.STRING,
                allowNull: true
            },
            country: {
                type: DataTypes.STRING,
                allowNull: true
            },
            contact_email: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isEmail: true
                }
            },
            contact_phone: {
                type: DataTypes.STRING,
                allowNull: true
            },
            verification_status: {
                type: DataTypes.ENUM('pending', 'approved', 'rejected'),
                defaultValue: 'pending'
            },
            verification_notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            verified_by: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            verified_at: {
                type: DataTypes.DATE,
                allowNull: true
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            total_volunteers: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false
            },
            deleted_at: {
                type: DataTypes.DATE,
                allowNull: true
            }
        });

        // Add indexes
        await queryInterface.addIndex('charities', ['user_id'], { unique: true });
        await queryInterface.addIndex('charities', ['registration_number'], { unique: true });
        await queryInterface.addIndex('charities', ['verification_status']);
        await queryInterface.addIndex('charities', ['city']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('charities');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_charities_verification_status";');
    }
};