const { DataTypes } = require('sequelize');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create enum types
        await queryInterface.sequelize.query('CREATE TYPE "enum_opportunities_location_type" AS ENUM(\'in-person\', \'virtual\', \'hybrid\');');
        await queryInterface.sequelize.query('CREATE TYPE "enum_opportunities_status" AS ENUM(\'draft\', \'published\', \'in_progress\', \'completed\', \'cancelled\', \'active\', \'suspended\');');
        await queryInterface.sequelize.query('CREATE TYPE "enum_opportunities_moderation_status" AS ENUM(\'pending\', \'approved\', \'rejected\');');
        await queryInterface.sequelize.query('CREATE TYPE "enum_opportunities_visibility" AS ENUM(\'public\', \'private\', \'invite_only\');');

        await queryInterface.createTable('opportunities', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            charity_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'charities',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            category: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: 'e.g., Education, Environment, Healthcare'
            },
            required_skills: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            required_qualifications: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            number_of_volunteers: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            volunteers_confirmed: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            location_type: {
                type: DataTypes.ENUM('in-person', 'virtual', 'hybrid'),
                allowNull: false,
                defaultValue: 'in-person'
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
            latitude: {
                type: DataTypes.DECIMAL(10, 8),
                allowNull: true
            },
            longitude: {
                type: DataTypes.DECIMAL(11, 8),
                allowNull: true
            },
            virtual_meeting_link: {
                type: DataTypes.STRING,
                allowNull: true
            },
            start_date: {
                type: DataTypes.DATE,
                allowNull: false
            },
            end_date: {
                type: DataTypes.DATE,
                allowNull: false
            },
            start_time: {
                type: DataTypes.TIME,
                allowNull: true
            },
            end_time: {
                type: DataTypes.TIME,
                allowNull: true
            },
            duration: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'Duration in hours'
            },
            is_recurring: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            recurrence_pattern: {
                type: DataTypes.JSONB,
                allowNull: true,
                comment: 'Pattern for recurring opportunities'
            },
            status: {
                type: DataTypes.ENUM('draft', 'published', 'in_progress', 'completed', 'cancelled', 'active', 'suspended'),
                defaultValue: 'draft'
            },
            visibility: {
                type: DataTypes.ENUM('public', 'private', 'invite_only'),
                defaultValue: 'public'
            },
            application_deadline: {
                type: DataTypes.DATE,
                allowNull: true
            },
            age_restriction: {
                type: DataTypes.JSONB,
                defaultValue: '{"min": 0, "max": null}'
            },
            physical_requirements: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            background_check_required: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            training_required: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            training_details: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            benefits: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: [],
                comment: 'e.g., Meals provided, Transport reimbursement'
            },
            images: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            contact_person: {
                type: DataTypes.STRING,
                allowNull: true
            },
            contact_email: {
                type: DataTypes.STRING,
                allowNull: true
            },
            contact_phone: {
                type: DataTypes.STRING,
                allowNull: true
            },
            moderation_status: {
                type: DataTypes.ENUM('pending', 'approved', 'rejected'),
                defaultValue: 'pending'
            },
            moderation_notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            moderated_by: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            moderated_at: {
                type: DataTypes.DATE,
                allowNull: true
            },
            closure_notes: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Notes provided when closing/completing the opportunity'
            },
            closed_at: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'When the opportunity was closed/completed'
            },
            views: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            is_featured: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            suspended_at: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'When the opportunity was suspended by moderator'
            },
            suspended_by: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                comment: 'Moderator who suspended the opportunity'
            },
            suspension_reason: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Reason provided for suspending the opportunity'
            },
            previous_status: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: 'Status before suspension to restore later'
            },
            resumed_at: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'When the opportunity was resumed'
            },
            resumed_by: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                comment: 'Moderator who resumed the opportunity'
            },
            deleted_by: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                comment: 'Moderator who deleted the opportunity'
            },
            deletion_reason: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Reason provided for deleting the opportunity'
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false
            }
        });

        // Add indexes
        await queryInterface.addIndex('opportunities', ['charity_id']);
        await queryInterface.addIndex('opportunities', ['status']);
        await queryInterface.addIndex('opportunities', ['start_date']);
        await queryInterface.addIndex('opportunities', ['city']);
        await queryInterface.addIndex('opportunities', ['category']);
        await queryInterface.addIndex('opportunities', ['moderation_status']);
        await queryInterface.addIndex('opportunities', ['visibility']);
        await queryInterface.addIndex('opportunities', ['is_featured']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('opportunities');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_opportunities_location_type";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_opportunities_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_opportunities_moderation_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_opportunities_visibility";');
    }
};